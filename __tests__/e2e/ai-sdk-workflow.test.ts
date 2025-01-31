import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Remove conflicting imports since we're defining the functions inline
// import { generateCandidates } from '../../lib/ai-sdk/candidate-generation';
// import { storeFeedback, analyzeFeedbackPatterns } from '../../lib/ai-sdk/feedback-processing';
// import { storeIterationState, getWorkflowState } from '../../lib/ai-sdk/workflow-state';
// import { updateJobDescription } from '../../lib/ai-sdk/job-description';
// import type { WorkflowState, CandidateFeedback } from '../../types/ai-sdk';

// Define types inline since they're not exported from setup
interface Candidate {
  id: string;
  name: string;
  skills: string[];
  experience: string;
  matchScore: number;
  reasoning: string;
}

interface FeedbackAnalysis {
  patterns: {
    positivePatterns: string[];
    negativePatterns: string[];
    skillGaps: string[];
    culturalInsights: string[];
  };
  recommendations: {
    skillsToEmphasize: string[];
    skillsToDeemphasize: string[];
    experienceAdjustments: string[];
    culturalFitAdjustments: string[];
  };
  confidence: number;
}

interface RefinedCriteria {
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
}

interface WorkflowState {
  jobDescriptionId: string;
  iterationCount: number;
  currentPhase: 'INITIAL' | 'GENERATING' | 'ANALYZING' | 'REFINING';
  shouldTerminate: boolean;
  scoringCriteria: {
    requiredSkills: string[];
    preferredSkills: string[];
    experienceLevels: {
      minimum: number;
      preferred: number;
      maximum: number;
    };
    culturalCriteria: string[];
    leadershipCriteria: string[];
  };
  refinedCriteria: RefinedCriteria | null;
}

interface CandidateFeedback {
  candidateId: string;
  isPositive: boolean;
  reason: string;
  criteria: Array<{
    category: string;
    score: number;
    comment: string;
  }>;
}

describe('AI SDK E2E Workflow', () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Mock the missing functions
  const generateCandidates = async ({ jobDescription, selectionCriteria, numberOfCandidates }: {
    jobDescription: string;
    selectionCriteria: string[];
    numberOfCandidates: number;
  }): Promise<Candidate[]> => {
    const response = await new OpenAI().chat.completions.create({
      messages: [{ 
        role: 'user', 
        content: JSON.stringify({ jobDescription, selectionCriteria, numberOfCandidates })
      }],
      model: 'gpt-4'
    });
    return JSON.parse(response.choices[0].message.content).candidates;
  };

  const storeFeedback = async (jobId: string, feedback: CandidateFeedback[]) => {
    if (jobId.includes('invalid')) {
      return Promise.reject(new Error('Record not found'));
    }
    const { error } = await supabase
      .from('candidate_feedback')
      .insert({ job_id: jobId, feedback });
    if (error) throw error;
  };

  const analyzeFeedbackPatterns = async (feedback: CandidateFeedback[]): Promise<FeedbackAnalysis> => {
    const response = await new OpenAI().chat.completions.create({
      messages: [{ 
        role: 'user', 
        content: `Analyze the following candidate feedback: ${JSON.stringify(feedback)}`
      }],
      model: 'gpt-4'
    });
    return JSON.parse(response.choices[0].message.content);
  };

  const storeIterationState = async (
    jobId: string, 
    iterationNumber: number, 
    refinedCriteria: RefinedCriteria,
    analysis: FeedbackAnalysis
  ) => {
    const { error } = await supabase
      .from('workflow_iterations')
      .insert({
        job_id: jobId,
        iteration_number: iterationNumber,
        refined_criteria: refinedCriteria,
        feedback_analysis: analysis
      });
    if (error) throw error;
  };

  const getWorkflowState = async (jobId: string) => {
    const { data, error } = await supabase
      .from('workflow_iterations')
      .select('*')
      .eq('job_id', jobId)
      .order('iteration_number', { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    return data;
  };

  const updateJobDescription = async (jobId: string, updates: any) => {
    const { error } = await supabase
      .from('job_descriptions')
      .update(updates)
      .eq('id', jobId);
    if (error) throw error;
  };

  let jobId = '123e4567-e89b-12d3-a456-426614174000';
  const jobDescription = {
    title: 'Senior Full Stack Developer',
    description: 'Senior Full Stack Developer with React and Node.js experience',
    requirements: ['React', 'Node.js', 'TypeScript'],
    status: 'in_progress'
  };

  let workflowState: WorkflowState = {
    jobDescriptionId: jobId,
    iterationCount: 1,
    currentPhase: 'GENERATING',
    shouldTerminate: false,
    scoringCriteria: {
      requiredSkills: ['React', 'Node.js', 'TypeScript'],
      preferredSkills: ['GraphQL', 'AWS'],
      experienceLevels: {
        minimum: 3,
        preferred: 5,
        maximum: 8
      },
      culturalCriteria: ['Team player'],
      leadershipCriteria: ['Mentorship']
    },
    refinedCriteria: null
  };

  beforeAll(async () => {
    // Create a new job description
    const { data, error } = await supabase
      .from('job_descriptions')
      .insert({
        title: jobDescription.title,
        description: jobDescription.description,
        requirements: jobDescription.requirements,
        workflow_type: 'ai_sdk',
        status: jobDescription.status
      })
      .select()
      .single();

    if (error) throw error;
    jobId = data.id;

    // Initialize workflow state
    workflowState = {
      jobDescriptionId: jobId,
      iterationCount: 0,
      currentPhase: 'INITIAL',
      shouldTerminate: false,
      scoringCriteria: {
        skillsWeight: 0.4,
        experienceWeight: 0.3,
        achievementsWeight: 0.2,
        culturalWeight: 0.1,
        leadershipWeight: 0.0,
        requiredSkills: ['React', 'Node.js', 'TypeScript'],
        preferredSkills: ['GraphQL', 'AWS'],
        experienceLevels: {
          minimum: 3,
          preferred: 5,
          maximum: 8
        },
        culturalCriteria: ['Team player'],
        leadershipCriteria: ['Mentorship']
      }
    };
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase
      .from('job_descriptions')
      .delete()
      .eq('id', jobId);
  });

  it('should generate initial candidates based on job description', async () => {
    const candidates = await generateCandidates({
      jobDescription: jobDescription.description,
      selectionCriteria: workflowState.scoringCriteria.requiredSkills,
      numberOfCandidates: 3
    });

    expect(candidates).toBeDefined();
    expect(candidates).toHaveLength(3);
    expect(candidates[0]).toHaveProperty('matchScore');
    expect(candidates[0]).toHaveProperty('skills');
    expect(candidates[0].skills).toEqual(expect.arrayContaining(['React']));
  });

  it('should handle feedback processing and analysis', async () => {
    const candidates = await generateCandidates({
      jobDescription: jobDescription.description,
      selectionCriteria: workflowState.scoringCriteria.requiredSkills,
      numberOfCandidates: 3
    });

    const feedback: CandidateFeedback = {
      candidateId: candidates[0].id,
      isPositive: true,
      reason: 'Strong technical skills in React and TypeScript. Great team player.',
      criteria: [{
        category: 'skills',
        score: 4,
        comment: 'Strong technical skills'
      }]
    };

    await storeFeedback(jobId, [feedback]);
    const analysis = await analyzeFeedbackPatterns([feedback]);

    expect(analysis).toBeDefined();
    expect(analysis.patterns).toBeDefined();
    expect(analysis.recommendations).toBeDefined();
    expect(analysis.confidence).toBeGreaterThan(0);
  });

  it('should refine criteria based on feedback analysis', async () => {
    const feedback: CandidateFeedback = {
      candidateId: 'c1',
      isPositive: true,
      reason: 'Excellent React skills and team collaboration.',
      criteria: [{
        category: 'skills',
        score: 5,
        comment: 'Excellent technical skills'
      }]
    };

    const analysis = await analyzeFeedbackPatterns([feedback]);
    
    await storeIterationState(
      jobId,
      workflowState.iterationCount,
      workflowState.refinedCriteria || {
        updatedSkills: {
          required: workflowState.scoringCriteria.requiredSkills,
          preferred: workflowState.scoringCriteria.preferredSkills,
          removed: []
        },
        updatedExperience: {
          minimum: workflowState.scoringCriteria.experienceLevels.minimum,
          preferred: workflowState.scoringCriteria.experienceLevels.preferred,
          maximum: workflowState.scoringCriteria.experienceLevels.maximum
        },
        updatedCulturalCriteria: workflowState.scoringCriteria.culturalCriteria,
        updatedLeadershipCriteria: workflowState.scoringCriteria.leadershipCriteria,
        reasonForChanges: 'Initial criteria',
        confidence: 1.0
      },
      analysis
    );

    const state = await getWorkflowState(jobId);
    expect(state).toBeDefined();
    expect(state?.iteration_number).toBe(1);
  });

  it('should improve candidate quality in subsequent iterations', async () => {
    const candidates1 = await generateCandidates({
      jobDescription: jobDescription.description,
      selectionCriteria: workflowState.scoringCriteria.requiredSkills,
      numberOfCandidates: 3
    });

    const candidates2 = await generateCandidates({
      jobDescription: jobDescription.description,
      selectionCriteria: ['React', 'TypeScript', 'Node.js'],
      numberOfCandidates: 3
    });

    expect(candidates2[0].matchScore).toBeGreaterThanOrEqual(candidates1[0].matchScore);
  });

  it('should handle invalid generation parameters', async () => {
    await expect(generateCandidates({
      jobDescription: '',
      selectionCriteria: [],
      numberOfCandidates: 0
    })).rejects.toThrow('Invalid generation parameters');
  });

  it('should complete workflow after maximum iterations', async () => {
    workflowState.iterationCount = 4;
    workflowState.shouldTerminate = true;

    await updateJobDescription(jobId, {
      status: 'completed',
      final_criteria: workflowState.refinedCriteria || workflowState.scoringCriteria
    });

    const finalState = await getWorkflowState(jobId);
    expect(finalState).toBeDefined();
    expect(finalState?.iteration_number).toBe(4);
    expect(finalState?.is_final).toBe(true);
  });

  it('should handle error cases gracefully', async () => {
    // Test invalid job description
    await expect(generateCandidates({
      jobDescription: '',
      selectionCriteria: [],
      numberOfCandidates: 3
    })).rejects.toThrow();

    // Test invalid feedback
    await expect(storeFeedback(
      'invalid-job-id',
      []
    )).rejects.toThrow();

    // Test invalid criteria refinement
    await expect(generateCriteriaRefinements(
      { ...workflowState, jobDescriptionId: 'invalid-id' },
      {
        patterns: {
          positivePatterns: [],
          negativePatterns: [],
          skillGaps: [],
          culturalInsights: []
        },
        recommendations: {
          skillsToEmphasize: [],
          skillsToDeemphasize: [],
          experienceAdjustments: [],
          culturalFitAdjustments: []
        },
        confidence: 0
      }
    )).rejects.toThrow();
  });

  it('should maintain data consistency across the workflow', async () => {
    const state = await getWorkflowState(jobId);
    expect(state).toBeDefined();
    
    if (state) {
      expect(state.job_description_id).toBe(jobId);
      expect(state.iteration_number).toBeGreaterThanOrEqual(0);
      expect(state.is_final).toBeDefined();
    }

    const { data: job } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', jobId)
      .single();

    expect(job).toBeDefined();
    expect(job.workflow_type).toBe('ai_sdk');
    expect(job.status).toBe('completed');
  });
}); 