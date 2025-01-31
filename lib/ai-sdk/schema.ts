import { z } from 'zod';

// 1. First define the candidate profile schema
export const candidateProfileSchema = z.object({
  id: z.string().uuid().describe('Unique identifier for the candidate'),
  name: z.string().describe('Full name of the candidate'),
  background: z.string().describe('Professional background and summary'),
  skills: z.array(z.string()).describe('List of technical skills'),
  yearsOfExperience: z.number().describe('Years of experience'),
  achievements: z.array(z.string()).describe('Notable achievements'),
  matchScore: z.number().min(0).max(100).describe('Match score (0-100)'),
  reasonForMatch: z.string().describe('Why this candidate matches'),
  scoringDetails: z.object({
    skillsScore: z.number().describe('Skills match score'),
    experienceScore: z.number().describe('Experience match score'),
    achievementsScore: z.number().describe('Achievements match score'),
    culturalScore: z.number().describe('Cultural fit score'),
    scoreBreakdown: z.string().describe('Detailed score explanation')
  }).describe('Scoring breakdown')
});

// 2. Then define the response schema that uses it
export const candidatesResponseSchema = z.object({
  candidates: z.array(candidateProfileSchema).describe('Array of candidate profiles')
});

// 3. Base schemas
export const baseJobDescriptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  requirements: z.array(z.string()),
  parsed_content: z.string()
});

export const baseCandidateSchema = z.object({
  name: z.string(),
  background: z.string(),
  skills: z.array(z.string()),
  yearsOfExperience: z.number(),
  matchScore: z.number().min(0).max(100),
  reasonForMatch: z.string(),
  achievements: z.array(z.string()),
  scoringDetails: z.object({
    skillsScore: z.number(),
    experienceScore: z.number(),
    achievementsScore: z.number(),
    culturalScore: z.number(),
    leadershipScore: z.number().optional(),
    scoreBreakdown: z.string()
  }).optional()
});

export const baseFeedbackSchema = z.object({
  candidateId: z.string(),
  isPositive: z.boolean(),
  reason: z.string().optional()
});

// 4. Request schemas
export const candidateMatchingRequestSchema = z.object({
  jobDescriptionId: z.string().uuid(),
  workflowType: z.enum(['langgraph', 'ai_sdk']).default('ai_sdk'),
  feedback: z.array(baseFeedbackSchema).optional()
});

export const feedbackRequestSchema = z.object({
  jobDescriptionId: z.string(),
  feedback: z.array(baseFeedbackSchema)
});

export const candidateGenerationConfigSchema = z.object({
  jobDescription: z.string(),
  selectionCriteria: z.array(z.string()),
  numberOfCandidates: z.number().min(1).max(10),
  feedback: z.array(baseFeedbackSchema).optional()
});

// 5. Types
export type JobDescription = z.infer<typeof baseJobDescriptionSchema>;
export type Candidate = z.infer<typeof baseCandidateSchema>;
export type CandidateFeedback = z.infer<typeof baseFeedbackSchema>;
export type CandidateGenerationConfig = z.infer<typeof candidateGenerationConfigSchema>;

// Job Description Schema
export const jobDescriptionSchema = z.object({
  title: z.string(),
  description: z.string(),
  requirements: z.array(z.string()),
  responsibilities: z.array(z.string()),
  location: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE']),
  experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']),
  remote: z.boolean().default(false),
});

// Selection Criteria Schema
export const selectionCriteriaSchema = z.object({
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  minimumYearsExperience: z.number(),
  educationLevel: z.enum(['HIGH_SCHOOL', 'BACHELORS', 'MASTERS', 'PHD']).optional(),
  certifications: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
});

// Feedback Schema
export const feedbackSchema = z.object({
  candidateId: z.string(),
  isPositive: z.boolean(),
  reason: z.string().optional(),
  timestamp: z.date(),
  criteria: z.array(z.object({
    category: z.string(),
    score: z.number().min(1).max(5),
    comment: z.string().optional(),
  })).optional(),
});

// Generation Config Schema
export const generationConfigSchema = z.object({
  jobDescription: jobDescriptionSchema,
  selectionCriteria: selectionCriteriaSchema,
  numberOfCandidates: z.number().min(1).max(10),
  feedback: z.array(feedbackSchema).optional(),
});

// Evaluation Category Schema
export const evaluationCategorySchema = z.object({
  name: z.string(),
  weight: z.number().min(0).max(1),
  score: z.number().min(0).max(100),
  criteria: z.array(z.object({
    criterion: z.string(),
    score: z.number().min(0).max(100),
    reasoning: z.string(),
  })),
  notes: z.string().optional(),
});

// Candidate Evaluation Schema
export const candidateEvaluationSchema = z.object({
  candidateId: z.string(),
  jobId: z.string(),
  timestamp: z.date(),
  overallScore: z.number().min(0).max(100),
  categories: z.array(evaluationCategorySchema),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.string().optional(),
  evaluator: z.enum(['AI', 'HUMAN']).default('AI'),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.string()).optional(),
});

// Batch Evaluation Results Schema
export const batchEvaluationResultsSchema = z.object({
  jobId: z.string(),
  timestamp: z.date(),
  candidates: z.array(candidateEvaluationSchema),
  averageScore: z.number().min(0).max(100),
  topCandidates: z.array(z.string()),
  evaluationMetrics: z.object({
    diversityScore: z.number().min(0).max(100).optional(),
    skillCoverage: z.number().min(0).max(100).optional(),
    teamFit: z.number().min(0).max(100).optional(),
  }).optional(),
});

// Prompt Schemas and Configurations
export const promptConfigSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  shouldStream: z.boolean().default(false),
});

// Feedback Analysis Schema
export const feedbackAnalysisSchema = z.object({
  patterns: z.object({
    positivePatterns: z.array(z.string()),
    negativePatterns: z.array(z.string()),
    skillGaps: z.array(z.string()),
    culturalInsights: z.array(z.string())
  }),
  recommendations: z.object({
    skillsToEmphasize: z.array(z.string()),
    skillsToDeemphasize: z.array(z.string()),
    experienceAdjustments: z.array(z.string()),
    culturalFitAdjustments: z.array(z.string())
  }),
  confidence: z.number()
});

// Message Templates and Prompts
export const messageTemplates = {
  candidateEvaluation: {
    userPrompt: (job: JobDescription, candidate: CandidateProfile, categories: typeof evaluationCategories) => `Please evaluate this candidate for the following job:

Job Title: ${job.title}
Job Description: ${job.description}
Requirements: ${job.requirements.join(', ')}
Experience Level: ${job.experienceLevel}

Candidate Profile:
Name: ${candidate.name}
Skills: ${candidate.skills.join(', ')}
Background: ${candidate.background}
Years of Experience: ${candidate.yearsOfExperience}
Achievements: ${candidate.achievements.join(', ')}

Evaluate the candidate across these categories:
${Object.entries(categories).map(([_, cat]) => 
  `${cat.name} (Weight: ${cat.weight})
   Criteria: ${cat.criteria.join(', ')}`
).join('\n')}`
  },

  candidateGeneration: {
    userPrompt: (config: GenerationConfig) => `Generate ${config.numberOfCandidates} candidate profiles for the following job and return them as a JSON array:
        
Job Description:
${config.jobDescription.description}

Selection Criteria:
${Object.entries(config.selectionCriteria)
  .filter(([key]) => key !== 'educationLevel' && key !== 'certifications' && key !== 'languages')
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: ${value.join(', ')}`;
    }
    return `${key}: ${value}`;
  })
  .join('\n')}

${config.feedback ? `Consider this feedback from previous candidates:
${config.feedback.map(f => `- Candidate ${f.candidateId}: ${f.isPositive ? 'Positive' : 'Negative'}${f.reason ? ` (${f.reason})` : ''}`).join('\n')}` : ''}

Important:
- Each candidate must have a detailed background summary
- Include specific achievements that demonstrate their expertise
- Provide accurate years of experience
- Give detailed reasoning for match scores
- Include scoring details with breakdown for each category
- Return response as a JSON array of candidate objects`
  },

  feedbackAnalysis: {
    userPrompt: (feedback: CandidateFeedback[]) => `Analyze the following candidate feedback and identify patterns and insights. Return your analysis as a JSON object:

${feedback.map(f => {
  const details = [
    `Candidate ${f.candidateId}: ${f.isPositive ? 'Positive' : 'Negative'}`,
    f.reason ? `Reason: ${f.reason}` : null,
    f.criteria?.map(c => `${c.category}: ${c.score}/5${c.comment ? ` (${c.comment})` : ''}`).join(', ')
  ].filter(Boolean).join(' - ');
  
  return `- ${details}`;
}).join('\n')}`
  },

  criteriaRefinement: {
    userPrompt: (currentState: WorkflowState, feedbackAnalysis: any) => `Based on the feedback analysis, refine the job criteria and return the refinements as a JSON object:

Current Criteria:
${JSON.stringify(currentState.refinedCriteria || currentState.scoringCriteria, null, 2)}

Feedback Analysis:
${JSON.stringify(feedbackAnalysis, null, 2)}`
  }
} as const;

// System Prompts
export const systemPrompts = {
  candidateGeneration: {
    role: 'system' as const,
    content: `You are an expert AI recruiter. Your task is to generate realistic candidate profiles 
based on job requirements and selection criteria. Each candidate should have unique characteristics while 
matching the core requirements. Consider previous feedback when generating new candidates.

Return your response as a JSON object matching the following Zod schema:
${candidateProfileSchema.toString()}`,
    temperature: 0.7,
    shouldStream: false,
  },
  
  candidateEvaluation: {
    role: 'system' as const,
    content: `You are an expert AI recruiter evaluating candidate fit for a job position.
Analyze the candidate's profile against the job requirements and provide a detailed evaluation.
Focus on both technical skills and soft skills alignment. Consider experience level, skill match, 
and potential for growth. Be objective and thorough in your assessment.

Return your response as a JSON object matching the following Zod schema:
${candidateEvaluationSchema.toString()}`,
    temperature: 0.3,
    shouldStream: false,
  },
  
  feedbackAnalysis: {
    role: 'system' as const,
    content: `You are an AI recruitment analyst processing candidate feedback.
Analyze patterns in the feedback to identify key strengths and areas for improvement.
Consider both positive and negative feedback to refine future candidate recommendations.
Be objective and focus on actionable insights.

Return your response as a JSON object matching the following Zod schema:
${feedbackAnalysisSchema.toString()}`,
    temperature: 0.3,
    shouldStream: false,
  }
} as const;

export const evaluationCategories = {
  technical: {
    name: 'Technical Skills',
    weight: 0.4,
    criteria: ['Required Skills Match', 'Technical Experience', 'Technical Depth']
  },
  experience: {
    name: 'Experience',
    weight: 0.3,
    criteria: ['Years of Experience', 'Industry Knowledge', 'Project Complexity']
  },
  education: {
    name: 'Education & Certifications',
    weight: 0.15,
    criteria: ['Education Level', 'Relevant Certifications', 'Continuous Learning']
  },
  jobFit: {
    name: 'Job Fit',
    weight: 0.15,
    criteria: ['Role Alignment', 'Company Culture', 'Growth Potential']
  }
} as const;

// Scoring Criteria Schema (from original implementation)
export const scoringCriteriaSchema = z.object({
  skillsWeight: z.number().min(0).max(1),
  experienceWeight: z.number().min(0).max(1),
  achievementsWeight: z.number().min(0).max(1),
  culturalWeight: z.number().min(0).max(1),
  leadershipWeight: z.number().min(0).max(1),
  requiredSkills: z.array(z.object({
    skill: z.string(),
    weight: z.number().min(1).max(5)
  })),
  preferredSkills: z.array(z.object({
    skill: z.string(),
    weight: z.number().min(1).max(3)
  })),
  experienceLevels: z.object({
    minimum: z.number(),
    preferred: z.number(),
    maximum: z.number(),
    yearsWeight: z.number().min(0).max(1)
  }),
  culturalCriteria: z.array(z.object({
    attribute: z.string(),
    weight: z.number().min(1).max(5)
  })),
  leadershipCriteria: z.array(z.object({
    attribute: z.string(),
    weight: z.number().min(1).max(5)
  })).optional()
});

// Criteria Refinement Schema (from original implementation)
export const criteriaRefinementSchema = z.object({
  refinedCriteria: z.object({
    requiredSkills: z.array(z.object({
      skill: z.string(),
      importance: z.number().describe("A number between 1 and 5"),
      reason: z.string()
    })),
    preferredSkills: z.array(z.object({
      skill: z.string(),
      importance: z.number().describe("A number between 1 and 5"),
      reason: z.string()
    })),
    experienceLevel: z.object({
      minYears: z.number(),
      maxYears: z.number(),
      reason: z.string()
    }),
    culturalAttributes: z.array(z.object({
      attribute: z.string(),
      importance: z.number().describe("A number between 1 and 5"),
      reason: z.string()
    })),
    adjustments: z.array(z.object({
      aspect: z.string(),
      change: z.enum(["increased", "decreased", "unchanged"]),
      reason: z.string()
    }))
  }).describe("Structured refinements to the job criteria"),
  explanation: z.string().describe("Overall explanation of the refinements made")
});

// Workflow State Schema
export const workflowStateSchema = z.object({
  jobDescriptionId: z.string(),
  iterationCount: z.number().min(0),
  shouldTerminate: z.boolean().default(false),
  currentPhase: z.enum(['INITIAL', 'GENERATING', 'EVALUATING', 'WAITING_FEEDBACK', 'REFINING', 'COMPLETE']),
  refinedCriteria: criteriaRefinementSchema.optional(),
  scoringCriteria: scoringCriteriaSchema,
  error: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

// Iteration History Schema
export const iterationHistorySchema = z.object({
  jobDescriptionId: z.string(),
  iterationNumber: z.number(),
  timestamp: z.date(),
  refinedCriteria: criteriaRefinementSchema,
  scoringCriteria: scoringCriteriaSchema,
  feedbackSummary: z.object({
    totalVotes: z.number(),
    upvotes: z.number(),
    upvotePercentage: z.number(),
    feedbackDetails: z.array(z.object({
      candidateId: z.string(),
      isGoodFit: z.boolean(),
      feedback: z.string().optional()
    }))
  }),
  performance: z.object({
    averageMatchScore: z.number(),
    topCandidateScore: z.number(),
    diversityScore: z.number().optional(),
    convergenceRate: z.number().optional()
  }).optional()
});

// Type exports
export type JobDescription = z.infer<typeof jobDescriptionSchema>;
export type SelectionCriteria = z.infer<typeof selectionCriteriaSchema>;
export type CandidateProfile = z.infer<typeof candidateProfileSchema>;
export type CandidateFeedback = z.infer<typeof feedbackSchema>;
export type GenerationConfig = z.infer<typeof generationConfigSchema>;
export type EvaluationCategory = z.infer<typeof evaluationCategorySchema>;
export type CandidateEvaluation = z.infer<typeof candidateEvaluationSchema>;
export type BatchEvaluationResults = z.infer<typeof batchEvaluationResultsSchema>;
export type PromptConfig = z.infer<typeof promptConfigSchema>;
export type SystemPrompts = typeof systemPrompts;
export type EvaluationCategories = typeof evaluationCategories;
export type ScoringCriteria = z.infer<typeof scoringCriteriaSchema>;
export type CriteriaRefinement = z.infer<typeof criteriaRefinementSchema>;
export type WorkflowState = z.infer<typeof workflowStateSchema>;
export type IterationHistory = z.infer<typeof iterationHistorySchema>;
export type FeedbackAnalysis = z.infer<typeof feedbackAnalysisSchema>;
 