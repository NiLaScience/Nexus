import { createClient } from '@supabase/supabase-js';
import type { 
  WorkflowState, 
  DbWorkflowState,
  CriteriaRefinement,
  CandidateFeedback
} from './types/base';
import { storeGeneratedCandidates as dbStoreGeneratedCandidates } from './database';
import { mapDbToWorkflowState, mapWorkflowStateToDb } from './mapping';

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
      throw error;
    }

    if (existingState) {
      return mapDbToWorkflowState(existingState as DbWorkflowState);
    }

    // Initialize new workflow state
    const initialState: WorkflowState = {
      jobDescriptionId,
      iterationCount: 0,
      shouldTerminate: false,
      currentPhase: 'INITIAL',
      scoringCriteria: {
        skillsWeight: 0.4,
        experienceWeight: 0.3,
        achievementsWeight: 0.2,
        culturalWeight: 0.1,
        leadershipWeight: 0,
        requiredSkills: [],
        preferredSkills: [],
        experienceLevels: {
          minimum: 0,
          preferred: 3,
          maximum: 10,
          yearsWeight: 0.6
        },
        culturalCriteria: [],
        leadershipCriteria: []
      }
    };

    // Store initial state
    const { error: insertError } = await supabase
      .from('workflow_states')
      .insert(mapWorkflowStateToDb(initialState));

    if (insertError) {
      console.error('Error inserting initial workflow state:', insertError);
      throw insertError;
    }

    return initialState;
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
    const currentState = await loadWorkflowState(jobDescriptionId);
    const updatedState: WorkflowState = {
      ...currentState,
      ...updates
    };

    const { error } = await supabase
      .from('workflow_states')
      .update(mapWorkflowStateToDb(updatedState))
      .eq('jobdescriptionid', jobDescriptionId);

    if (error) {
      console.error('Error updating workflow state:', error);
      throw error;
    }

    return updatedState;
  } catch (error) {
    console.error('Error in updateWorkflowState:', error);
    throw error;
  }
}

/**
 * Stores feedback in the database.
 */
export async function storeFeedback(
  jobDescriptionId: string,
  feedback: CandidateFeedback[]
): Promise<void> {
  try {
    const { error } = await supabase
      .from('candidate_feedback')
      .insert(feedback.map(f => ({
        jobdescriptionid: jobDescriptionId,
        candidateid: f.candidateId,
        ispositive: f.isPositive,
        reason: f.reason,
        createdat: new Date().toISOString()
      })));

    if (error) {
      console.error('Error storing feedback:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in storeFeedback:', error);
    throw error;
  }
}

/**
 * Loads feedback from the database.
 */
export async function loadFeedback(
  jobDescriptionId: string
): Promise<CandidateFeedback[]> {
  try {
    const { data, error } = await supabase
      .from('candidate_feedback')
      .select('*')
      .eq('jobdescriptionid', jobDescriptionId)
      .order('createdat', { ascending: true });

    if (error) {
      console.error('Error loading feedback:', error);
      throw error;
    }

    return data.map(f => ({
      candidateId: f.candidateid,
      isPositive: f.ispositive,
      reason: f.reason
    }));
  } catch (error) {
    console.error('Error in loadFeedback:', error);
    throw error;
  }
}

/**
 * Stores criteria refinement in the database.
 */
export async function storeCriteriaRefinement(
  jobDescriptionId: string,
  refinement: CriteriaRefinement,
  iterationNumber: number
): Promise<void> {
  try {
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
      throw error;
    }
  } catch (error) {
    console.error('Error in storeCriteriaRefinement:', error);
    throw error;
  }
}

/**
 * Loads the latest refinement from the database.
 */
export async function loadLatestRefinement(
  jobDescriptionId: string
): Promise<CriteriaRefinement | null> {
  try {
    const { data, error } = await supabase
      .from('workflow_refinements')
      .select('*')
      .eq('jobdescriptionid', jobDescriptionId)
      .order('iterationnumber', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error loading latest refinement:', error);
      throw error;
    }

    return data.refinement;
  } catch (error) {
    console.error('Error in loadLatestRefinement:', error);
    throw error;
  }
} 