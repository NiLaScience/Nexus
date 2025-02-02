import { type ChatCompletionMessageParam } from 'openai/resources/chat';
import { 
  type JobDescription, 
  type CandidateProfile, 
  type CandidateFeedback,
  type Candidate,
  type ScoringCriteria,
  type DbScoringCriteria,
  type WorkflowState,
  type DbWorkflowState,
  type CriteriaRefinement
} from './types/base';

export type SystemMessage = {
  role: 'system';
  content: string;
};

export type UserMessage = {
  role: 'user';
  content: string;
};

export type AIMessage = ChatCompletionMessageParam;

export type CandidateGenerationConfig = {
  jobDescription: string;
  selectionCriteria: string[];
  numberOfCandidates: number;
  feedback?: CandidateFeedback[];
};

export type GeneratedCandidate = {
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
};

export type {
  JobDescription,
  CandidateProfile,
  CandidateFeedback,
  Candidate,
  ScoringCriteria,
  DbScoringCriteria,
  WorkflowState,
  DbWorkflowState,
  CriteriaRefinement
}; 