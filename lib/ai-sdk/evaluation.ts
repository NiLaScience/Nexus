import { openai, AI_MODEL } from './config';
import type { 
  CandidateProfile, 
  JobDescription, 
  CandidateEvaluation,
  EvaluationCategory,
  SystemMessage,
  UserMessage 
} from './types';

const EVALUATION_PROMPT = `You are an expert AI recruiter evaluating candidate fit for a job position.
Analyze the candidate's profile against the job requirements and provide a detailed evaluation.
Focus on both technical skills and soft skills alignment. Consider experience level, skill match, 
and potential for growth. Be objective and thorough in your assessment.`;

const DEFAULT_CATEGORIES = [
  {
    name: 'Technical Skills',
    weight: 0.4,
    criteria: ['Required Skills Match', 'Technical Experience', 'Technical Depth']
  },
  {
    name: 'Experience',
    weight: 0.3,
    criteria: ['Years of Experience', 'Industry Knowledge', 'Project Complexity']
  },
  {
    name: 'Education & Certifications',
    weight: 0.15,
    criteria: ['Education Level', 'Relevant Certifications', 'Continuous Learning']
  },
  {
    name: 'Job Fit',
    weight: 0.15,
    criteria: ['Role Alignment', 'Company Culture', 'Growth Potential']
  }
];

export async function evaluateCandidate(
  candidate: CandidateProfile,
  job: JobDescription
): Promise<CandidateEvaluation> {
  const messages: (SystemMessage | UserMessage)[] = [
    { role: 'system', content: EVALUATION_PROMPT },
    {
      role: 'user',
      content: `Please evaluate this candidate for the following job:

Job Title: ${job.title}
Job Description: ${job.description}
Requirements: ${job.requirements.join(', ')}
Experience Level: ${job.experienceLevel}

Candidate Profile:
Name: ${candidate.name}
Skills: ${candidate.skills.join(', ')}
Experience: ${candidate.experience.summary}
Education: ${candidate.education?.map(e => `${e.degree} from ${e.institution}`).join(', ') || 'Not specified'}

Evaluate the candidate across these categories:
${DEFAULT_CATEGORIES.map(cat => 
  `${cat.name} (Weight: ${cat.weight})
   Criteria: ${cat.criteria.join(', ')}`
).join('\n')}

Return a JSON object matching the CandidateEvaluation schema with detailed scoring and reasoning.`
    }
  ];

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages,
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  const evaluation = JSON.parse(response.choices[0].message.content || '{}');
  
  // Calculate overall score based on weighted category scores
  const overallScore = evaluation.categories.reduce(
    (acc: number, cat: EvaluationCategory) => acc + (cat.score * cat.weight),
    0
  );

  return {
    candidateId: candidate.id,
    jobId: job.title, // Using title as ID for now
    timestamp: new Date(),
    overallScore,
    ...evaluation,
    evaluator: 'AI',
    confidence: 0.85, // TODO: Implement confidence scoring
  };
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