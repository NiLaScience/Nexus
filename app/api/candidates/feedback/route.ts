import { NextRequest } from 'next/server';
import { z } from 'zod';
import { storeFeedback } from '@/lib/ai-sdk/state-manager';

// Input validation schema
const feedbackSchema = z.object({
  candidateId: z.string().uuid(),
  jobDescriptionId: z.string().uuid(),
  isGoodFit: z.boolean(),
  feedback: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    console.log('Received feedback request');

    // Parse and validate the request body
    const body = await req.json();
    const { candidateId, jobDescriptionId, isGoodFit, feedback } = feedbackSchema.parse(body);

    // Store feedback using state manager
    await storeFeedback(jobDescriptionId, [{
      candidateId,
      isPositive: isGoodFit,
      reason: feedback
    }]);

    console.log('Feedback stored successfully:', {
      jobDescriptionId,
      candidateId,
      isGoodFit,
      feedback
    });

    return Response.json({
      success: true,
      data: {
        jobDescriptionId,
        candidateId,
        isGoodFit,
        feedback
      }
    });

  } catch (error) {
    console.error('Error storing candidate feedback:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store feedback'
    }, { status: 400 });
  }
} 