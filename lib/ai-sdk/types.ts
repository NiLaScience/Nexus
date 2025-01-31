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
  requiredSkills: Array<{
    skill: string;
    weight: number;
  }>;
  preferredSkills: Array<{
    skill: string;
    weight: number;
  }>;
  experienceLevels: {
    minimum: number;
    preferred: number;
    maximum: number;
    yearsWeight: number;
  };
  culturalCriteria: Array<{
    attribute: string;
    weight: number;
  }>;
  leadershipCriteria: Array<{
    attribute: string;
    weight: number;
  }>;
};

export type CriteriaRefinement = {
  refinedCriteria: {
    requiredSkills: Array<{
      skill: string;
      importance: number;
      reason: string;
    }>;
    preferredSkills: Array<{
      skill: string;
      importance: number;
      reason: string;
    }>;
    experienceLevel: {
      minYears: number;
      maxYears: number;
      reason: string;
    };
    culturalAttributes: Array<{
      attribute: string;
      importance: number;
      reason: string;
    }>;
    adjustments: Array<{
      aspect: string;
      change: 'increased' | 'decreased' | 'unchanged';
      reason: string;
    }>;
  };
  explanation: string;
};

export interface CandidateGenerationConfig {
  jobDescription: string;
  selectionCriteria: string[];
  numberOfCandidates: number;
  feedback?: CandidateFeedback[];
}

export interface GeneratedCandidate {
  name: string;
  background: string;
  skills: string[];
  yearsOfExperience: number;
  achievements: string[];
  matchScore: number;
  reasonForMatch: string;
  scoringDetails: {
    skillsScore: number;
    experienceScore: number;
    achievementsScore: number;
    culturalScore: number;
    leadershipScore?: number;
    scoreBreakdown: string;
  };
}

// Basic types for the simplified workflow
export interface Candidate {
  name: string;
  background: string;
  skills: string[];
  yearsOfExperience: number;
  matchScore: number;
  reasonForMatch: string;
}

export interface JobDescription {
  id: string;
  title: string;
  description: string;
  requirements: string[];
}

export interface GenerationConfig {
  jobDescription: string;
  selectionCriteria: string[];
  numberOfCandidates: number;
  feedback?: CandidateFeedback[];
} 