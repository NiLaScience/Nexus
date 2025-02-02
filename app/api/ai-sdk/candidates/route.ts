import { NextRequest } from 'next/server';
import { generateCandidates } from '@/lib/ai-sdk/candidate-generation';
import { jobDescriptionSchema } from '@/lib/ai-sdk/validation';
import type { CandidateGenerationConfig } from '@/lib/ai-sdk/types';
import { ZodError } from 'zod';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the structured job description from the LLM
    const jobDesc = jobDescriptionSchema.parse(body.jobDescription);
    
    // Format the job description as a string for the generation config
    const jobDescriptionString = `
      Title: ${jobDesc.title}
      Description: ${jobDesc.description}
      Requirements: ${jobDesc.requirements.join(', ')}
      Responsibilities: ${jobDesc.responsibilities.join(', ')}
      Experience Level: ${jobDesc.experienceLevel}
      Employment Type: ${jobDesc.employmentType}
      Remote: ${jobDesc.remote}
      ${jobDesc.location ? `Location: ${jobDesc.location}` : ''}
    `.trim();

    // Create the generation config
    const config: CandidateGenerationConfig = {
      jobDescription: jobDescriptionString,
      selectionCriteria: body.selectionCriteria,
      numberOfCandidates: body.numberOfCandidates,
      feedback: body.feedback
    };

    // Generate candidates
    const candidates = await generateCandidates(config);

    return new Response(JSON.stringify({ candidates }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error generating candidates:', error);
    
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format',
          details: error.errors 
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to generate candidates' }),
      { status: 500 }
    );
  }
} 