import { NextRequest, NextResponse } from 'next/server';
import { batchEvaluationResultsSchema } from '@/lib/ai-sdk/validation';
import type { CandidateProfile, JobDescription, CandidateEvaluation } from '@/lib/ai-sdk/types/base';
import { z, ZodError } from 'zod';

export const runtime = 'edge';

// Request body schema
const evaluateRequestSchema = z.object({
  candidates: z.array(z.object({
    profile: z.custom<CandidateProfile>(),
    jobDescription: z.custom<JobDescription>(),
  })),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    evaluateRequestSchema.parse(body);
    
    // TODO: Implement evaluation logic in lib/ai-sdk/evaluation.ts
    const evaluations: CandidateEvaluation[] = [];
    
    // Calculate batch metrics
    const averageScore = evaluations.reduce((sum, evaluation) => sum + evaluation.overallScore, 0) / evaluations.length;
    const topCandidates = evaluations
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 3);
    
    // Format results
    const results = {
      evaluations,
      batchMetrics: {
        averageScore,
        topCandidates,
        totalCandidates: evaluations.length
      }
    };

    // Validate results
    const validatedResults = batchEvaluationResultsSchema.parse(results);

    return NextResponse.json(validatedResults);
  } catch (error) {
    console.error('Error evaluating candidates:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request format',
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Failed to evaluate candidates'
    }, { status: 500 });
  }
} 