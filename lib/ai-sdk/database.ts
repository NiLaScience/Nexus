import { createClient } from '@supabase/supabase-js';
import type { 
  CandidateFeedback, 
  CriteriaRefinement 
} from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function storeGeneratedCandidates(
  jobDescriptionId: string,
  candidates: any[],
  isFinal: boolean = false
) {
  const candidatesToInsert = candidates.map(candidate => ({
    id: candidate.id,
    job_description_id: jobDescriptionId,
    name: candidate.name,
    background: candidate.background,
    skills: candidate.skills,
    years_of_experience: candidate.yearsOfExperience,
    achievements: candidate.achievements,
    score: candidate.matchScore,
    status: isFinal ? 'final' : 'generated',
    judge_evaluation: {
      score: candidate.matchScore,
      reason: candidate.reasonForMatch,
      scoring_details: candidate.scoringDetails
    }
  }));

  const { data, error } = await supabase
    .from('candidate_profiles')
    .upsert(candidatesToInsert, { onConflict: 'id' })
    .select();

  if (error) throw new Error(`Failed to store candidates: ${error.message}`);
  return data;
}

export async function storeFeedback(
  jobDescriptionId: string,
  feedback: CandidateFeedback[]
) {
  const feedbackToInsert = feedback.map(f => ({
    job_description_id: jobDescriptionId,
    candidate_id: f.candidateId,
    is_good_fit: f.isPositive,
    feedback: f.reason
  }));

  const { error } = await supabase
    .from('candidate_feedback')
    .insert(feedbackToInsert);

  if (error) throw new Error(`Failed to store feedback: ${error.message}`);
}

export async function storeIterationState(
  jobDescriptionId: string,
  iterationCount: number,
  refinedCriteria: CriteriaRefinement,
  feedbackAnalysis: any,
  isFinal: boolean = false
) {
  const { error } = await supabase
    .from('matching_iterations')
    .insert({
      job_description_id: jobDescriptionId,
      iteration_number: iterationCount,
      refined_criteria: refinedCriteria,
      feedback_summary: feedbackAnalysis,
      is_final: isFinal
    });

  if (error) throw new Error(`Failed to store iteration state: ${error.message}`);
}

export async function updateJobDescription(
  jobDescriptionId: string,
  updates: {
    status?: string;
    finalCriteria?: any;
    finalScoring?: any;
    votingStats?: any;
  }
) {
  const { error } = await supabase
    .from('job_descriptions')
    .update(updates)
    .eq('id', jobDescriptionId);

  if (error) throw new Error(`Failed to update job description: ${error.message}`);
}

export async function getJobDescription(jobDescriptionId: string) {
  const { data, error } = await supabase
    .from('job_descriptions')
    .select('*')
    .eq('id', jobDescriptionId)
    .single();

  if (error) throw new Error(`Failed to fetch job description: ${error.message}`);
  return data;
}

export async function getWorkflowState(jobDescriptionId: string) {
  const { data, error } = await supabase
    .from('matching_iterations')
    .select('*')
    .eq('job_description_id', jobDescriptionId)
    .order('iteration_number', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // No rows returned
    throw new Error(`Failed to fetch workflow state: ${error.message}`);
  }

  return data;
} 