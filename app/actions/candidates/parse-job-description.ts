import { createClient } from "@/utils/supabase/server";

export async function parseJobDescriptionAction(formData: FormData) {
  try {
    const file = formData.get('file');
    if (!file) {
      return { error: 'No file provided' };
    }

    // Download from Supabase if it's a URL
    let fileBlob: Blob;
    if (typeof file === 'string' && file.startsWith('http')) {
      const fileResponse = await fetch(file);
      fileBlob = await fileResponse.blob();
    } else if (file instanceof Blob) {
      fileBlob = file;
    } else {
      return { error: 'Invalid file format' };
    }
    
    // Prepare form data for parser
    const form = new FormData();
    form.append('files', fileBlob);
    form.append('strategy', 'fast');
    
    // Send to parser
    const parserResponse = await fetch('https://parser.gawntlet.com', {
      method: 'POST',
      body: form,
      headers: { 'accept': 'application/json' }
    });
    
    if (!parserResponse.ok) {
      throw new Error(`Parser error: ${parserResponse.statusText}`);
    }

    const data = await parserResponse.json();
    const text = data.map((el: any) => el.text?.trim())
                    .filter(Boolean)
                    .join('\n')
                    .replace(/\n{3,}/g, '\n\n');

    // Store in Supabase
    const supabase = await createClient();
    const { error: insertError } = await supabase
      .from('job_descriptions')
      .insert({
        title: 'Untitled Job Description',
        description: text,
        parsed_text: text,
        is_public: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing job description:', insertError);
      // Continue anyway since we have the parsed text
    }

    return { text };
  } catch (error) {
    console.error('Error parsing file:', error);
    return { error: error instanceof Error ? error.message : 'Failed to parse file' };
  }
} 
