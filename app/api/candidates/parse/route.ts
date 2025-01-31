import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { formattedParserPrompt, jobDescriptionParser, llm } from '@/lib/llm/config';
import { BaseMessage } from '@langchain/core/messages';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function parseContent(content: Blob): Promise<string> {
  const form = new FormData();
  form.append('files', content);
  form.append('strategy', 'fast');

  const parserResponse = await fetch('https://parser.gawntlet.com', {
    method: 'POST',
    body: form,
    headers: { 'accept': 'application/json' }
  });

  if (!parserResponse.ok) {
    throw new Error('Failed to parse content');
  }

  const data = await parserResponse.json();
  return data
    .map((el: any) => el.text?.trim())
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

async function fetchUrlContent(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch URL content');
  }
  return response.blob();
}

async function processWithLLM(jobDescription: string, fileId?: string) {
  try {
    const structuredLLM = llm.withStructuredOutput(jobDescriptionParser.schema);
    
    const prompt = `You are a job description parser. Your task is to extract structured information from a job description.
    Please analyze the following job description and extract key information in a structured format.

    Job Description:
    ${jobDescription}

    Extract all relevant information and ensure all fields are filled with appropriate values.
    For career level and leadership information:
    - Infer the level from responsibilities, qualifications, and reporting structure
    - Set managementResponsibilities based on mentions of team leadership or direct reports
    - Estimate directReports count from context (use 0 if none mentioned)
    - Determine leadership type based on role focus and responsibilities
    - Set crossFunctional based on mentions of cross-team collaboration

    If a field is not mentioned in the job description, use reasonable defaults based on the context.`;

    const parsedDescription = await structuredLLM.invoke(prompt);

    if (fileId) {
      const { error: updateError } = await supabase
        .from('job_descriptions')
        .update({ 
          parsed_content: parsedDescription,
          status: 'completed'
        })
        .eq('id', fileId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update job description: ${updateError.message}`);
      }
    }

    return parsedDescription;
  } catch (error) {
    if (fileId) {
      const { error: updateError } = await supabase
        .from('job_descriptions')
        .update({ 
          status: 'error',
          parsed_content: null 
        })
        .eq('id', fileId)
        .select()
        .single();
    }
    
    throw error instanceof Error 
      ? error 
      : new Error('Unknown error in LLM processing');
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    let rawJobDescription: string;
    let fileId: string | undefined;

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as Blob;
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      rawJobDescription = await parseContent(file);

      // Store in Supabase
      fileId = uuidv4();
      const filePath = `public/${fileId}`;
      
      const { error: uploadError } = await supabase.storage
        .from('job-descriptions')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Failed to upload content: ${uploadError.message}`);
      }

      const { error: insertError } = await supabase
        .from('job_descriptions')
        .insert({
          id: fileId,
          raw_content: rawJobDescription,
          file_path: filePath,
          file_type: file.type,
          status: 'processing'
        });

      if (insertError) {
        throw new Error(`Failed to store job description: ${insertError.message}`);
      }

    } else {
      const { url, jobDescription } = await request.json();
      
      if (url) {
        const blob = await fetchUrlContent(url);
        rawJobDescription = await parseContent(blob);
      } else if (jobDescription) {
        rawJobDescription = jobDescription;
      } else {
        return NextResponse.json(
          { error: 'No URL or job description provided' },
          { status: 400 }
        );
      }
    }

    // Start LLM processing in background
    Promise.resolve().then(() => {
      processWithLLM(rawJobDescription, fileId).catch(error => {
        console.error('Background LLM processing failed:', error);
      });
    });

    // Return immediately with raw text and job ID
    return NextResponse.json({
      id: fileId,
      text: rawJobDescription,
      status: 'processing'
    });

  } catch (error) {
    console.error('Error in parse route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse job description' },
      { status: 500 }
    );
  }
} 
