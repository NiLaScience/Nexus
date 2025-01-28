import { NextRequest } from 'next/server';
import { candidateMatchingWorkflow } from '@/lib/workflows/candidate-matching';
import { z } from 'zod';

// Input validation schema
const requestSchema = z.object({
  jobDescriptionId: z.string().uuid()
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    const { jobDescriptionId } = requestSchema.parse(body);

    // Run the candidate matching workflow
    const result = await candidateMatchingWorkflow.invoke({
      jobDescriptionId
    });

    // Return the results
    return Response.json({
      success: true,
      data: {
        finalCandidates: result.finalCandidates
      },
      error: result.error
    });

  } catch (error) {
    console.error('Error in candidate matching API:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process candidate matching'
    }, { status: 400 });
  }
} 
