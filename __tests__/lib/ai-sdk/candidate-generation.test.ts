import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCandidates } from '@/lib/ai-sdk/candidate-generation';
import { openai } from '@/lib/ai-sdk/config';
import type { JobDescription, SelectionCriteria } from '@/lib/ai-sdk/types';

// Mock OpenAI
vi.mock('@/lib/ai-sdk/config', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  },
  AI_MODEL: 'gpt-4'
}));

describe('generateCandidates', () => {
  const mockJobDescription: JobDescription = {
    title: 'Senior Software Engineer',
    description: 'We are looking for a senior software engineer...',
    requirements: ['5+ years experience', 'React', 'Node.js'],
    responsibilities: ['Lead development team', 'Architect solutions'],
    employmentType: 'FULL_TIME',
    experienceLevel: 'SENIOR',
    remote: false
  };

  const mockSelectionCriteria = [
    'Required Skills: React, Node.js, TypeScript',
    'Preferred Skills: GraphQL, AWS',
    'Minimum Experience: 5 years'
  ];

  const mockCandidateResponse = {
    candidates: [
      {
        id: '1',
        name: 'John Doe',
        skills: ['React', 'Node.js', 'TypeScript'],
        experience: {
          years: 7,
          summary: 'Senior developer with focus on React',
          highlights: ['Led team of 5', 'Rebuilt core platform']
        },
        matchScore: 85,
        reasoning: 'Strong technical background with leadership experience'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (openai.chat.completions.create as any).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(mockCandidateResponse)
          }
        }
      ]
    });
  });

  it('should generate candidates based on job description and criteria', async () => {
    const result = await generateCandidates({
      jobDescription: mockJobDescription,
      selectionCriteria: mockSelectionCriteria,
      numberOfCandidates: 1,
      feedback: []
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: expect.any(String),
      skills: expect.arrayContaining(['React', 'Node.js']),
      experience: expect.objectContaining({
        years: expect.any(Number)
      }),
      matchScore: expect.any(Number)
    });
  });

  it('should handle API errors gracefully', async () => {
    (openai.chat.completions.create as any).mockRejectedValue(
      new Error('API Error')
    );

    await expect(generateCandidates({
      jobDescription: mockJobDescription,
      selectionCriteria: mockSelectionCriteria,
      numberOfCandidates: 1,
      feedback: []
    })).rejects.toThrow('Failed to generate candidates');
  });

  it('should include feedback in prompt when provided', async () => {
    const feedback = [
      {
        candidateId: '1',
        isPositive: true,
        reason: 'Strong technical skills'
      }
    ];

    await generateCandidates({
      jobDescription: mockJobDescription,
      selectionCriteria: mockSelectionCriteria,
      numberOfCandidates: 1,
      feedback
    });

    expect(openai.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('Strong technical skills')
          })
        ])
      })
    );
  });
}); 