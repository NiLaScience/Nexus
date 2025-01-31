import { type ChatCompletionMessageParam } from 'openai/resources/chat';
import { z } from 'zod';
export { 
  type JobDescription, 
  type SelectionCriteria, 
  type CandidateProfile, 
  type GenerationConfig,
  type EvaluationCategory,
  type CandidateEvaluation,
  type BatchEvaluationResults,
  type CandidateFeedback,
  type Candidate
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

export interface WorkflowState {
  jobdescriptionid: string;
  iterationcount: number;
  shouldterminate: boolean;
  currentphase: 'INITIAL' | 'GENERATING' | 'REFINING' | 'COMPLETE';
  scoringcriteria: {
    skillsweight: number;
    experienceweight: number;
    achievementsweight: number;
    culturalweight: number;
    leadershipweight: number;
    requiredskills: Array<{
      skill: string;
      weight: number;
    }>;
    preferredskills: Array<{
      skill: string;
      weight: number;
    }>;
    experiencelevels: {
      minimum: number;
      preferred: number;
      maximum: number;
      yearsweight: number;
    };
    culturalcriteria: Array<{
      attribute: string;
      weight: number;
    }>;
    leadershipcriteria?: Array<{
      attribute: string;
      weight: number;
    }>;
  };
  refinedcriteria?: CriteriaRefinement;
  createdat?: string;
  updatedat?: string;
}

export interface CriteriaRefinement {
  refinedcriteria: {
    requiredskills: Array<{
      skill: string;
      importance: number;
      reason: string;
    }>;
    preferredskills: Array<{
      skill: string;
      importance: number;
      reason: string;
    }>;
    experiencelevel: {
      minyears: number;
      maxyears: number;
      reason: string;
    };
    culturalattributes: Array<{
      attribute: string;
      importance: number;
      reason: string;
    }>;
    adjustments: Array<{
      aspect: string;
      change: "increased" | "decreased" | "unchanged";
      reason: string;
    }>;
  };
  explanation: string;
}

export interface CandidateGenerationConfig {
  jobDescription: string;
  selectionCriteria: string[];
  numberOfCandidates: number;
  feedback?: Array<{
    candidateId: string;
    isPositive: boolean;
    reason?: string;
  }>;
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