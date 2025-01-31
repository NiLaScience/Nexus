import { NextRequest } from 'next/server';
import { 
  analyzeFeedbackPatterns, 
  generateCriteriaRefinements, 
  shouldRefineBasedOnFeedback 
} from '@/lib/ai-sdk/feedback-processor';
import { 
  storeFeedback,
  storeIterationState,
  updateJobDescription 
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
    let updatedState = { ...workflowState };

    if (shouldRefine) {
      // Generate criteria refinements
      const refinements = await generateCriteriaRefinements(workflowState, feedbackAnalysis);
      
      // Update state with refinements
      updatedState = {
        ...updatedState,
        refinedCriteria: refinements,
        currentPhase: 'GENERATING',
        iterationCount: workflowState.iterationCount + 1
      };
    } else {
      // Skip refinement, move directly to generation
      updatedState = {
        ...updatedState,
        currentPhase: 'GENERATING',
        iterationCount: workflowState.iterationCount + 1
      };
    }

    // Check if this is the final iteration
    if (updatedState.iterationCount >= 4) {
      updatedState.shouldTerminate = true;
      await updateJobDescription(workflowState.jobDescriptionId, {
        status: 'completed',
        final_criteria: updatedState.refinedCriteria || updatedState.scoringCriteria
      });
    }

    // Store the updated state
    await storeIterationState(
      workflowState.jobDescriptionId,
      updatedState.iterationCount,
      updatedState.refinedCriteria || {
        updatedSkills: {
          required: updatedState.scoringCriteria.requiredSkills,
          preferred: updatedState.scoringCriteria.preferredSkills,
          removed: []
        },
        updatedExperience: {
          minimum: updatedState.scoringCriteria.experienceLevels.minimum,
          preferred: updatedState.scoringCriteria.experienceLevels.preferred,
          maximum: updatedState.scoringCriteria.experienceLevels.maximum
        },
        updatedCulturalCriteria: updatedState.scoringCriteria.culturalCriteria,
        updatedLeadershipCriteria: updatedState.scoringCriteria.leadershipCriteria,
        reasonForChanges: 'Initial criteria',
        confidence: 1.0
      },
      feedbackAnalysis,
      updatedState.shouldTerminate
    );

    return new Response(JSON.stringify({
      state: updatedState,
      analysis: feedbackAnalysis,
      shouldContinue: !updatedState.shouldTerminate
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing feedback:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format',
          details: error.errors 
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to process feedback' }),
      { status: 500 }
    );
  }
} 