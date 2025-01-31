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
  loadLatestRefinement,
  storeGeneratedCandidates
} from './state-manager';
import type {
  CandidateGenerationConfig,
  WorkflowState,
  CandidateFeedback,
  GeneratedCandidate
} from './types';

const MAX_ITERATIONS = 5;

// Format criteria for UI consumption
function formatCriteriaForUI(workflowState: WorkflowState) {
  if (!workflowState.refinedcriteria) return undefined;

  const { refinedcriteria } = workflowState.refinedcriteria;
  return {
    requiredSkills: refinedcriteria.requiredskills.map(s => ({
      skill: s.skill,
      importance: s.importance,
      reason: s.reason
    })),
    preferredSkills: refinedcriteria.preferredskills.map(s => ({
      skill: s.skill,
      importance: s.importance,
      reason: s.reason
    })),
    experienceLevel: {
      minYears: refinedcriteria.experiencelevel.minyears,
      maxYears: refinedcriteria.experiencelevel.maxyears,
      reason: refinedcriteria.experiencelevel.reason
    },
    culturalAttributes: refinedcriteria.culturalattributes.map(a => ({
      attribute: a.attribute,
      importance: a.importance,
      reason: a.reason
    })),
    adjustments: refinedcriteria.adjustments
  };
}

// Format selection criteria based on current state
function formatSelectionCriteria(workflowState: WorkflowState): string[] {
  const criteria = workflowState.scoringcriteria;
  const refinements = workflowState.refinedcriteria?.refinedcriteria;

  const selectionCriteria = [
    // Required Skills
    `Required Skills: ${
      refinements 
        ? refinements.requiredskills.map(s => s.skill).join(', ')
        : criteria.requiredskills.map(s => typeof s === 'string' ? s : s.skill).join(', ') || 'None specified'
    }`,

    // Preferred Skills
    `Preferred Skills: ${
      refinements
        ? refinements.preferredskills.map(s => s.skill).join(', ')
        : criteria.preferredskills.map(s => typeof s === 'string' ? s : s.skill).join(', ') || 'None specified'
    }`,

    // Experience
    refinements
      ? `Experience Level: ${refinements.experiencelevel.minyears}-${refinements.experiencelevel.maxyears} years`
      : `Experience Level: ${criteria.experiencelevels.minimum}-${criteria.experiencelevels.maximum} years`,

    // Cultural Fit
    `Cultural Attributes: ${
      refinements
        ? refinements.culturalattributes.map(c => c.attribute).join(', ')
        : criteria.culturalcriteria.map(c => typeof c === 'string' ? c : c.attribute).join(', ') || 'None specified'
    }`
  ].filter(Boolean);

  return selectionCriteria;
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
  candidates: GeneratedCandidate[];
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
    if (workflowState.iterationcount >= MAX_ITERATIONS) {
      console.log('Maximum iterations reached, returning current state');
      return { 
        candidates: [], 
        workflowState: {
          ...workflowState,
          shouldterminate: true,
          currentphase: 'COMPLETE'
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
          await storeCriteriaRefinement(jobDescriptionId, refinements, workflowState.iterationcount);
          workflowState = await updateWorkflowState(jobDescriptionId, {
            refinedcriteria: refinements,
            currentphase: 'REFINING'
          });
          console.log('Updated workflow state with refinements');
        }
      }
    }

    let candidates: GeneratedCandidate[] = [];

    // Generate candidates with current criteria
    const generationConfig: CandidateGenerationConfig = {
      jobDescription: config.jobDescription,
      selectionCriteria: formatSelectionCriteria(workflowState),
      numberOfCandidates: workflowState.iterationcount === MAX_ITERATIONS - 1 ? 10 : 5,
      feedback: aggregatedFeedback
    };

    console.log('Generating candidates with config:', generationConfig);

    try {
      candidates = await generateCandidates(generationConfig);
      console.log('Generated candidates:', candidates);

      // Store candidates in database
      const isFinal = workflowState.iterationcount === MAX_ITERATIONS - 1;
      await storeGeneratedCandidates(
        jobDescriptionId,
        candidates,
        workflowState.iterationcount,
        isFinal
      );
      console.log('Stored candidates in database');

      // Update workflow state
      workflowState = await updateWorkflowState(jobDescriptionId, {
        iterationcount: workflowState.iterationcount + 1,
        currentphase: 'GENERATING',
        shouldterminate: workflowState.iterationcount >= MAX_ITERATIONS - 1
      });

      // If this was the last iteration, mark as complete
      if (workflowState.iterationcount >= MAX_ITERATIONS) {
        workflowState = await updateWorkflowState(jobDescriptionId, {
          currentphase: 'COMPLETE'
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
