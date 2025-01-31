import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Input validation schema
const feedbackSchema = z.object({
  candidateId: z.string().uuid(),
  jobDescriptionId: z.string().uuid(),
  isGoodFit: z.boolean(),
  feedback: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    const { candidateId, jobDescriptionId, isGoodFit, feedback } = feedbackSchema.parse(body);

    // Store feedback in database
    const { data, error } = await supabase
      .from('candidate_feedback')
      .insert({
        candidate_id: candidateId,
        job_description_id: jobDescriptionId,
        is_good_fit: isGoodFit,
        feedback
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to store feedback: ${error.message}`);

    return Response.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error storing candidate feedback:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store feedback'
    }, { status: 400 });
  }
} 