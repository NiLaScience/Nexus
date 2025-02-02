import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: Request
) {
  // Get id from URL
  const id = request.url.split('/').pop();
  
  try {
    const { data: jobDescription, error } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching job description:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job description' },
        { status: 404 }
      );
    }

    return NextResponse.json(jobDescription);
  } catch (error) {
    console.error('Error in parse route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch job description' },
      { status: 500 }
    );
  }
} 
