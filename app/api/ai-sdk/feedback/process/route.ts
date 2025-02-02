import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeFeedbackPatterns, 
  generateCriteriaRefinements, 
  shouldRefineBasedOnFeedback 
} from '@/lib/ai-sdk/feedback-processor';
import { 
  storeFeedback,
  storeIterationState
} from '@/lib/ai-sdk/database';
import type { CandidateFeedback, WorkflowState } from '@/lib/ai-sdk/types';
import { z } from 'zod';

export const runtime = 'edge';

// Request schema
const processFeedbackRequestSchema = z.object({
  workflowState: z.custom<WorkflowState>(),
  feedback: z.array(z.custom<CandidateFeedback>())
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workflowState, feedback } = processFeedbackRequestSchema.parse(body);

    // Store feedback
    await storeFeedback(workflowState.jobDescriptionId, feedback);

    // Analyze feedback patterns
    const feedbackAnalysis = await analyzeFeedbackPatterns(feedback);

    // Check if we should refine criteria
    const shouldRefine = await shouldRefineBasedOnFeedback(feedback, feedbackAnalysis);
    let updatedState: WorkflowState = {
      ...workflowState,
      currentPhase: 'REFINING',
      iterationCount: workflowState.iterationCount + 1,
      shouldTerminate: shouldRefine
    };

    if (shouldRefine) {
      // Generate criteria refinements
      const refinements = await generateCriteriaRefinements(workflowState, feedbackAnalysis);

      if (refinements) {
        // Update workflow state with refinements
        updatedState = {
          ...updatedState,
          refinedCriteria: refinements
        };

        // Store the updated state
        await storeIterationState(
          workflowState.jobDescriptionId,
          workflowState.iterationCount,
          refinements,
          feedbackAnalysis,
          shouldRefine
        );
      }
    }

    // Store updated state
    if (updatedState.refinedCriteria) {
      await storeIterationState(
        workflowState.jobDescriptionId,
        workflowState.iterationCount,
        updatedState.refinedCriteria,
        feedbackAnalysis,
        updatedState.shouldTerminate
      );
    }

    return NextResponse.json({ 
      success: true,
      state: updatedState,
      shouldRefine,
      feedbackAnalysis
    });
  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process feedback'
    }, { status: 500 });
  }
} 