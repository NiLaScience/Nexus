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
vi.mock('@/lib/ai-sdk/candidate-generation');
vi.mock('@/lib/ai-sdk/workflow');

// Import after mocks
import { POST } from '@/app/api/ai-sdk/candidates/generate/route';
import { 
  getJobDescription, 
  getWorkflowState, 
  storeGeneratedCandidates 
} from '@/lib/ai-sdk/database';
import { generateCandidates } from '@/lib/ai-sdk/candidate-generation';
import { initializeWorkflow } from '@/lib/ai-sdk/workflow';

describe('/api/ai-sdk/candidates/generate', () => {
  const mockJobId = '123e4567-e89b-12d3-a456-426614174000';
  
  const mockJobDescription = {
    id: mockJobId,
    title: 'Senior Engineer',
    parsed_content: {
      title: 'Senior Engineer',
      description: 'Looking for a senior engineer...',
      requirements: ['React', 'Node.js'],
      responsibilities: ['Lead team', 'Build features'],
      employmentType: 'FULL_TIME',
      experienceLevel: 'SENIOR',
      remote: true
    }
  };

  const mockWorkflowState = {
    jobDescriptionId: mockJobId,
    iterationCount: 0,
    currentPhase: 'INITIAL',
    shouldTerminate: false,
    scoringCriteria: {
      requiredSkills: ['React'],
      preferredSkills: ['GraphQL'],
      minimumYearsExperience: 5
    }
  };

  const mockCandidates = [
    {
      id: '1',
      name: 'John Doe',
      skills: ['React', 'Node.js'],
      experience: { years: 7, summary: 'Senior dev', highlights: [] },
      matchScore: 85
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (getJobDescription as any).mockResolvedValue(mockJobDescription);
    (getWorkflowState as any).mockResolvedValue(mockWorkflowState);
    (generateCandidates as any).mockResolvedValue(mockCandidates);
    (initializeWorkflow as any).mockResolvedValue(mockWorkflowState);
    (storeGeneratedCandidates as any).mockResolvedValue(undefined);
  });

  it('should generate candidates successfully', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/ai-sdk/candidates/generate'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescriptionId: mockJobId })
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      candidates: mockCandidates,
      state: expect.objectContaining({
        currentPhase: 'EVALUATING'
      })
    });

    expect(getJobDescription).toHaveBeenCalledWith(mockJobId);
    expect(generateCandidates).toHaveBeenCalledWith(expect.objectContaining({
      jobDescription: mockJobDescription.parsed_content,
      numberOfCandidates: 5
    }));
    expect(storeGeneratedCandidates).toHaveBeenCalledWith(
      mockJobId,
      mockCandidates,
      0,
      false
    );
  });

  it('should return 404 if job description not found', async () => {
    (getJobDescription as any).mockResolvedValue(null);

    const request = new NextRequest(
      new URL('http://localhost:3000/api/ai-sdk/candidates/generate'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescriptionId: mockJobId })
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Job description not found' });
  });

  it('should initialize workflow state if none exists', async () => {
    (getWorkflowState as any).mockResolvedValue(null);

    const request = new NextRequest(
      new URL('http://localhost:3000/api/ai-sdk/candidates/generate'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescriptionId: mockJobId })
      }
    );

    await POST(request);

    expect(initializeWorkflow).toHaveBeenCalledWith(mockJobId);
  });

  it('should handle validation errors', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/ai-sdk/candidates/generate'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescriptionId: 'invalid-uuid' })
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request format');
  });

  it('should generate more candidates in final iteration', async () => {
    const finalState = {
      ...mockWorkflowState,
      iterationCount: 4
    };
    (getWorkflowState as any).mockResolvedValue(finalState);

    const request = new NextRequest(
      new URL('http://localhost:3000/api/ai-sdk/candidates/generate'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescriptionId: mockJobId })
      }
    );

    await POST(request);

    expect(generateCandidates).toHaveBeenCalledWith(expect.objectContaining({
      numberOfCandidates: 10
    }));
    expect(storeGeneratedCandidates).toHaveBeenCalledWith(
      mockJobId,
      mockCandidates,
      4,
      true
    );
  });
}); 