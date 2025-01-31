import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock ai/edge module
vi.mock('ai/edge', () => ({
  StreamingTextResponse: vi.fn().mockImplementation((stream) => {
    return new Response(stream);
  })
}));

// Mock dependencies
vi.mock('@/lib/ai-sdk/database');
vi.mock('@/lib/ai-sdk/feedback-processor');

// Import after mocks
import { POST } from '@/app/api/ai-sdk/feedback/process/route';
import { 
  storeFeedback,
  storeIterationState,
  updateJobDescription 
} from '@/lib/ai-sdk/database';
import { 
  analyzeFeedbackPatterns,
  generateCriteriaRefinements,
  shouldRefineBasedOnFeedback 
} from '@/lib/ai-sdk/feedback-processor';

describe('/api/ai-sdk/feedback/process', () => {
  const mockJobId = '123e4567-e89b-12d3-a456-426614174000';
  
  const mockWorkflowState = {
    jobDescriptionId: mockJobId,
    iterationCount: 1,
    currentPhase: 'WAITING_FEEDBACK',
    shouldTerminate: false,
    scoringCriteria: {
      requiredSkills: ['React'],
      preferredSkills: ['GraphQL'],
      minimumYearsExperience: 5
    }
  };

  const mockFeedback = [
    {
      candidateId: '1',
      isPositive: true,
      reason: 'Strong technical skills',
      criteria: [
        { category: 'skills', score: 4, comment: 'Good React knowledge' }
      ]
    }
  ];

  const mockFeedbackAnalysis = {
    patterns: {
      positivePatterns: ['Strong technical background'],
      negativePatterns: [],
      skillGaps: [],
      culturalInsights: []
    },
    recommendations: {
      skillsToEmphasize: ['React'],
      skillsToDeemphasize: [],
      experienceAdjustments: [],
      culturalFitAdjustments: []
    },
    confidence: 0.8
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (analyzeFeedbackPatterns as any).mockResolvedValue(mockFeedbackAnalysis);
    (shouldRefineBasedOnFeedback as any).mockResolvedValue(true);
    (generateCriteriaRefinements as any).mockResolvedValue({
      refinedCriteria: {
        requiredSkills: [{ skill: 'React', importance: 5, reason: 'Consistently valued' }]
      },
      explanation: 'Refined based on positive feedback'
    });
    (storeFeedback as any).mockResolvedValue(undefined);
    (storeIterationState as any).mockResolvedValue(undefined);
    (updateJobDescription as any).mockResolvedValue(undefined);
  });

  it('should process feedback successfully', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/ai-sdk/feedback/process'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowState: mockWorkflowState,
          feedback: mockFeedback
        })
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(expect.objectContaining({
      state: expect.objectContaining({
        currentPhase: 'GENERATING'
      })
    }));

    expect(storeFeedback).toHaveBeenCalledWith(mockJobId, mockFeedback);
    expect(analyzeFeedbackPatterns).toHaveBeenCalledWith(mockFeedback);
    expect(storeIterationState).toHaveBeenCalled();
  });

  it('should handle final iteration', async () => {
    const finalState = {
      ...mockWorkflowState,
      iterationCount: 4
    };

    const request = new NextRequest(
      new URL('http://localhost:3000/api/ai-sdk/feedback/process'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowState: finalState,
          feedback: mockFeedback
        })
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.state.shouldTerminate).toBe(true);
    expect(updateJobDescription).toHaveBeenCalledWith(
      mockJobId,
      expect.objectContaining({
        status: 'completed'
      })
    );
  });

  it('should handle validation errors', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/ai-sdk/feedback/process'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowState: {},
          feedback: 'invalid'
        })
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request format');
  });

  it('should skip criteria refinement if not needed', async () => {
    (shouldRefineBasedOnFeedback as any).mockResolvedValue(false);

    const request = new NextRequest(
      new URL('http://localhost:3000/api/ai-sdk/feedback/process'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowState: mockWorkflowState,
          feedback: mockFeedback
        })
      }
    );

    await POST(request);

    expect(generateCriteriaRefinements).not.toHaveBeenCalled();
  });
}); 