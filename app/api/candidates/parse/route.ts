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

  console.log('Sending to parser:', {
    contentType: content.type,
    contentSize: content.size
  });

  const parserResponse = await fetch('https://parser.gawntlet.com', {
    method: 'POST',
    body: form,
    headers: { 'accept': 'application/json' }
  });

  if (!parserResponse.ok) {
    console.error('Parser error:', {
      status: parserResponse.status,
      statusText: parserResponse.statusText
    });
    throw new Error('Failed to parse content');
  }

  const data = await parserResponse.json();
  console.log('Parser response:', JSON.stringify(data, null, 2));

  const parsedText = data
    .map((el: any) => el.text?.trim())
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  console.log('Parsed text:', parsedText);
  return parsedText;
}

async function fetchUrlContent(url: string): Promise<Blob> {
  console.log('Fetching URL:', url);
  const response = await fetch(url);
  if (!response.ok) {
    console.error('URL fetch error:', {
      status: response.status,
      statusText: response.statusText
    });
    throw new Error('Failed to fetch URL content');
  }
  const blob = await response.blob();
  console.log('URL content fetched:', {
    type: blob.type,
    size: blob.size
  });
  return blob;
}

async function processWithLLM(jobDescription: string, fileId?: string) {
  try {
    console.log('Parsing job description with LLM...', { fileId });
    const prompt = await formattedParserPrompt;
    const response = await prompt.pipe(llm).invoke({
      jobDescription
    });
    
    console.log('LLM Response:', response);
    const responseText = (response as BaseMessage).content as string;
    
    console.log('Parsing response with Zod...');
    const parsedDescription = await jobDescriptionParser.parse(responseText);
    console.log('Parsed result:', parsedDescription);

    if (fileId) {
      console.log('Updating job description record:', fileId);
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
        console.error('Error updating parsed content:', updateError);
        throw new Error(`Failed to update job description: ${updateError.message}`);
      }
    }

    return parsedDescription;
  } catch (error) {
    console.error('Error in LLM processing:', error);
    
    if (fileId) {
      try {
        const { error: updateError } = await supabase
          .from('job_descriptions')
          .update({ 
            status: 'error',
            parsed_content: null 
          })
          .eq('id', fileId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating error status:', updateError);
        }
      } catch (dbError) {
        console.error('Failed to update error status:', dbError);
      }
    }
    
    throw error instanceof Error 
      ? error 
      : new Error('Unknown error in LLM processing');
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    console.log('Request content type:', contentType);

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
        console.error('Error uploading content:', uploadError);
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
        console.error('Error inserting record:', insertError);
        return NextResponse.json(
          { error: 'Failed to store job description' },
          { status: 500 }
        );
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
    processWithLLM(rawJobDescription, fileId).catch(console.error);

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
