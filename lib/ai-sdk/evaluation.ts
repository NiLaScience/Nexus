import { AI_MODEL } from './config';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { candidateEvaluationSchema, evaluationCategories, messageTemplates, systemPrompts } from './schema';
import type { 
  CandidateProfile, 
  JobDescription, 
  CandidateEvaluation
} from './types';

export async function evaluateCandidate(
  candidate: CandidateProfile,
  job: JobDescription
): Promise<CandidateEvaluation> {
  try {
    const prompt = messageTemplates.candidateEvaluation.userPrompt(job, candidate, evaluationCategories);

    const result = await generateObject({
      model: openai(AI_MODEL),
      schema: candidateEvaluationSchema,
      prompt,
      messages: [
        systemPrompts.candidateEvaluation,
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Log any warnings for debugging
    if (result.warnings?.length) {
      console.warn('AI SDK Warnings:', result.warnings);
    }

    const evaluation = {
      ...result.response,
      candidateId: candidate.id || 'unknown',
      jobId: job.title,
      timestamp: new Date(),
      evaluator: 'AI' as const,
      confidence: 0.85
    };
    
    return candidateEvaluationSchema.parse(evaluation);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error('Failed to evaluate candidate: ' + errorMessage);
  }
}

export async function evaluateCandidateBatch(
  candidates: { profile: CandidateProfile; jobDescription: JobDescription }[]
): Promise<CandidateEvaluation[]> {
  // Evaluate candidates in parallel
  const evaluations = await Promise.all(
    candidates.map(({ profile, jobDescription }) => 
      evaluateCandidate(profile, jobDescription)
    )
  );

  return evaluations;
} 