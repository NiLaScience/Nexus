// /lib/ai-sdk/candidate-workflow.ts

import { generateCandidates } from './candidate-generation';
import {
  analyzeFeedbackPatterns,
  generateCriteriaRefinements,
  shouldRefineBasedOnFeedback
} from './feedback-processor';
import {
  loadWorkflowState,
  updateWorkflowState,
  storeFeedback,
  loadFeedback,
  storeCriteriaRefinement,
  storeGeneratedCandidates
} from './state-manager';
import type {
  WorkflowState,
  CandidateProfile,
  CandidateFeedback
} from './types/base';
import type { CandidateGenerationConfig } from './types';
import { v4 as uuidv4 } from 'uuid';

const MAX_ITERATIONS = 5;

// Format criteria for UI consumption
function formatCriteriaForUI(workflowState: WorkflowState) {
  if (!workflowState.refinedCriteria) return undefined;

  const { refinedCriteria } = workflowState.refinedCriteria;
  return {
    requiredSkills: refinedCriteria.requiredSkills,
    preferredSkills: refinedCriteria.preferredSkills,
    experienceLevel: refinedCriteria.experienceLevel,
    culturalAttributes: refinedCriteria.culturalAttributes
  };
}

// Format selection criteria based on current state
function formatSelectionCriteria(workflowState: WorkflowState): string[] {
  const criteria = workflowState.scoringCriteria;
  const refinements = workflowState.refinedCriteria?.refinedCriteria;

  const selectionCriteria = [
    ...criteria.requiredSkills.map(s => s.skill),
    ...criteria.preferredSkills.map(s => s.skill)
  ];

  if (refinements) {
    selectionCriteria.push(
      ...refinements.requiredSkills.map(s => s.skill),
      ...refinements.preferredSkills.map(s => s.skill)
    );
  }

  return Array.from(new Set(selectionCriteria));
}

/**
 * Runs the candidate generation and refinement workflow.
 * This function orchestrates multiple iterations where candidate profiles are generated,
 * user feedback is collected, feedback is analyzed, and criteria are refined.
 *
 * @param config - Initial candidate generation configuration.
 * @param jobDescriptionId - The ID of the job description to run the workflow for.
 * @returns An object containing the final candidates, the final workflow state, and the aggregated feedback.
 */
export async function runCandidateWorkflow(
  config: CandidateGenerationConfig,
  jobDescriptionId: string
): Promise<{
  candidates: CandidateProfile[];
  workflowState: WorkflowState;
  feedback: CandidateFeedback[];
  uiCriteria?: ReturnType<typeof formatCriteriaForUI>;
}> {
  try {
    console.log('Starting candidate workflow for job:', jobDescriptionId);

    // Load or initialize workflow state
    let workflowState = await loadWorkflowState(jobDescriptionId);
    console.log('Loaded workflow state:', workflowState);

    // Check if we've already reached max iterations
    if (workflowState.iterationCount >= MAX_ITERATIONS) {
      console.log('Maximum iterations reached, returning current state');
      return { 
        candidates: [], 
        workflowState: {
          ...workflowState,
          shouldTerminate: true,
          currentPhase: 'COMPLETE'
        }, 
        feedback: [],
        uiCriteria: formatCriteriaForUI(workflowState)
      };
    }

    // Load existing feedback
    let aggregatedFeedback = await loadFeedback(jobDescriptionId);
    console.log('Loaded existing feedback:', aggregatedFeedback);

    // Add any new feedback from the config
    if (config.feedback?.length) {
      await storeFeedback(jobDescriptionId, config.feedback);
      aggregatedFeedback = aggregatedFeedback.concat(config.feedback);
      console.log('Added new feedback:', config.feedback);
    }

    // Analyze feedback and refine criteria if needed
    if (aggregatedFeedback.length > 0) {
      const patterns = await analyzeFeedbackPatterns(aggregatedFeedback);
      console.log('Analyzed feedback patterns:', patterns);

      const shouldRefine = shouldRefineBasedOnFeedback(aggregatedFeedback, patterns);
      console.log('Should refine criteria based on feedback:', shouldRefine);

      if (shouldRefine) {
        const refinements = await generateCriteriaRefinements(workflowState, patterns);
        console.log('Generated criteria refinements:', refinements);

        if (refinements) {
          await storeCriteriaRefinement(jobDescriptionId, refinements, workflowState.iterationCount);
          workflowState = await updateWorkflowState(jobDescriptionId, {
            refinedCriteria: refinements,
            currentPhase: 'REFINING'
          });
          console.log('Updated workflow state with refinements');
        }
      }
    }

    let candidates: CandidateProfile[] = [];

    // Generate candidates with current criteria
    const generationConfig: CandidateGenerationConfig = {
      jobDescription: config.jobDescription,
      selectionCriteria: formatSelectionCriteria(workflowState),
      numberOfCandidates: workflowState.iterationCount === MAX_ITERATIONS - 1 ? 10 : 5,
      feedback: aggregatedFeedback
    };

    console.log('Generating candidates with config:', generationConfig);

    try {
      const generatedCandidates = await generateCandidates(generationConfig);
      console.log('Generated candidates:', generatedCandidates);

      // Convert to CandidateProfile type
      candidates = generatedCandidates.map(c => ({
        ...c,
        id: uuidv4()
      }));

      // Store candidates in database
      const isFinal = workflowState.iterationCount === MAX_ITERATIONS - 1;
      await storeGeneratedCandidates(
        jobDescriptionId,
        candidates,
        isFinal
      );
      console.log('Stored candidates in database');

      // Update workflow state
      workflowState = await updateWorkflowState(jobDescriptionId, {
        iterationCount: workflowState.iterationCount + 1,
        currentPhase: 'EVALUATING',
        shouldTerminate: workflowState.iterationCount >= MAX_ITERATIONS - 1
      });

      // If this was the last iteration, mark as complete
      if (workflowState.iterationCount >= MAX_ITERATIONS) {
        workflowState = await updateWorkflowState(jobDescriptionId, {
          currentPhase: 'COMPLETE'
        });
      }

    } catch (error) {
      console.error('Error generating candidates:', error);
      throw new Error(`Failed to generate candidates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { 
      candidates, 
      workflowState, 
      feedback: aggregatedFeedback,
      uiCriteria: formatCriteriaForUI(workflowState)
    };

  } catch (error) {
    console.error('Error in candidate workflow:', error);
    throw error;
  }
}
