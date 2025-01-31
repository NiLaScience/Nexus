import { z } from 'zod';

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

// Candidate Profile Schema
export const candidateProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  skills: z.array(z.string()),
  experience: z.object({
    years: z.number(),
    summary: z.string(),
    highlights: z.array(z.string()),
  }),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.number(),
  })).optional(),
  certifications: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  matchScore: z.number().min(0).max(100),
  reasoning: z.string(),
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

export const systemPrompts = {
  candidateGeneration: {
    role: 'system' as const,
    content: `You are an expert AI recruiter. Your task is to generate realistic candidate profiles 
based on job requirements and selection criteria. Each candidate should have unique characteristics while 
matching the core requirements. Consider previous feedback when generating new candidates.`,
    temperature: 0.7,
    shouldStream: false,
  },
  
  candidateEvaluation: {
    role: 'system' as const,
    content: `You are an expert AI recruiter evaluating candidate fit for a job position.
Analyze the candidate's profile against the job requirements and provide a detailed evaluation.
Focus on both technical skills and soft skills alignment. Consider experience level, skill match, 
and potential for growth. Be objective and thorough in your assessment.`,
    temperature: 0.3,
    shouldStream: false,
  },
  
  feedbackAnalysis: {
    role: 'system' as const,
    content: `You are an AI recruitment analyst processing candidate feedback.
Analyze patterns in the feedback to identify key strengths and areas for improvement.
Consider both positive and negative feedback to refine future candidate recommendations.
Be objective and focus on actionable insights.`,
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

// Infer types from schemas
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
 