// Base types for the domain model
export type JobDescription = {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  parsed_content: string;
};

export type Candidate = {
  name: string;
  background: string;
  skills: string[];
  yearsOfExperience: number;
  matchScore: number;
  reasonForMatch: string;
  achievements: string[];
  scoringDetails?: {
    skillsScore: number;
    experienceScore: number;
    achievementsScore: number;
    culturalScore: number;
    leadershipScore?: number;
    scoreBreakdown: string;
  };
};

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

// Scoring types
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
  leadershipCriteria?: Array<{
    attribute: string;
    weight: number;
  }>;
};

export type DbScoringCriteria = {
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

// Workflow types
export type WorkflowState = {
  jobDescriptionId: string;
  iterationCount: number;
  shouldTerminate: boolean;
  currentPhase: 'INITIAL' | 'GENERATING' | 'EVALUATING' | 'WAITING_FEEDBACK' | 'REFINING' | 'COMPLETE';
  refinedCriteria?: CriteriaRefinement;
  scoringCriteria: ScoringCriteria;
  error?: string;
  metadata?: Record<string, unknown>;
  uiCriteria?: {
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
  };
};

export type DbWorkflowState = {
  jobdescriptionid: string;
  iterationcount: number;
  shouldterminate: boolean;
  currentphase: 'INITIAL' | 'GENERATING' | 'EVALUATING' | 'WAITING_FEEDBACK' | 'REFINING' | 'COMPLETE';
  refinedcriteria?: CriteriaRefinement;
  scoringcriteria: DbScoringCriteria;
  error?: string;
  metadata?: Record<string, unknown>;
};

// Refinement types
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
      change: "increased" | "decreased" | "unchanged";
      reason: string;
    }>;
  };
  explanation: string;
};

// Add CandidateProfile type
export type CandidateProfile = {
  id: string;
  name: string;
  background: string;
  skills: string[];
  yearsOfExperience: number;
  matchScore: number;
  reasonForMatch: string;
  achievements: string[];
  scoringDetails?: {
    skillsScore: number;
    experienceScore: number;
    achievementsScore: number;
    culturalScore: number;
    leadershipScore?: number;
    scoreBreakdown: string;
  };
};

export type CandidateEvaluation = {
  candidateId: string;
  jobId: string;
  timestamp: Date;
  overallScore: number;
  categories: Array<{
    name: string;
    weight: number;
    score: number;
    criteria: Array<{
      criterion: string;
      score: number;
      reasoning: string;
    }>;
    notes?: string;
  }>;
  strengths: string[];
  weaknesses: string[];
  recommendations?: string;
  evaluator: 'AI' | 'HUMAN';
  confidence: number;
  metadata?: Record<string, unknown>;
}; 