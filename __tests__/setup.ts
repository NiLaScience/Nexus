import { vi } from 'vitest';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ENABLE_AI_SDK = 'true';

// Mock fetch
global.fetch = vi.fn();

// Mock URL
global.URL = URL;

// Mock ai/edge module
vi.mock('ai/edge', () => ({
  StreamingTextResponse: vi.fn().mockImplementation((stream) => {
    return new Response(stream);
  })
}));

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: class OpenAI {
      constructor() {}
      chat = {
        completions: {
          create: vi.fn().mockImplementation(({ messages }) => {
            // Check for error conditions
            if (!messages || messages.length === 0) {
              throw new Error('Invalid messages');
            }

            const userMessage = messages.find((m: { role: string; content: string }) => m.role === 'user')?.content || '';
            
            // Handle error cases
            if (userMessage.includes('empty') || userMessage.length === 0) {
              throw new Error('Invalid input');
            }

            // Handle feedback analysis
            if (userMessage.includes('Analyze this candidate feedback')) {
              return Promise.resolve({
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
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
                      })
                    }
                  }
                ]
              });
            }

            // Handle candidate generation
            if (userMessage.includes('Generate')) {
              // Check for invalid criteria
              if (userMessage.includes('selectionCriteria: []') || userMessage.includes('numberOfCandidates: 0')) {
                throw new Error('Invalid generation parameters');
              }

              return Promise.resolve({
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        candidates: [
                          {
                            id: 'c1',
                            name: 'John Doe',
                            skills: ['React', 'TypeScript', 'Node.js'],
                            experience: '5 years of full-stack development',
                            matchScore: 85,
                            reasoning: 'Strong technical match with required skills'
                          },
                          {
                            id: 'c2',
                            name: 'Jane Smith',
                            skills: ['React', 'GraphQL', 'AWS'],
                            experience: '7 years of frontend development',
                            matchScore: 90,
                            reasoning: 'Excellent frontend expertise'
                          },
                          {
                            id: 'c3',
                            name: 'Bob Wilson',
                            skills: ['TypeScript', 'Next.js', 'TailwindCSS'],
                            experience: '4 years of React development',
                            matchScore: 75,
                            reasoning: 'Good technical foundation'
                          }
                        ]
                      })
                    }
                  }
                ]
              });
            }

            throw new Error('Unhandled message type');
          })
        }
      }
    }
  };
});

// Mock Supabase
vi.mock('@supabase/supabase-js', () => {
  const mockData = {
    job: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      workflow_type: 'ai_sdk',
      status: 'completed'
    },
    workflow: {
      job_description_id: '123e4567-e89b-12d3-a456-426614174000',
      iteration_number: 4,
      is_final: true
    }
  };

  return {
    createClient: () => ({
      from: (table: string) => ({
        insert: () => ({
          select: () => ({
            single: () => ({
              data: mockData.job,
              error: null
            })
          })
        }),
        delete: () => ({
          eq: () => ({
            data: null,
            error: null
          })
        }),
        select: () => ({
          eq: (column: string, value: string) => {
            // Simulate database errors for invalid IDs
            if (value.includes('invalid')) {
              return {
                single: () => ({ data: null, error: new Error('Record not found') }),
                order: () => ({ limit: () => ({ single: () => ({ data: null, error: new Error('Record not found') }) }) })
              };
            }

            return {
              single: () => ({ data: mockData.job, error: null }),
              order: () => ({
                limit: () => ({
                  single: () => ({ data: mockData.workflow, error: null })
                })
              })
            };
          }
        }),
        update: () => ({
          eq: () => ({
            data: null,
            error: null
          })
        })
      })
    })
  };
}); 