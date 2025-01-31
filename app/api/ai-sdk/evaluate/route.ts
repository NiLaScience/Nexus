import { NextRequest } from 'next/server';
import { candidateEvaluationSchema, batchEvaluationResultsSchema } from '@/lib/ai-sdk/schema';
import type { CandidateProfile, JobDescription, CandidateEvaluation } from '@/lib/ai-sdk/types';
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
    const { candidates } = evaluateRequestSchema.parse(body);
    
    // TODO: Implement evaluation logic in lib/ai-sdk/evaluation.ts
    const evaluations: CandidateEvaluation[] = [];
    
    // Calculate batch metrics
    const averageScore = evaluations.reduce((sum, eval) => sum + eval.overallScore, 0) / evaluations.length;
    const topCandidates = evaluations
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 3)
      .map(eval => eval.candidateId);

    // Create batch results
    const results = batchEvaluationResultsSchema.parse({
      jobId: candidates[0].jobDescription.id, // Assuming all candidates are for the same job
      timestamp: new Date(),
      candidates: evaluations,
      averageScore,
      topCandidates,
      evaluationMetrics: {
        skillCoverage: 0, // TODO: Implement these metrics
        teamFit: 0,
        diversityScore: 0,
      },
    });

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error evaluating candidates:', error);
    
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
      JSON.stringify({ error: 'Failed to evaluate candidates' }),
      { status: 500 }
    );
  }
} 