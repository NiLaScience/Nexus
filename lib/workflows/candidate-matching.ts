import { StateGraph, Annotation, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "langchain/output_parsers";
import { RunnableLambda } from "@langchain/core/runnables";
import { z } from "zod";
import { llm } from "@/lib/llm/config";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MAX_ITERATIONS = 5;

// Define the candidate profile schema
const candidateProfileSchema = z.object({
  id: z.string().optional().describe("Unique identifier for the candidate"),
  name: z.string().describe("Full name of the candidate"),
  background: z.string().describe("Professional background and summary"),
  skills: z.array(z.string()).describe("List of technical skills"),
  yearsOfExperience: z.number().describe("Total years of relevant experience"),
  achievements: z.array(z.string()).describe("Notable professional achievements"),
  matchScore: z.number().describe("Match score against job requirements (0-100)"),
  reasonForMatch: z.string().describe("Explanation of why this candidate matches"),
  scoringDetails: z.object({
    skillsScore: z.number(),
    experienceScore: z.number(),
    achievementsScore: z.number(),
    culturalScore: z.number(),
    leadershipScore: z.number().optional(),
    scoreBreakdown: z.string()
  }).optional().describe("Detailed scoring breakdown")
});

// Define the criteria refinement schema
const criteriaRefinementSchema = z.object({
  refinedCriteria: z.object({
    requiredSkills: z.array(z.object({
      skill: z.string(),
      importance: z.number().describe("A number between 1 and 5"),
      reason: z.string()
    })),
    preferredSkills: z.array(z.object({
      skill: z.string(),
      importance: z.number().describe("A number between 1 and 5"),
      reason: z.string()
    })),
    experienceLevel: z.object({
      minYears: z.number(),
      maxYears: z.number(),
      reason: z.string()
    }),
    culturalAttributes: z.array(z.object({
      attribute: z.string(),
      importance: z.number().describe("A number between 1 and 5"),
      reason: z.string()
    })),
    adjustments: z.array(z.object({
      aspect: z.string(),
      change: z.enum(["increased", "decreased", "unchanged"]),
      reason: z.string()
    }))
  }).describe("Structured refinements to the job criteria"),
  explanation: z.string().describe("Overall explanation of the refinements made")
});

// Define scoring criteria schema
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

// Define the evaluation output schema
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

// Define the workflow state
const StateAnnotation = Annotation.Root({
  jobDescriptionId: Annotation<string>(),
  structuredJobDescription: Annotation<any>(),
  candidates: Annotation<Array<z.infer<typeof candidateProfileSchema>>>({
    default: () => [],
    reducer: (a, b) => a.concat(b),
  }),
  evaluatedCandidates: Annotation<Array<z.infer<typeof candidateProfileSchema>>>({
    default: () => [],
    reducer: (a, b) => a.concat(b),
  }),
  finalCandidates: Annotation<Array<z.infer<typeof candidateProfileSchema>>>(),
  userFeedback: Annotation<Array<{
    candidateId: string,
    isGoodFit: boolean,
    feedback?: string
  }>>({
    default: () => [],
    reducer: (a, b) => a.concat(b),
  }),
  iterationCount: Annotation<number>({
    default: () => 0,
    reducer: (_, b) => b,
  }),
  shouldTerminate: Annotation<boolean>({
    default: () => false,
    reducer: (_, b) => b,
  }),
  refinedCriteria: Annotation<z.infer<typeof criteriaRefinementSchema>>({
    default: () => ({
      refinedCriteria: {
        requiredSkills: [],
        preferredSkills: [],
        experienceLevel: {
          minYears: 0,
          maxYears: 0,
          reason: ""
        },
        culturalAttributes: [],
        adjustments: []
      },
      explanation: ""
    }),
    reducer: (_, b) => b,
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
      experienceLevels: {
        minimum: 0,
        preferred: 0,
        maximum: 0,
        yearsWeight: 0.5
      },
      culturalCriteria: [],
      leadershipCriteria: []
    }),
    reducer: (_, b) => b,
  }),
  error: Annotation<string>(),
});

// Debug helper function
function logState(phase: string, state: typeof StateAnnotation.State) {
  console.log('\n=== Debug:', phase, '===');
  console.log('Iteration:', state.iterationCount);
  console.log('Candidates:', state.candidates?.length || 0);
  console.log('Evaluated Candidates:', state.evaluatedCandidates?.length || 0);
  console.log('Final Candidates:', state.finalCandidates?.length || 0);
  console.log('User Feedback:', state.userFeedback?.length || 0);
  console.log('Should Terminate:', state.shouldTerminate);
  console.log('Error:', state.error || 'none');
  console.log('Full State:', JSON.stringify(state, null, 2));
  console.log('=== End Debug ===\n');
}

// Node 0: Fetch job description from database
async function fetchJobDescription(state: typeof StateAnnotation.State) {
  console.log('\n🔍 Fetching job description...');
  try {
    const { data: jobDescription, error } = await supabase
      .from('job_descriptions')
      .select('parsed_content')
      .eq('id', state.jobDescriptionId)
      .single();

    if (error) throw new Error(`Failed to fetch job description: ${error.message}`);
    if (!jobDescription?.parsed_content) throw new Error('No parsed content found for job description');

    console.log('✅ Job description fetched successfully');
    return { 
      structuredJobDescription: jobDescription.parsed_content 
    };
  } catch (error) {
    console.error('❌ Error fetching job description:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to fetch job description',
      structuredJobDescription: null
    };
  }
}

// Node 1: Generate initial candidate profiles
async function generateCandidates(state: typeof StateAnnotation.State) {
  console.log('\n👥 Generating candidates...');
  console.log('Current iteration:', state.iterationCount);
  
  if (state.error || !state.structuredJobDescription) {
    console.error('❌ Cannot generate candidates:', state.error || 'No job description');
    return { candidates: [] };
  }

  const jobDesc = state.structuredJobDescription;
  const refinedCriteria = state.refinedCriteria || jobDesc;
  const isFinalIteration = state.iterationCount === MAX_ITERATIONS - 1;
  const candidateCount = isFinalIteration ? 10 : 5;
  
  console.log(`Generating ${candidateCount} candidates (${isFinalIteration ? 'final iteration' : 'normal iteration'})`);
  
  // Augment LLM with structured output for candidate generation
  const candidateGenerator = llm.withStructuredOutput(z.object({
    candidates: z.array(candidateProfileSchema)
  }));
  
  let contextPrompt = `Generate exactly ${candidateCount} diverse candidate profiles that would be strong matches for this job description.
  Focus on creating realistic profiles with varied backgrounds and skill sets that align with the requirements.
  
  Job Description and Requirements:
  ${JSON.stringify(refinedCriteria, null, 2)}`;

  // Add previous candidates and feedback context if available
  if (state.candidates.length > 0 && state.userFeedback.length > 0) {
    const previousCandidates = state.candidates.map(candidate => ({
      ...candidate,
      feedback: state.userFeedback.find(f => f.candidateId === candidate.id)?.isGoodFit ? "Good fit" : "Not a good fit"
    }));

    contextPrompt += `\n\nPreviously Generated Candidates and Their Feedback:
    ${JSON.stringify(previousCandidates, null, 2)}
    
    Based on the feedback above:
    1. Generate candidates that share positive qualities with candidates marked as "Good fit"
    2. Avoid qualities similar to candidates marked as "Not a good fit"
    3. Ensure the new candidates are distinct from all previous candidates
    4. Focus on the refined criteria while maintaining diversity`;
  }

  contextPrompt += `\n\nImportant:
  - Generate exactly ${candidateCount} candidates
  - Each candidate must be unique and different from any previously generated candidates
  - Ensure high relevance to the role while maintaining diverse backgrounds
  - Focus on qualities that have received positive feedback in previous iterations${isFinalIteration ? '\n  - This is the final iteration, so provide a wider range of qualified candidates' : ''}`;

  const result = await candidateGenerator.invoke(contextPrompt);
  console.log(`✅ Generated ${result.candidates.length} candidates`);
  return { candidates: result.candidates };
}

// Node 2: Evaluate and score candidates
async function evaluateCandidates(state: typeof StateAnnotation.State) {
  console.log('\n⭐ Evaluating candidates...');
  
  if (state.error || !state.structuredJobDescription || !state.candidates.length) {
    console.error('❌ Cannot evaluate candidates:', state.error || 'Missing data');
    return { evaluatedCandidates: [] };
  }

  const jobDesc = state.structuredJobDescription;
  const candidates = state.candidates;
  
  // Augment LLM with structured output for evaluation
  const evaluator = llm.withStructuredOutput(evaluationSchema);
  
  const prompt = `You are an expert technical recruiter evaluating candidates for the following job description:

${jobDesc}

The refined criteria based on previous feedback are:
${JSON.stringify(state.refinedCriteria, null, 2)}

Please evaluate each candidate using the following scoring criteria:
${JSON.stringify(state.scoringCriteria, null, 2)}

For each candidate, provide:
1. A total match score (0-100)
2. A breakdown of scores for each criterion
3. A detailed explanation of the scoring rationale

Candidates to evaluate:
${JSON.stringify(candidates, null, 2)}`;

  const result = await evaluator.invoke(prompt);
  
  const evaluatedCandidates = result.evaluations.map((evaluation) => ({
    ...candidates.find(c => c.id === evaluation.candidateId)!,
    matchScore: evaluation.matchScore,
    scoringDetails: evaluation.scoringDetails,
    reasonForMatch: evaluation.reasonForMatch
  }));

  console.log(`✅ Evaluated ${evaluatedCandidates.length} candidates`);
  return { evaluatedCandidates };
}

// Node 3: Final ranking and selection
async function rankCandidates(state: typeof StateAnnotation.State) {
  console.log('\n📊 Ranking candidates...');
  
  if (state.error || !state.evaluatedCandidates.length) {
    console.error('❌ Cannot rank candidates:', state.error || 'No candidates to rank');
    return { 
      finalCandidates: [],
      error: state.error || 'No candidates to rank'
    };
  }

  const isFinalIteration = state.iterationCount === MAX_ITERATIONS - 1;
  
  const finalCandidates = state.evaluatedCandidates
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, isFinalIteration ? undefined : 3);
  
  console.log(`✅ Selected ${finalCandidates.length} final candidates`);
  return { finalCandidates };
}

// Node 4: Store candidates in database
async function storeCandidates(state: typeof StateAnnotation.State) {
  console.log('\n💾 Storing candidates...');
  
  if (state.error || !state.finalCandidates?.length) {
    console.error('❌ Cannot store candidates:', state.error || 'No candidates to store');
    return { error: state.error || 'No candidates to store' };
  }

  const isFinalIteration = state.iterationCount === MAX_ITERATIONS - 1;

  try {
    // Map candidates to database schema
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

    // Insert candidates into database
    const { data: storedCandidates, error: candidateError } = await supabase
      .from('candidate_profiles')
      .insert(candidatesToInsert)
      .select('*');

    if (candidateError) throw new Error(`Failed to store candidates: ${candidateError.message}`);

    // If this is the final iteration, store the final state
    if (isFinalIteration) {
      // Calculate voting statistics
      const totalVotes = state.userFeedback.length;
      const upvotes = state.userFeedback.filter(f => f.isGoodFit).length;
      const upvotePercentage = totalVotes > 0 ? (upvotes / totalVotes) * 100 : 0;

      // Store final iteration data
      const { error: finalStateError } = await supabase
        .from('matching_iterations')
        .insert({
          job_description_id: state.jobDescriptionId,
          iteration_number: state.iterationCount,
          refined_criteria: state.refinedCriteria,
          scoring_criteria: state.scoringCriteria,
          feedback_summary: {
            total_votes: totalVotes,
            upvotes,
            upvote_percentage: upvotePercentage,
            feedback_details: state.userFeedback
          },
          is_final: true
        });

      if (finalStateError) throw new Error(`Failed to store final state: ${finalStateError.message}`);

      // Update job description status
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

      if (jobUpdateError) throw new Error(`Failed to update job status: ${jobUpdateError.message}`);
    }

    // Map stored candidates back to our schema format with IDs
    const candidatesWithIds = storedCandidates.map(stored => ({
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
    return { 
      finalCandidates: candidatesWithIds
    };
  } catch (error) {
    console.error('Error storing candidates:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to store candidates',
      finalCandidates: state.finalCandidates
    };
  }
}

// Node 5: Process user feedback and refine criteria
async function processFeedback(state: typeof StateAnnotation.State) {
  console.log('\n📝 Processing feedback...');
  console.log('Current iteration:', state.iterationCount);
  console.log('Feedback count:', state.userFeedback?.length || 0);
  
  // Check iteration limit
  if (state.iterationCount >= MAX_ITERATIONS - 1) {
    console.log('🏁 Reached maximum iterations, terminating');
    return { 
      refinedCriteria: state.refinedCriteria,
      shouldTerminate: true,
      iterationCount: state.iterationCount + 1
    };
  }

  if (!state.userFeedback?.length) {
    console.log('ℹ️ No feedback to process');
    return { refinedCriteria: state.structuredJobDescription };
  }

  // Augment LLM with structured output for criteria refinement
  const refiner = llm.withStructuredOutput(criteriaRefinementSchema);

  // Map feedback to candidates for context
  const feedbackWithCandidates = state.userFeedback.map(feedback => {
    const candidate = state.candidates.find(c => c.id === feedback.candidateId);
    return {
      candidate,
      isGoodFit: feedback.isGoodFit,
      feedback: feedback.feedback
    };
  });

  const prompt = `Analyze the feedback on candidates and refine the job requirements to generate better matches.
  
  Original Job Description:
  ${JSON.stringify(state.structuredJobDescription, null, 2)}
  
  Previous Refinements (if any):
  ${state.refinedCriteria ? JSON.stringify(state.refinedCriteria, null, 2) : "None"}
  
  Candidate Feedback:
  ${JSON.stringify(feedbackWithCandidates, null, 2)}
  
  Instructions:
  1. Analyze patterns in what made candidates good or poor fits
  2. Adjust skill requirements based on successful matches
  3. Refine experience levels based on feedback
  4. Update cultural attributes based on fit
  5. Document each change and why it was made
  6. Build upon previous refinements if they were successful
  
  Return a structured refinement that clearly shows:
  - Which skills became more/less important
  - How experience requirements changed
  - What cultural attributes matter most
  - Clear reasoning for each adjustment
  
  Important: Maintain the schema structure with all required fields:
  - requiredSkills and preferredSkills (with importance 1-5)
  - experienceLevel (min/max years)
  - culturalAttributes (with importance 1-5)
  - adjustments tracking what changed`;

  const result = await refiner.invoke(prompt);
  
  // Store iteration in database
  try {
    const { error } = await supabase
      .from('matching_iterations')
      .insert({
        job_description_id: state.jobDescriptionId,
        iteration_number: state.iterationCount + 1,
        refined_criteria: result.refinedCriteria,
        feedback_summary: result.explanation
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error storing iteration:', error);
  }

  console.log('✅ Processed feedback and refined criteria');
  return { 
    refinedCriteria: result.refinedCriteria,
    iterationCount: state.iterationCount + 1
  };
}

// Node 6: Check if we should continue iterating
function shouldContinue(state: typeof StateAnnotation.State) {
  console.log('\n🔄 Checking iteration status...');
  console.log('Current iteration:', state.iterationCount);
  console.log('Has feedback:', !!state.userFeedback?.length);
  
  // Stop if we've reached max iterations or have no feedback
  if (state.iterationCount >= MAX_ITERATIONS - 1 || !state.userFeedback?.length) {
    console.log('🛑 Workflow complete');
    return "complete";
  }
  
  console.log('➡️ Continuing to next iteration');
  return "iterate";
}

// Node for waiting for feedback
const waitForFeedback = RunnableLambda.from(async () => {
  console.log('\n⏳ Waiting for feedback...');
  throw new Error("Waiting for feedback");
});

// Build the workflow
export const candidateMatchingWorkflow = new StateGraph(StateAnnotation)
  .addNode("fetchJobDescription", fetchJobDescription)
  .addNode("generateCandidates", generateCandidates)
  .addNode("evaluateCandidates", evaluateCandidates)
  .addNode("rankCandidates", rankCandidates)
  .addNode("storeCandidates", storeCandidates)
  .addNode("waitForFeedback", waitForFeedback)
  .addNode("processFeedback", processFeedback)
  .addEdge("__start__", "fetchJobDescription")
  .addEdge("fetchJobDescription", "generateCandidates")
  .addEdge("generateCandidates", "evaluateCandidates")
  .addEdge("evaluateCandidates", "rankCandidates")
  .addEdge("rankCandidates", "storeCandidates")
  .addConditionalEdges(
    "storeCandidates",
    shouldContinue,
    {
      "iterate": "waitForFeedback",
      "complete": "__end__"
    }
  )
  .addEdge("waitForFeedback", "processFeedback")
  .addEdge("processFeedback", "generateCandidates")
  .compile();

