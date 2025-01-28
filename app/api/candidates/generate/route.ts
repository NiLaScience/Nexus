import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { candidateMatchingWorkflow } from '@/lib/workflows/candidate-matching';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    const { jobDescriptionId } = body;
    if (!jobDescriptionId) {
      return NextResponse.json(
        { error: 'No job description ID provided' },
        { status: 400 }
      );
    }

    // Fetch the job description from Supabase
    const { data: jobDescription, error: fetchError } = await supabase
      .from('job_descriptions')
      .select('parsed_content')
      .eq('id', jobDescriptionId)
      .single();

    console.log('Supabase response:', { jobDescription, fetchError });

    if (fetchError || !jobDescription?.parsed_content) {
      console.error('Error fetching job description:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch job description' },
        { status: 404 }
      );
    }

    // Parse the job description content
    let structuredJobDescription;
    try {
      structuredJobDescription = typeof jobDescription.parsed_content === 'string' 
        ? JSON.parse(jobDescription.parsed_content)
        : jobDescription.parsed_content;
      
      console.log('Parsed job description:', JSON.stringify(structuredJobDescription, null, 2));
    } catch (error) {
      console.error('Error parsing job description:', error);
      return NextResponse.json(
        { error: 'Invalid job description format' },
        { status: 400 }
      );
    }

    console.log('Starting workflow with:', { structuredJobDescription });
    
    // Run the workflow
    const result = await candidateMatchingWorkflow.invoke({
      structuredJobDescription
    });

    console.log('Workflow result:', result);

    if (!result?.candidateProfiles?.length) {
      throw new Error('No candidates generated');
    }

    return NextResponse.json({
      candidates: result.candidateProfiles
    });

  } catch (error) {
    console.error('Error in generate route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate candidates' },
      { status: 500 }
    );
  }
} 
