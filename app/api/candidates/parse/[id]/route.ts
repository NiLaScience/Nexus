import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error('Failed to fetch job description');
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Job description not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      text: data.raw_content,
      parsed: data.parsed_content,
      status: data.status || 'processing'
    });

  } catch (error) {
    console.error('Error in parse status route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get parse status' },
      { status: 500 }
    );
  }
} 
