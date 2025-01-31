import { NextRequest } from 'next/server';
import { processCandidateFeedback } from '@/lib/ai-sdk/candidate-generation';
import { feedbackSchema } from '@/lib/ai-sdk/schema';
import type { CandidateFeedback } from '@/lib/ai-sdk/types';
import { z, ZodError } from 'zod';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body against schema
    const feedback: CandidateFeedback[] = z.array(feedbackSchema).parse(body.feedback);
    
    // Process feedback and get insights
    const insights = await processCandidateFeedback(feedback);

    return new Response(JSON.stringify({ insights }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing feedback:', error);
    
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid feedback format',
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