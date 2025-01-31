import { createClient } from '@supabase/supabase-js';
import type { 
  WorkflowState, 
  CriteriaRefinement,
  CandidateFeedback
} from './types';
import { storeGeneratedCandidates as dbStoreGeneratedCandidates } from './database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Re-export storeGeneratedCandidates
export const storeGeneratedCandidates = dbStoreGeneratedCandidates;

/**
 * Loads the current workflow state from the database.
 * Creates a new state if none exists.
 */
export async function loadWorkflowState(
  jobDescriptionId: string
): Promise<WorkflowState> {
  try {
    console.log('Loading workflow state for job:', jobDescriptionId);

    const { data: existingState, error } = await supabase
      .from('workflow_states')
      .select('*')
      .eq('jobdescriptionid', jobDescriptionId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading workflow state:', error);
      throw new Error(`Failed to load workflow state: ${error.message}`);
    }

    if (existingState) {
      console.log('Found existing workflow state:', existingState);
      return existingState as WorkflowState;
    }

    // Initialize new state if none exists
    const newState: WorkflowState = {
      jobdescriptionid: jobDescriptionId,
      iterationcount: 0,
      shouldterminate: false,
      currentphase: 'INITIAL',
      scoringcriteria: {
        skillsweight: 0.3,
        experienceweight: 0.2,
        achievementsweight: 0.2,
        culturalweight: 0.2,
        leadershipweight: 0.1,
        requiredskills: [],
        preferredskills: [],
        experiencelevels: {
          minimum: 0,
          preferred: 0,
          maximum: 0,
          yearsweight: 0.5
        },
        culturalcriteria: [],
        leadershipcriteria: []
      }
    };

    const { error: insertError } = await supabase
      .from('workflow_states')
      .insert(newState);

    if (insertError) {
      console.error('Error creating new workflow state:', insertError);
      throw new Error(`Failed to create workflow state: ${insertError.message}`);
    }

    console.log('Created new workflow state:', newState);
    return newState;

  } catch (error) {
    console.error('Error in loadWorkflowState:', error);
    throw error;
  }
}

/**
 * Updates the workflow state in the database.
 */
export async function updateWorkflowState(
  jobDescriptionId: string,
  updates: Partial<WorkflowState>
): Promise<WorkflowState> {
  try {
    console.log('Updating workflow state:', { jobDescriptionId, updates });

    const { data: updatedState, error } = await supabase
      .from('workflow_states')
      .update({
        ...updates,
        updatedat: new Date().toISOString()
      })
      .eq('jobdescriptionid', jobDescriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating workflow state:', error);
      throw new Error(`Failed to update workflow state: ${error.message}`);
    }

    console.log('Updated workflow state:', updatedState);
    return updatedState as WorkflowState;

  } catch (error) {
    console.error('Error in updateWorkflowState:', error);
    throw error;
  }
}

/**
 * Stores feedback for a workflow.
 */
export async function storeFeedback(
  jobDescriptionId: string,
  feedback: Array<{
    candidateId: string;
    isPositive: boolean;
    reason?: string;
  }>
): Promise<void> {
  try {
    console.log('Storing feedback:', { jobDescriptionId, feedback });

    // First, get the job_description_id for each candidate
    const { data: candidates, error: candidateError } = await supabase
      .from('candidate_profiles')
      .select('id, job_description_id')
      .in('id', feedback.map(f => f.candidateId));

    if (candidateError) {
      console.error('Error fetching candidates:', candidateError);
      throw new Error(`Failed to fetch candidates: ${candidateError.message}`);
    }

    // Map candidates to their job_description_id
    const candidateJobMap = new Map(
      candidates.map(c => [c.id, c.job_description_id])
    );

    const { error } = await supabase
      .from('candidate_feedback')
      .insert(feedback.map(f => ({
        candidate_id: f.candidateId,
        job_description_id: candidateJobMap.get(f.candidateId),
        is_good_fit: f.isPositive,
        feedback: f.reason,
        created_at: new Date().toISOString()
      })));

    if (error) {
      console.error('Error storing feedback:', error);
      throw new Error(`Failed to store feedback: ${error.message}`);
    }

    console.log('Successfully stored feedback');

  } catch (error) {
    console.error('Error in storeFeedback:', error);
    throw error;
  }
}

/**
 * Loads all feedback for a workflow.
 */
export async function loadFeedback(
  jobDescriptionId: string
): Promise<Array<{
  candidateId: string;
  isPositive: boolean;
  reason?: string;
}>> {
  try {
    console.log('Loading feedback for job:', jobDescriptionId);

    const { data: feedback, error } = await supabase
      .from('candidate_feedback')
      .select('*, candidate_profiles!inner(job_description_id)')
      .eq('candidate_profiles.job_description_id', jobDescriptionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading feedback:', error);
      throw new Error(`Failed to load feedback: ${error.message}`);
    }

    // Map the feedback to match our expected format
    const mappedFeedback = feedback.map(f => ({
      candidateId: f.candidate_id,
      isPositive: f.is_good_fit,
      reason: f.feedback
    }));

    console.log('Loaded feedback:', mappedFeedback);
    return mappedFeedback;

  } catch (error) {
    console.error('Error in loadFeedback:', error);
    throw error;
  }
}

/**
 * Stores criteria refinements for a workflow iteration.
 */
export async function storeCriteriaRefinement(
  jobDescriptionId: string,
  refinement: CriteriaRefinement,
  iterationNumber: number
): Promise<void> {
  try {
    console.log('Storing criteria refinement:', { jobDescriptionId, refinement, iterationNumber });

    const { error } = await supabase
      .from('workflow_refinements')
      .insert({
        jobdescriptionid: jobDescriptionId,
        iterationnumber: iterationNumber,
        refinement,
        createdat: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing criteria refinement:', error);
      throw new Error(`Failed to store criteria refinement: ${error.message}`);
    }

    console.log('Successfully stored criteria refinement');

  } catch (error) {
    console.error('Error in storeCriteriaRefinement:', error);
    throw error;
  }
}

/**
 * Loads the latest criteria refinement for a workflow.
 */
export async function loadLatestRefinement(
  jobDescriptionId: string
): Promise<CriteriaRefinement | null> {
  try {
    console.log('Loading latest refinement for job:', jobDescriptionId);

    const { data: refinement, error } = await supabase
      .from('workflow_refinements')
      .select('*')
      .eq('jobdescriptionid', jobDescriptionId)
      .order('iterationnumber', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading refinement:', error);
      throw new Error(`Failed to load refinement: ${error.message}`);
    }

    console.log('Loaded refinement:', refinement);
    return refinement ? refinement.refinement : null;

  } catch (error) {
    console.error('Error in loadLatestRefinement:', error);
    throw error;
  }
} 