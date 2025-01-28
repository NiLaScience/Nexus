import { NextRequest } from 'next/server';
import { candidateMatchingWorkflow } from '@/lib/workflows/candidate-matching';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Input validation schema
const requestSchema = z.object({
  jobDescriptionId: z.string().uuid(),
  feedback: z.array(z.object({
    candidateId: z.string(),
    isGoodFit: z.boolean(),
    feedback: z.string().optional()
  })).optional()
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const { jobDescriptionId, feedback } = requestSchema.parse(await req.json());

    // Just run the workflow with whatever feedback we have
    const result = await candidateMatchingWorkflow.invoke({
      jobDescriptionId,
      userFeedback: feedback || []
    });

    return Response.json({
      success: true,
      data: {
        finalCandidates: result.finalCandidates,
        iterationCount: result.iterationCount,
        isComplete: result.shouldTerminate,
        needsFeedback: !result.shouldTerminate
      }
    });

  } catch (error) {
    console.error('Error in candidate matching API:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process candidate matching'
    }, { status: 400 });
  }
} 