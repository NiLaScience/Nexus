import { NextRequest } from 'next/server';
import { storeFeedback } from '@/lib/ai-sdk/database';
import { feedbackRequestSchema } from '@/lib/ai-sdk/validation';

export async function POST(req: NextRequest) {
  try {
    const { jobDescriptionId, feedback } = 
      feedbackRequestSchema.parse(await req.json());

    await storeFeedback(jobDescriptionId, feedback);

    return Response.json({
      success: true,
      message: 'Feedback stored successfully'
    });

  } catch (error) {
    console.error('Error storing feedback:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store feedback'
    }, { status: 400 });
  }
} 