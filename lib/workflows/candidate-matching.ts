// File: /Users/gauntlet/Documents/projects/nexus/lib/workflows/candidate-matching.ts
/**
 * Candidate Matching Workflow with Generation History and Initial Criteria
 *
 * This workflow performs iterative candidate generation, evaluation, ranking,
 * and storage, incorporating human feedback across iterations. It now ensures
 * that the job description is provided during candidate generation and that
 * initial selection criteria (refinedCriteria) are generated if absent.
 *
 * Requirements:
 * - Environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.
 * - Supabase tables for job_descriptions, candidate_profiles, and matching_iterations must be configured.
 * - Optionally integrate a persistent checkpointer for state persistence.
 *
 * References:
 * - LangGraph documentation on state management.
 */

import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { z } from "zod";
import { llm } from "@/lib/llm/config";
import { createClient } from '@supabase/supabase-js';
import { RunnableLambda } from "@langchain/core/runnables";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MAX_ITERATIONS = 5;

// Candidate profile schema
const candidateProfileSchema = z.object({
  id: z.string().optional().describe("Unique candidate ID"),
  name: z.string().describe("Candidate full name"),
  background: z.string().describe("Professional background and summary"),
  skills: z.array(z.string()).describe("Technical skills"),
  yearsOfExperience: z.number().describe("Years of relevant experience"),
  achievements: z.array(z.string()).describe("Professional achievements"),
  matchScore: z.number().describe("Match score (0-100)"),
  reasonForMatch: z.string().describe("Why the candidate matches"),
  scoringDetails: z.object({
    skillsScore: z.number(),
    experienceScore: z.number(),
    achievementsScore: z.number(),
    culturalScore: z.number(),
    leadershipScore: z.number().optional(),
    scoreBreakdown: z.string()
  }).optional().describe("Detailed scoring breakdown")
});

// Criteria refinement schema (for user feedback)
const criteriaRefinementSchema = z.object({
  refinedCriteria: z.object({
    requiredSkills: z.array(z.object({
      skill: z.string(),
      importance: z.number().describe("Importance 1-5"),
      reason: z.string()
    })),
    preferredSkills: z.array(z.object({
      skill: z.string(),
      importance: z.number().describe("Importance 1-5"),
      reason: z.string()
    })),
    experienceLevel: z.object({
      minYears: z.number(),
      maxYears: z.number(),
      reason: z.string()
    }),
    culturalAttributes: z.array(z.object({
      attribute: z.string(),
      importance: z.number().describe("Importance 1-5"),
      reason: z.string()
    })),
    adjustments: z.array(z.object({
      aspect: z.string(),
      change: z.enum(["increased", "decreased", "unchanged"]),
      reason: z.string()
    }))
  }).describe("Refined job criteria"),
  explanation: z.string().describe("Explanation of changes")
});

// Scoring criteria schema for evaluation
const scoringCriteriaSchema = z.object({
  skillsWeight: z.number().min(0).max(1),
  experienceWeight: z.number().min(0).max(1),
  achievementsWeight: z.number().min(0).max(1),
  culturalWeight: z.number().min(0).max(1),
  leadershipWeight: z.number().min(0).max(1),
  requiredSkills: z.array(z.object({
    skill: z.string(),
    weight: z.number().min(1).max(5)
  })),
  preferredSkills: z.array(z.object({
    skill: z.string(),
    weight: z.number().min(1).max(3)
  })),
  experienceLevels: z.object({
    minimum: z.number(),
    preferred: z.number(),
    maximum: z.number(),
    yearsWeight: z.number().min(0).max(1)
  }),
  culturalCriteria: z.array(z.object({
    attribute: z.string(),
    weight: z.number().min(1).max(5)
  })),
  leadershipCriteria: z.array(z.object({
    attribute: z.string(),
    weight: z.number().min(1).max(5)
  })).optional()
});

// Evaluation schema for candidate scoring output
const evaluationSchema = z.object({
  evaluations: z.array(z.object({
    candidateId: z.string(),
    matchScore: z.number(),
    scoringDetails: z.object({
      skillsScore: z.number(),
      experienceScore: z.number(),
      achievementsScore: z.number(),
      culturalFitScore: z.number(),
      leadershipScore: z.number().optional()
    }),
    reasonForMatch: z.string()
  }))
});

// Define the workflow state using annotations.
// A new "candidateHistory" channel is added to accumulate candidates over iterations.
const StateAnnotation = Annotation.Root({
  jobDescriptionId: Annotation<string>(),
  structuredJobDescription: Annotation<any>(),
  // Current iteration candidates (overwritten each iteration)
  candidates: Annotation<Array<z.infer<typeof candidateProfileSchema>>>({
    default: () => [],
    reducer: (_, curr) => curr,
  }),
  evaluatedCandidates: Annotation<Array<z.infer<typeof candidateProfileSchema>>>({
    default: () => [],
    reducer: (_, curr) => curr,
  }),
  finalCandidates: Annotation<Array<z.infer<typeof candidateProfileSchema>>>(),
  userFeedback: Annotation<Array<{ candidateId: string, isGoodFit: boolean, feedback?: string }>>({
    default: () => [],
    reducer: (_, curr) => curr,
  }),
  iterationCount: Annotation<number>({
    default: () => 0,
    reducer: (_, curr) => curr,
  }),
  shouldTerminate: Annotation<boolean>({
    default: () => false,
    reducer: (_, curr) => curr,
  }),
  // Accumulate all generated candidates over iterations.
  candidateHistory: Annotation<Array<z.infer<typeof candidateProfileSchema>>>({
    default: () => [],
    reducer: (prev = [], curr) => [...prev, ...curr],
  }),
  refinedCriteria: Annotation<z.infer<typeof criteriaRefinementSchema>>({
    default: () => ({
      refinedCriteria: {
        requiredSkills: [],
        preferredSkills: [],
        experienceLevel: { minYears: 0, maxYears: 0, reason: "" },
        culturalAttributes: [],
        adjustments: []
      },
      explanation: ""
    }),
    reducer: (_, curr) => curr,
  }),
  scoringCriteria: Annotation<z.infer<typeof scoringCriteriaSchema>>({
    default: () => ({
      skillsWeight: 0.3,
      experienceWeight: 0.2,
      achievementsWeight: 0.2,
      culturalWeight: 0.2,
      leadershipWeight: 0.1,
      requiredSkills: [],
      preferredSkills: [],
      experienceLevels: { minimum: 0, preferred: 0, maximum: 0, yearsWeight: 0.5 },
      culturalCriteria: [],
      leadershipCriteria: []
    }),
    reducer: (_, curr) => curr,
  }),
  error: Annotation<string>(),
});

// Helper function to log state
function logState(phase: string, state: typeof StateAnnotation.State) {
  console.log('\n=== Debug:', phase, '===');
  console.log('Iteration:', state.iterationCount);
  console.log('Candidates:', state.candidates?.length || 0);
  console.log('Candidate History:', state.candidateHistory?.length || 0);
  console.log('Evaluated Candidates:', state.evaluatedCandidates?.length || 0);
  console.log('Final Candidates:', state.finalCandidates ? state.finalCandidates.length : 0);
  console.log('User Feedback:', state.userFeedback?.length || 0);
  console.log('Should Terminate:', state.shouldTerminate);
  console.log('Refined Criteria:', state.refinedCriteria);
  console.log('Full State:', JSON.stringify(state, null, 2));
  console.log('=== End Debug ===\n');
}

/**
 * Node: Fetch job description from Supabase.
 * Now also generates initial refinedCriteria if not yet set.
 */
async function fetchJobDescription(state: typeof StateAnnotation.State) {
  console.log('\n🔍 Fetching job description...');
  try {
    const { data: jobDescription, error } = await supabase
      .from('job_descriptions')
      .select('parsed_content')
      .eq('id', state.jobDescriptionId)
      .single();
    if (error) throw new Error(`Failed to fetch job description: ${error.message}`);
    if (!jobDescription) throw new Error('Job description not found');
    const jobDesc = jobDescription.parsed_content;
    console.log('✅ Job description fetched successfully');

    // If refinedCriteria is empty (e.g. no required skills), generate initial criteria
    let newRefinedCriteria = state.refinedCriteria;
    if (
      !state.refinedCriteria ||
      !state.refinedCriteria.refinedCriteria.requiredSkills ||
      state.refinedCriteria.refinedCriteria.requiredSkills.length === 0
    ) {
      const initialCriteriaPrompt = `Based on the following job description, generate initial selection criteria (including required skills, preferred skills, experience level, and cultural attributes) in JSON format that matches this schema:
${JSON.stringify(criteriaRefinementSchema.shape, null, 2)}

Job Description:
${JSON.stringify(jobDesc, null, 2)}

Return a JSON object.`;
      try {
        const initialCriteriaStr = await llm.invoke(initialCriteriaPrompt);
        let parsedInitialCriteria;
        try {
          parsedInitialCriteria = JSON.parse(initialCriteriaStr.toString());
        } catch (e) {
          console.error("Error parsing initial criteria, using defaults.");
          parsedInitialCriteria = {
            refinedCriteria: {
              requiredSkills: [],
              preferredSkills: [],
              experienceLevel: { minYears: 0, maxYears: 0, reason: "" },
              culturalAttributes: [],
              adjustments: []
            },
            explanation: "Default criteria"
          };
        }
        newRefinedCriteria = parsedInitialCriteria;
        console.log("Initial refined criteria generated:", newRefinedCriteria);
      } catch (error) {
        console.error("Error generating initial criteria:", error);
      }
    }
    return { structuredJobDescription: jobDesc, refinedCriteria: newRefinedCriteria };
  } catch (error) {
    console.error('❌ Error in fetchJobDescription:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch job description' };
  }
}

/**
 * Node: Generate candidate profiles.
 * Incorporates candidateHistory and includes the job description in the prompt.
 */
async function generateCandidates(state: typeof StateAnnotation.State) {
  console.log('\n👥 Generating candidates...');
  console.log('Current iteration:', state.iterationCount);
  
  if (state.error || !state.structuredJobDescription) {
    console.error('❌ Cannot generate candidates:', state.error || 'No job description');
    return { candidates: [] };
  }
  
  const jobDesc = state.structuredJobDescription;
  const refinedCriteria = state.refinedCriteria || {};
  const isFinalIteration = state.iterationCount === MAX_ITERATIONS - 1;
  const candidateCount = isFinalIteration ? 10 : 5;
  
  // Prepare candidate history section for the prompt.
  const candidateHistoryPrompt = state.candidateHistory && state.candidateHistory.length
    ? `Previously generated candidates:\n${JSON.stringify(state.candidateHistory, null, 2)}\n\nEnsure new candidates are distinct.`
    : "";
  
  const contextPrompt = `Generate exactly ${candidateCount} diverse candidate profiles that match the following job description.
  
Job Description:
${JSON.stringify(jobDesc, null, 2)}

Refined Criteria:
${JSON.stringify(refinedCriteria, null, 2)}

${candidateHistoryPrompt}

Important:
- Generate exactly ${candidateCount} new and unique candidates.
- Avoid duplicating attributes from previous iterations.`;
  
  try {
    const candidateGenerator = llm.withStructuredOutput(
      z.object({ candidates: z.array(candidateProfileSchema) })
    );
    const result = await candidateGenerator.invoke(contextPrompt);
    console.log(`✅ Generated ${result.candidates.length} candidates`);
    return { candidates: result.candidates };
  } catch (error) {
    console.error('❌ Error generating candidates:', error);
    return { error: error instanceof Error ? error.message : 'Candidate generation failed', candidates: [] };
  }
}

/**
 * Node: Evaluate and score generated candidates.
 */
async function evaluateCandidates(state: typeof StateAnnotation.State) {
  console.log('\n⭐ Evaluating candidates...');
  
  if (state.error || !state.structuredJobDescription || !state.candidates.length) {
    console.error('❌ Cannot evaluate candidates:', state.error || 'Missing data');
    return { evaluatedCandidates: [] };
  }
  
  const evaluator = llm.withStructuredOutput(evaluationSchema);
  const prompt = `Evaluate the following candidate profiles against the job description and refined criteria.
Job Description:
${JSON.stringify(state.structuredJobDescription, null, 2)}

Refined Criteria:
${JSON.stringify(state.refinedCriteria, null, 2)}

Scoring Criteria:
${JSON.stringify(state.scoringCriteria, null, 2)}

Candidate Profiles:
${JSON.stringify(state.candidates, null, 2)}

For each candidate, provide:
- Total match score (0-100)
- A breakdown of scores (skills, experience, achievements, cultural fit, and leadership if applicable)
- Detailed reasoning for the score`;
  
  try {
    const result = await evaluator.invoke(prompt);
    const evaluatedCandidates = result.evaluations.map((evaluation: any) => {
      const candidate = state.candidates.find((c: any) => c.id === evaluation.candidateId);
      return {
        ...candidate,
        matchScore: evaluation.matchScore,
        scoringDetails: evaluation.scoringDetails,
        reasonForMatch: evaluation.reasonForMatch
      };
    });
    console.log(`✅ Evaluated ${evaluatedCandidates.length} candidates`);
    return { evaluatedCandidates };
  } catch (error) {
    console.error('❌ Error evaluating candidates:', error);
    return { error: error instanceof Error ? error.message : 'Evaluation failed', evaluatedCandidates: [] };
  }
}

/**
 * Node: Rank candidates and select final set.
 */
function rankCandidates(state: typeof StateAnnotation.State) {
  console.log('\n📊 Ranking candidates...');
  if (state.error || !state.evaluatedCandidates.length) {
    const errMsg = state.error || 'No evaluated candidates to rank';
    console.error('❌', errMsg);
    return { finalCandidates: [], error: errMsg };
  }
  const isFinalIteration = state.iterationCount === MAX_ITERATIONS - 1;
  const sorted = [...state.evaluatedCandidates].sort((a, b) => b.matchScore - a.matchScore);
  const finalCandidates = isFinalIteration ? sorted : sorted.slice(0, 3);
  console.log(`✅ Selected ${finalCandidates.length} final candidates`);
  return { finalCandidates };
}

/**
 * Node: Store the final candidates in Supabase.
 */
async function storeCandidates(state: typeof StateAnnotation.State) {
  console.log('\n💾 Storing candidates...');
  if (state.error || !state.finalCandidates?.length) {
    const errMsg = state.error || 'No candidates to store';
    console.error('❌', errMsg);
    return { error: errMsg, finalCandidates: state.finalCandidates };
  }
  
  const isFinalIteration = state.iterationCount === MAX_ITERATIONS - 1;
  const candidatesToInsert = state.finalCandidates.map(candidate => ({
    job_description_id: state.jobDescriptionId,
    name: candidate.name,
    background: candidate.background,
    skills: candidate.skills,
    years_of_experience: candidate.yearsOfExperience,
    achievements: candidate.achievements,
    score: candidate.matchScore,
    status: isFinalIteration ? 'final' : 'generated',
    judge_evaluation: {
      score: candidate.matchScore,
      reason: candidate.reasonForMatch,
      scoring_details: candidate.scoringDetails
    }
  }));
  
  try {
    const { data: storedCandidates, error: candidateError } = await supabase
      .from('candidate_profiles')
      .insert(candidatesToInsert)
      .select('*');
    if (candidateError) throw new Error(`Failed to store candidates: ${candidateError.message}`);
    
    if (isFinalIteration) {
      const totalVotes = state.userFeedback.length;
      const upvotes = state.userFeedback.filter(f => f.isGoodFit).length;
      const upvotePercentage = totalVotes > 0 ? (upvotes / totalVotes) * 100 : 0;
      
      const { error: finalStateError } = await supabase
        .from('matching_iterations')
        .insert({
          job_description_id: state.jobDescriptionId,
          iteration_number: state.iterationCount,
          refined_criteria: state.refinedCriteria,
          feedback_summary: {
            total_votes: totalVotes,
            upvotes,
            upvote_percentage: upvotePercentage,
            feedback_details: state.userFeedback
          },
          is_final: true
        });
      if (finalStateError) throw new Error(`Failed to store final iteration: ${finalStateError.message}`);
      
      const { error: jobUpdateError } = await supabase
        .from('job_descriptions')
        .update({ 
          status: 'completed',
          final_criteria: state.refinedCriteria,
          final_scoring: state.scoringCriteria,
          voting_stats: {
            total_votes: totalVotes,
            upvote_percentage: upvotePercentage
          }
        })
        .eq('id', state.jobDescriptionId);
      if (jobUpdateError) throw new Error(`Failed to update job description: ${jobUpdateError.message}`);
    }
    
    const candidatesWithIds = storedCandidates.map((stored: any) => ({
      id: stored.id,
      name: stored.name,
      background: stored.background,
      skills: stored.skills,
      yearsOfExperience: stored.years_of_experience,
      achievements: stored.achievements,
      matchScore: stored.score,
      reasonForMatch: stored.judge_evaluation.reason,
      scoringDetails: stored.judge_evaluation.scoring_details
    }));
    console.log('✅ Stored candidates successfully');
    logState('After storing candidates', state);
    return { finalCandidates: candidatesWithIds };
  } catch (error) {
    console.error('❌ Error storing candidates:', error);
    return { error: error instanceof Error ? error.message : 'Failed to store candidates', finalCandidates: state.finalCandidates };
  }
}

/**
 * Node: Process user feedback and refine criteria.
 */
async function processFeedback(state: typeof StateAnnotation.State) {
  console.log('\n📝 Processing feedback...');
  console.log('Current iteration:', state.iterationCount);
  console.log('Feedback count:', state.userFeedback?.length || 0);
  
  // If maximum iterations reached, signal termination.
  if (state.iterationCount >= MAX_ITERATIONS - 1) {
    console.log('🏁 Maximum iterations reached. Terminating workflow.');
    return { refinedCriteria: state.refinedCriteria, shouldTerminate: true, iterationCount: state.iterationCount + 1 };
  }
  
  // If no new feedback, keep refinedCriteria unchanged.
  if (!state.userFeedback?.length) {
    console.log('ℹ️ No new feedback. Keeping existing refined criteria.');
    return { refinedCriteria: state.refinedCriteria, iterationCount: state.iterationCount + 1 };
  }
  
  const refiner = llm.withStructuredOutput(criteriaRefinementSchema);
  
  const feedbackWithCandidates = state.userFeedback.map(feedback => {
    const candidate = state.candidates.find(c => c.id === feedback.candidateId);
    return { candidate, isGoodFit: feedback.isGoodFit, feedback: feedback.feedback };
  });
  
  const prompt = `Analyze the candidate feedback below and refine the job criteria.
  
Original Job Description:
${JSON.stringify(state.structuredJobDescription, null, 2)}

Current Refined Criteria:
${JSON.stringify(state.refinedCriteria, null, 2)}

Candidate Feedback:
${JSON.stringify(feedbackWithCandidates, null, 2)}

Instructions:
1. Identify patterns in the feedback.
2. Adjust required and preferred skills based on positive feedback.
3. Modify experience levels and cultural attributes if needed.
4. Clearly explain each change.

Return a JSON object with the refined criteria and an explanation.`;
  
  try {
    const result = await refiner.invoke(prompt);
    try {
      const { error } = await supabase
        .from('matching_iterations')
        .insert({
          job_description_id: state.jobDescriptionId,
          iteration_number: state.iterationCount + 1,
          refined_criteria: result.refinedCriteria,
          feedback_summary: result.explanation
        });
      if (error) console.error('❌ Error storing iteration feedback:', error);
    } catch (storeError) {
      console.error('❌ Iteration feedback storage error:', storeError);
    }
    console.log('✅ Feedback processed and criteria refined.');
    return { refinedCriteria: result.refinedCriteria, iterationCount: state.iterationCount + 1 };
  } catch (error) {
    console.error('❌ Error processing feedback:', error);
    return { error: error instanceof Error ? error.message : 'Feedback processing failed' };
  }
}


/**
 * Node: Wait for feedback.
 * Instead of throwing an error, we return a waiting signal.
 */
const waitForFeedback = RunnableLambda.from(async () => {
  console.log('\n⏳ Waiting for feedback...');
  return { waiting: true };
});

/**
 * Build and compile the candidate matching workflow graph.
 */
export const candidateMatchingWorkflow = new StateGraph(StateAnnotation)
  .addNode("fetchJobDescription", fetchJobDescription)
  .addNode("generateCandidates", generateCandidates)
  .addNode("evaluateCandidates", evaluateCandidates)
  .addNode("rankCandidates", rankCandidates)
  .addNode("storeCandidates", storeCandidates)
  .addNode("waitForFeedback", waitForFeedback)
  .addNode("processFeedback", processFeedback)
  .addEdge(START, "fetchJobDescription")
  .addEdge("fetchJobDescription", "generateCandidates")
  .addEdge("generateCandidates", "evaluateCandidates")
  .addEdge("evaluateCandidates", "rankCandidates")
  .addEdge("rankCandidates", "storeCandidates")
  .addConditionalEdges(
    "storeCandidates",
    (state) =>
      state.iterationCount >= MAX_ITERATIONS - 1 || !state.userFeedback?.length ? "complete" : "iterate",
    { "iterate": "waitForFeedback", "complete": END }
  )
  .addEdge("waitForFeedback", "processFeedback")
  .addEdge("processFeedback", "generateCandidates")
  .compile();
