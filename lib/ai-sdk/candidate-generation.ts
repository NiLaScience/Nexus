import { openai, AI_MODEL } from './config';
import type { CandidateGenerationConfig, GeneratedCandidate, SystemMessage, UserMessage } from './types';

const SYSTEM_PROMPT = `You are an expert AI recruiter. Your task is to generate realistic candidate profiles 
based on job requirements and selection criteria. Each candidate should have unique characteristics while 
matching the core requirements. Consider previous feedback when generating new candidates.`;

export async function generateCandidates(
  config: CandidateGenerationConfig
): Promise<GeneratedCandidate[]> {
  const { jobDescription, selectionCriteria, numberOfCandidates, feedback } = config;

  try {
    const messages: (SystemMessage | UserMessage)[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Generate ${numberOfCandidates} candidate profiles for the following job:
        
Job Description:
${jobDescription}

Selection Criteria:
${selectionCriteria.join('\n')}

${feedback ? `Consider this feedback from previous candidates:
${feedback.map(f => `- Candidate ${f.candidateId}: ${f.isPositive ? 'Positive' : 'Negative'}${f.reason ? ` (${f.reason})` : ''}`).join('\n')}` : ''}

Return the candidates as a JSON array with the following structure for each candidate:
{
  "id": "unique-id",
  "name": "Candidate Name",
  "skills": ["skill1", "skill2"],
  "experience": "Summary of experience",
  "matchScore": number between 0-100,
  "reasoning": "Why this candidate is a good match"
}`
      }
    ];

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"candidates": []}');
    return result.candidates;
  } catch (error) {
    throw new Error('Failed to generate candidates: ' + error.message);
  }
}

export async function processCandidateFeedback(
  feedback: CandidateGenerationConfig['feedback']
): Promise<string> {
  if (!feedback?.length) return '';

  const messages: UserMessage[] = [
    {
      role: 'user',
      content: `Analyze this candidate feedback and provide insights for future candidate generation:
      ${feedback.map(f => `- Candidate ${f.candidateId}: ${f.isPositive ? 'Positive' : 'Negative'}${f.reason ? ` (${f.reason})` : ''}`).join('\n')}`
    }
  ];

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages,
    temperature: 0.3
  });

  return response.choices[0].message.content || '';
} 