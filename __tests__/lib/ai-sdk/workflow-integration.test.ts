import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Mock dependencies
vi.mock('@/lib/ai-sdk/database');
vi.mock('@/lib/ai-sdk/feedback-processor');
vi.mock('@/lib/ai-sdk/candidate-generation');

describe('AI SDK Workflow Integration', () => {
  const mockJobId = '123e4567-e89b-12d3-a456-426614174000';
  
  const initialState: WorkflowState = {
    jobDescriptionId: mockJobId,
    iterationCount: 0,
    currentPhase: 'INITIAL',
    shouldTerminate: false,
    scoringCriteria: {
      skillsWeight: 0.4,
      experienceWeight: 0.3,
      achievementsWeight: 0.2,
      culturalWeight: 0.1,
      leadershipWeight: 0.0,
      requiredSkills: ['React', 'TypeScript'],
      preferredSkills: ['GraphQL'],
      experienceLevels: {
        minimum: 3,
        preferred: 5,
        maximum: 8,
        yearsWeight: 0.6
      },
      culturalCriteria: ['Team player', 'Self-motivated'],
      leadershipCriteria: []
    }
  };

  const mockCandidates = [
    {
      id: 'c1',
      name: 'John Doe',
      skills: ['React', 'TypeScript', 'Node.js'],
      experience: '5 years of full-stack development',
      matchScore: 85,
      reasoning: 'Strong technical match with required skills'
    }
  ];

  const mockFeedback: CandidateFeedback[] = [
    {
      candidateId: 'c1',
      isPositive: true,
      reason: 'Strong technical background',
      criteria: [
        { category: 'skills', score: 4, comment: 'Excellent React knowledge' },
        { category: 'experience', score: 4, comment: 'Good experience level' }
      ]
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (generateCandidates as any).mockResolvedValue(mockCandidates);
    (analyzeFeedbackPatterns as any).mockResolvedValue({
      patterns: {
        positivePatterns: ['Strong technical skills'],
        negativePatterns: [],
        skillGaps: [],
        culturalInsights: ['Values teamwork']
      },
      recommendations: {
        skillsToEmphasize: ['React'],
        skillsToDeemphasize: [],
        experienceAdjustments: ['Maintain current level'],
        culturalFitAdjustments: ['Emphasize collaboration']
      },
      confidence: 0.85
    });
    (shouldRefineBasedOnFeedback as any).mockResolvedValue(true);
    (generateCriteriaRefinements as any).mockResolvedValue({
      updatedSkills: {
        required: ['React', 'TypeScript'],
        preferred: ['GraphQL', 'Node.js'],
        removed: []
      },
      updatedExperience: {
        minimum: 3,
        preferred: 5,
        maximum: 8
      },
      updatedCulturalCriteria: ['Team player', 'Self-motivated', 'Collaborative'],
      updatedLeadershipCriteria: [],
      reasonForChanges: 'Refined based on positive feedback patterns',
      confidence: 0.9
    });
  });

  describe('State Transitions', () => {
    it('should transition through all phases in a complete iteration', async () => {
      // Initial → Generating
      let state = { ...initialState };
      expect(state.currentPhase).toBe('INITIAL');
      
      const candidates = await generateCandidates({
        jobDescription: 'Senior Frontend Developer',
        selectionCriteria: state.scoringCriteria.requiredSkills,
        numberOfCandidates: 3
      });
      
      state = {
        ...state,
        currentPhase: 'GENERATING',
        iterationCount: state.iterationCount + 1
      };
      expect(state.currentPhase).toBe('GENERATING');
      expect(candidates).toEqual(mockCandidates);

      // Generating → Evaluating
      state = {
        ...state,
        currentPhase: 'EVALUATING'
      };
      expect(state.currentPhase).toBe('EVALUATING');

      // Evaluating → Refining
      const analysis = await analyzeFeedbackPatterns(mockFeedback);
      const shouldRefine = await shouldRefineBasedOnFeedback(mockFeedback, analysis);
      expect(shouldRefine).toBe(true);

      if (shouldRefine) {
        const refinements = await generateCriteriaRefinements(state, analysis);
        state = {
          ...state,
          currentPhase: 'REFINING',
          refinedCriteria: refinements
        };
      }
      expect(state.currentPhase).toBe('REFINING');
      expect(state.refinedCriteria).toBeDefined();
    });

    it('should handle early termination conditions', async () => {
      const state = { ...initialState, iterationCount: 4 };
      const analysis = await analyzeFeedbackPatterns(mockFeedback);
      
      await updateJobDescription(state.jobDescriptionId, {
        status: 'completed',
        final_criteria: state.scoringCriteria
      });

      expect(updateJobDescription).toHaveBeenCalledWith(
        state.jobDescriptionId,
        expect.objectContaining({
          status: 'completed'
        })
      );
    });
  });

  describe('Full Workflow Integration', () => {
    it('should complete a full iteration with feedback and refinement', async () => {
      // Step 1: Generate initial candidates
      const candidates = await generateCandidates({
        jobDescription: 'Senior Frontend Developer',
        selectionCriteria: initialState.scoringCriteria.requiredSkills,
        numberOfCandidates: 3
      });
      expect(candidates).toHaveLength(1);

      // Step 2: Process feedback
      await storeFeedback(initialState.jobDescriptionId, mockFeedback);
      const analysis = await analyzeFeedbackPatterns(mockFeedback);
      
      // Step 3: Refine criteria
      const shouldRefine = await shouldRefineBasedOnFeedback(mockFeedback, analysis);
      expect(shouldRefine).toBe(true);

      const refinements = await generateCriteriaRefinements(initialState, analysis);
      expect(refinements.updatedSkills.required).toContain('React');

      // Step 4: Update state
      const updatedState = {
        ...initialState,
        refinedCriteria: refinements,
        currentPhase: 'GENERATING',
        iterationCount: initialState.iterationCount + 1
      };

      await storeIterationState(
        updatedState.jobDescriptionId,
        updatedState.iterationCount,
        updatedState.refinedCriteria,
        analysis
      );

      // Verify the complete workflow
      expect(generateCandidates).toHaveBeenCalled();
      expect(analyzeFeedbackPatterns).toHaveBeenCalled();
      expect(generateCriteriaRefinements).toHaveBeenCalled();
      expect(storeIterationState).toHaveBeenCalled();
    });

    it('should maintain data consistency across iterations', async () => {
      // First iteration
      let state = { ...initialState };
      const candidates1 = await generateCandidates({
        jobDescription: 'Senior Frontend Developer',
        selectionCriteria: state.scoringCriteria.requiredSkills,
        numberOfCandidates: 3
      });

      const analysis1 = await analyzeFeedbackPatterns(mockFeedback);
      const refinements1 = await generateCriteriaRefinements(state, analysis1);
      
      state = {
        ...state,
        refinedCriteria: refinements1,
        iterationCount: 1
      };

      await storeIterationState(
        state.jobDescriptionId,
        state.iterationCount,
        state.refinedCriteria || {
          updatedSkills: {
            required: state.scoringCriteria.requiredSkills,
            preferred: state.scoringCriteria.preferredSkills,
            removed: []
          },
          updatedExperience: {
            minimum: state.scoringCriteria.experienceLevels.minimum,
            preferred: state.scoringCriteria.experienceLevels.preferred,
            maximum: state.scoringCriteria.experienceLevels.maximum
          },
          updatedCulturalCriteria: state.scoringCriteria.culturalCriteria,
          updatedLeadershipCriteria: state.scoringCriteria.leadershipCriteria,
          reasonForChanges: 'Initial criteria',
          confidence: 1.0
        },
        analysis1
      );

      // Second iteration
      if (!state.refinedCriteria) {
        throw new Error('Refinements should be defined at this point');
      }

      const candidates2 = await generateCandidates({
        jobDescription: 'Senior Frontend Developer',
        selectionCriteria: state.refinedCriteria.updatedSkills.required,
        numberOfCandidates: 3
      });

      // Verify data consistency
      expect(candidates2[0].skills).toEqual(expect.arrayContaining(state.refinedCriteria.updatedSkills.required));
      expect(state.iterationCount).toBe(1);
      expect(state.refinedCriteria).toBeDefined();
    });
  });
}); 