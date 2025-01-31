import { NextRequest } from 'next/server';
import { generateCandidates } from '@/lib/ai-sdk/candidate-generation';
import { generationConfigSchema } from '@/lib/ai-sdk/schema';
import type { GenerationConfig } from '@/lib/ai-sdk/types';
import { ZodError } from 'zod';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body against schema
    const config: GenerationConfig = generationConfigSchema.parse(body);
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