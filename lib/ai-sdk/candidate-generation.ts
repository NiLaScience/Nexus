// /lib/ai-sdk/candidate-generation.ts

import { AI_MODEL } from './config';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { candidateProfileSchema } from './schema';
import type { CandidateGenerationConfig, GeneratedCandidate } from './types';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Define the response schema using the candidateProfileSchema (omitting id since we add our own)
const candidatesResponseSchema = z.object({
  candidates: z.array(candidateProfileSchema.omit({ id: true }))
});

/**
 * Generates candidate profiles using the AI SDK generateObject function.
 * The feedback (if any) is included in the prompt.
 *
 * @param config - Candidate generation configuration
 * @returns Array of generated candidates with assigned UUIDs
 */
export async function generateCandidates(
  config: CandidateGenerationConfig
): Promise<GeneratedCandidate[]> {
  const { jobDescription, selectionCriteria, numberOfCandidates, feedback } = config;

  try {
    console.log('Generating candidates with config:', {
      jobDescription: jobDescription.substring(0, 100) + '...',
      selectionCriteria,
      numberOfCandidates,
      feedbackCount: feedback?.length || 0
    });

    const result = await generateObject({
      model: openai(AI_MODEL),
      schema: candidatesResponseSchema,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert AI recruiter. Generate realistic candidate profiles that match the job requirements. Each candidate should have unique characteristics while matching the core requirements.'
        },
        {
          role: 'user',
          content: `Generate ${numberOfCandidates} candidate profiles for the following job:
        
Job Description:
${jobDescription}

Selection Criteria:
${selectionCriteria.join('\n')}

${feedback ? `Consider this feedback from previous candidates:
${feedback.map(f => `- Candidate ${f.candidateId}: ${f.isPositive ? 'Positive' : 'Negative'}${f.reason ? ` (${f.reason})` : ''}`).join('\n')}` : ''}

Important:
- Each candidate must have a detailed background summary
- Include specific achievements that demonstrate their expertise
- Provide accurate years of experience
- Give detailed reasoning for match scores
- Include scoring details with breakdown for each category
- Return response as a JSON array of candidates`
        }
      ]
    });

    // Log raw AI result for debugging purposes.
    console.log('Raw AI result:', JSON.stringify(result, null, 2));

    if (!result.object) {
      console.error('Missing result.object');
      throw new Error('No object generated by AI');
    }

    if (!Array.isArray(result.object.candidates)) {
      console.error('Invalid candidates array:', result.object);
      throw new Error('Invalid candidates array in response');
    }

    // Add UUIDs to each candidate and ensure scoringDetails exist.
    const candidates = result.object.candidates.map(candidate => ({
      id: uuidv4(),
      ...candidate,
      scoringDetails: candidate.scoringDetails || {
        skillsScore: 0,
        experienceScore: 0,
        achievementsScore: 0,
        culturalScore: 0,
        scoreBreakdown: 'No scoring details provided'
      }
    }));

    console.log('Generated candidates:', candidates);
    return candidates as GeneratedCandidate[];

  } catch (error: unknown) {
    console.error('Generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error('Failed to generate candidates: ' + errorMessage);
  }
}
