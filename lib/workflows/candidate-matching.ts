import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import { llm } from "@/lib/llm/config";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define the candidate profile schema
const candidateProfileSchema = z.object({
  name: z.string().describe("Full name of the candidate"),
  background: z.string().describe("Professional background and summary"),
  skills: z.array(z.string()).describe("List of technical skills"),
  yearsOfExperience: z.number().describe("Total years of relevant experience"),
  achievements: z.array(z.string()).describe("Notable professional achievements"),
  matchScore: z.number().describe("Match score against job requirements (0-100)"),
  reasonForMatch: z.string().describe("Explanation of why this candidate matches"),
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
  refinedCriteria: Annotation<string>({
    default: () => '',
    reducer: (_, b) => b,
  }),
  error: Annotation<string>(),
});

// Node 0: Fetch job description from database
async function fetchJobDescription(state: typeof StateAnnotation.State) {
  try {
    const { data: jobDescription, error } = await supabase
      .from('job_descriptions')
      .select('parsed_content')
      .eq('id', state.jobDescriptionId)
      .single();

    if (error) throw new Error(`Failed to fetch job description: ${error.message}`);
    if (!jobDescription?.parsed_content) throw new Error('No parsed content found for job description');

    return { 
      structuredJobDescription: jobDescription.parsed_content 
    };
  } catch (error) {
    console.error('Error fetching job description:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to fetch job description',
      structuredJobDescription: null
    };
  }
}

// Node 1: Generate initial candidate profiles
async function generateCandidates(state: typeof StateAnnotation.State) {
  if (state.error || !state.structuredJobDescription) {
    return { candidates: [] };
  }

  const jobDesc = state.structuredJobDescription;
  
  // Augment LLM with structured output for candidate generation
  const candidateGenerator = llm.withStructuredOutput(z.object({
    candidates: z.array(candidateProfileSchema)
  }));
  
  const prompt = `Generate exactly 3 diverse candidate profiles that would be strong matches for this job description.
  Focus on creating realistic profiles with varied backgrounds and skill sets that align with the requirements.
  
  Job Description:
  ${JSON.stringify(jobDesc, null, 2)}
  
  Generate candidates with realistic names, backgrounds, and qualifications that would be strong matches.
  Ensure diversity in experience levels and backgrounds while maintaining high relevance to the role.
  
  Important: You must return exactly 3 candidates.`;

  const result = await candidateGenerator.invoke(prompt);
  return { candidates: result.candidates };
}

// Node 2: Evaluate and score candidates
async function evaluateCandidates(state: typeof StateAnnotation.State) {
  if (state.error || !state.structuredJobDescription || !state.candidates.length) {
    return { evaluatedCandidates: [] };
  }

  const jobDesc = state.structuredJobDescription;
  const candidates = state.candidates;
  
  // Augment LLM with structured output for evaluation
  const evaluator = llm.withStructuredOutput(z.object({
    evaluatedCandidates: z.array(candidateProfileSchema)
  }));
  
  const prompt = `Evaluate these candidate profiles against the job requirements.
  For each candidate, provide a detailed assessment and assign a match score (0-100).
  
  Job Description:
  ${JSON.stringify(jobDesc, null, 2)}
  
  Candidates to Evaluate:
  ${JSON.stringify(candidates, null, 2)}
  
  Evaluate each candidate on:
  1. Skills match
  2. Experience level
  3. Leadership capabilities (if required)
  4. Cultural fit
  5. Growth potential
  
  Provide a detailed reasonForMatch explaining the score.`;

  const result = await evaluator.invoke(prompt);
  return { evaluatedCandidates: result.evaluatedCandidates };
}

// Node 3: Final ranking and selection
async function rankCandidates(state: typeof StateAnnotation.State) {
  if (state.error || !state.evaluatedCandidates.length) {
    return { 
      finalCandidates: [],
      error: state.error || 'No candidates to rank'
    };
  }

  const evaluatedCandidates = state.evaluatedCandidates;
  
  // Sort by match score and take top candidates
  const finalCandidates = [...evaluatedCandidates]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
  
  return { finalCandidates };
}

// Node 4: Store candidates in database
async function storeCandidates(state: typeof StateAnnotation.State) {
  if (state.error || !state.finalCandidates?.length) {
    return { error: state.error || 'No candidates to store' };
  }

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
      status: 'generated',
      judge_evaluation: {
        score: candidate.matchScore,
        reason: candidate.reasonForMatch
      }
    }));

    // Insert candidates into database
    const { data: storedCandidates, error } = await supabase
      .from('candidate_profiles')
      .insert(candidatesToInsert)
      .select('*');

    if (error) throw new Error(`Failed to store candidates: ${error.message}`);

    // Map stored candidates back to our schema format with IDs
    const candidatesWithIds = storedCandidates.map(stored => ({
      id: stored.id,
      name: stored.name,
      background: stored.background,
      skills: stored.skills,
      yearsOfExperience: stored.years_of_experience,
      achievements: stored.achievements,
      matchScore: stored.score,
      reasonForMatch: stored.judge_evaluation.reason
    }));

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
  if (!state.userFeedback?.length) {
    return { refinedCriteria: state.structuredJobDescription };
  }

  // Augment LLM with structured output for criteria refinement
  const refiner = llm.withStructuredOutput(z.object({
    refinedCriteria: z.string().describe("Refined job criteria based on feedback"),
    explanation: z.string().describe("Explanation of the refinements made")
  }));

  const prompt = `Based on user feedback for candidate profiles, refine the job requirements to generate better matches.
  
  Original Job Description:
  ${JSON.stringify(state.structuredJobDescription, null, 2)}
  
  User Feedback:
  ${JSON.stringify(state.userFeedback, null, 2)}
  
  Analyze the feedback patterns and suggest refined criteria that will help generate more suitable candidates.
  Focus on both what users liked and disliked about the candidates.`;

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

  return { 
    refinedCriteria: result.refinedCriteria,
    iterationCount: state.iterationCount + 1
  };
}

// Node 6: Check if we should continue iterating
function shouldContinue(state: typeof StateAnnotation.State) {
  // Stop after 3 iterations or if no feedback received
  if (state.iterationCount >= 3 || !state.userFeedback?.length) {
    return "complete";
  }
  
  // Continue if we have feedback to process
  return "iterate";
}

// Build the workflow
export const candidateMatchingWorkflow = new StateGraph(StateAnnotation)
  .addNode("fetchJobDescription", fetchJobDescription)
  .addNode("generateCandidates", generateCandidates)
  .addNode("evaluateCandidates", evaluateCandidates)
  .addNode("rankCandidates", rankCandidates)
  .addNode("storeCandidates", storeCandidates)
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
      "iterate": "processFeedback",
      "complete": "__end__"
    }
  )
  .addEdge("processFeedback", "generateCandidates")
  .compile();

