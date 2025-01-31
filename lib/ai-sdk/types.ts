import { type ChatCompletionMessageParam, type ChatCompletionSystemMessageParam, type ChatCompletionUserMessageParam } from 'openai/resources/chat';
import { z } from 'zod';
export { 
  type JobDescription, 
  type SelectionCriteria, 
  type CandidateProfile, 
  type GenerationConfig,
  type EvaluationCategory,
  type CandidateEvaluation,
  type BatchEvaluationResults
} from './schema';

export type SystemMessage = {
  role: 'system';
  content: string;
};

export type UserMessage = {
  role: 'user';
  content: string;
};

export type AIMessage = ChatCompletionMessageParam;

export type CandidateFeedback = {
  candidateId: string;
  isPositive: boolean;
  reason?: string;
  criteria?: Array<{
    category: string;
    score: number;
    comment?: string;
  }>;
};

export type WorkflowState = {
  jobDescriptionId: string;
  iterationCount: number;
  shouldTerminate: boolean;
  currentPhase: 'INITIAL' | 'GENERATING' | 'EVALUATING' | 'REFINING' | 'COMPLETE';
  scoringCriteria: ScoringCriteria;
  refinedCriteria?: CriteriaRefinement;
  error?: string;
};

export type ScoringCriteria = {
  skillsWeight: number;
  experienceWeight: number;
  achievementsWeight: number;
  culturalWeight: number;
  leadershipWeight: number;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevels: {
    minimum: number;
    preferred: number;
    maximum: number;
    yearsWeight: number;
  };
  culturalCriteria: string[];
  leadershipCriteria: string[];
};

export type CriteriaRefinement = {
  updatedSkills: {
    required: string[];
    preferred: string[];
    removed: string[];
  };
  updatedExperience: {
    minimum: number;
    preferred: number;
    maximum: number;
  };
  updatedCulturalCriteria: string[];
  updatedLeadershipCriteria: string[];
  reasonForChanges: string;
  confidence: number;
}; 