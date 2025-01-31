import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { generateCandidates } from '@/lib/ai-sdk/candidate-generation';
import { 
  analyzeFeedbackPatterns,
  generateCriteriaRefinements,
  shouldRefineBasedOnFeedback 
} from '@/lib/ai-sdk/feedback-processor';
import { 
  storeFeedback,
  storeIterationState,
  updateJobDescription,
  getWorkflowState 
} from '@/lib/ai-sdk/database';
import type { WorkflowState, CandidateFeedback } from '@/lib/ai-sdk/types';

describe('AI SDK E2E Workflow', () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const jobDescription = {
    title: 'Senior Frontend Developer',
    description: `We're looking for a Senior Frontend Developer with expertise in React, TypeScript, and modern web technologies.
    The ideal candidate will have strong experience with component design, state management, and performance optimization.`,
    requirements: [
      'Expert in React and TypeScript',
      'Experience with Next.js',
      'Strong understanding of web performance',
      'Team leadership experience'
    ]
  };

  let jobId: string;
  let workflowState: WorkflowState;

  beforeAll(async () => {
    // Create a new job description
    const { data, error } = await supabase
      .from('job_descriptions')
      .insert({
        title: jobDescription.title,
        description: jobDescription.description,
        requirements: jobDescription.requirements,
        workflow_type: 'ai_sdk',
        status: 'active'
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
        requiredSkills: ['React', 'TypeScript', 'Next.js'],
        preferredSkills: ['GraphQL', 'Redux'],
        experienceLevels: {
          minimum: 5,
          preferred: 7,
          maximum: 12,
          yearsWeight: 0.6
        },
        culturalCriteria: ['Team player', 'Mentor'],
        leadershipCriteria: ['Technical leadership', 'Team management']
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

  it('should complete a full workflow cycle with multiple iterations', async () => {
    // Iteration 1: Initial Candidate Generation
    const candidates1 = await generateCandidates({
      jobDescription: jobDescription.description,
      selectionCriteria: workflowState.scoringCriteria.requiredSkills,
      numberOfCandidates: 3
    });

    expect(candidates1).toHaveLength(3);
    expect(candidates1[0]).toHaveProperty('matchScore');
    expect(candidates1[0].skills).toEqual(
      expect.arrayContaining(['React', 'TypeScript'])
    );

    // Process feedback for first batch
    const feedback1: CandidateFeedback[] = candidates1.map(c => ({
      candidateId: c.id,
      isPositive: c.matchScore > 80,
      reason: c.matchScore > 80 ? 'Strong technical fit' : 'Missing key skills',
      criteria: [
        {
          category: 'skills',
          score: c.matchScore > 80 ? 4 : 2,
          comment: 'Technical skills evaluation'
        }
      ]
    }));

    await storeFeedback(jobId, feedback1);
    const analysis1 = await analyzeFeedbackPatterns(feedback1);
    
    expect(analysis1).toHaveProperty('patterns');
    expect(analysis1).toHaveProperty('recommendations');

    // Refine criteria based on feedback
    const shouldRefine1 = await shouldRefineBasedOnFeedback(feedback1, analysis1);
    expect(shouldRefine1).toBeDefined();

    if (shouldRefine1) {
      const refinements1 = await generateCriteriaRefinements(workflowState, analysis1);
      workflowState = {
        ...workflowState,
        refinedCriteria: refinements1,
        currentPhase: 'GENERATING',
        iterationCount: 1
      };

      expect(refinements1).toHaveProperty('updatedSkills');
      expect(refinements1.updatedSkills.required).toEqual(
        expect.arrayContaining(['React', 'TypeScript'])
      );
    }

    // Store iteration state
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
      analysis1
    );

    // Iteration 2: Refined Candidate Generation
    const candidates2 = await generateCandidates({
      jobDescription: jobDescription.description,
      selectionCriteria: workflowState.refinedCriteria?.updatedSkills.required || 
                        workflowState.scoringCriteria.requiredSkills,
      numberOfCandidates: 3
    });

    expect(candidates2).toHaveLength(3);
    expect(candidates2[0].matchScore).toBeGreaterThan(candidates1[0].matchScore);

    // Verify workflow completion
    workflowState.iterationCount = 4;
    workflowState.shouldTerminate = true;

    await updateJobDescription(jobId, {
      status: 'completed',
      final_criteria: workflowState.refinedCriteria || workflowState.scoringCriteria
    });

    const finalState = await getWorkflowState(jobId);
    expect(finalState).toBeDefined();
    expect(finalState?.iteration_number).toBe(4);
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