import { NextRequest } from 'next/server';
import { candidateMatchingWorkflow } from '@/lib/workflows/candidate-matching';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MAX_ITERATIONS = 5;

// Input validation schema
const requestSchema = z.object({
  jobDescriptionId: z.string().uuid()
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    const { jobDescriptionId } = requestSchema.parse(body);

    // First get candidates for this job
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidate_profiles')
      .select('id')
      .eq('job_description_id', jobDescriptionId);

    if (candidatesError) throw new Error(`Failed to fetch candidates: ${candidatesError.message}`);

    // Then get feedback for these candidates
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('candidate_feedback')
      .select('candidate_id, is_good_fit, feedback')
      .in('candidate_id', candidates?.map(c => c.id) || []);

    if (feedbackError) throw new Error(`Failed to fetch feedback: ${feedbackError.message}`);

    // Run the candidate matching workflow with existing feedback
    const result = await candidateMatchingWorkflow.invoke({
      jobDescriptionId,
      userFeedback: (feedbackData || []).map(f => ({
        candidateId: f.candidate_id,
        isGoodFit: f.is_good_fit,
        feedback: f.feedback
      }))
    });

    // Return the results with workflow state
    return Response.json({
      success: true,
      data: {
        finalCandidates: result.finalCandidates,
        iterationCount: result.iterationCount,
        isComplete: result.iterationCount >= MAX_ITERATIONS - 1 || !result.userFeedback?.length
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