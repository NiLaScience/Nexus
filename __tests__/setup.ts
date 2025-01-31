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

// Types for AI messages and responses
type AIMessageType = 'generate' | 'analyze' | 'refine';

interface AIMessage {
  type: AIMessageType;
  payload: Record<string, unknown>;
}

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

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: class OpenAI {
      constructor() {}
      chat = {
        completions: {
          create: vi.fn().mockImplementation(({ messages }) => {
            if (!messages?.length) {
              return Promise.reject(new Error('Invalid messages'));
            }

            const userMessage = messages.find((m: { role: string; content: string }) => m.role === 'user')?.content || '';
            
            try {
              // First try to parse as JSON to check for generation request
              try {
                const payload = JSON.parse(userMessage);
                if (payload.jobDescription !== undefined) {  // This is a generation request
                  if (!payload.selectionCriteria?.length || 
                      !payload.numberOfCandidates || 
                      !payload.jobDescription) {
                    return Promise.reject(new Error('Invalid generation parameters'));
                  }
                  return Promise.resolve({
                    choices: [{
                      message: {
                        content: JSON.stringify(this.generateResponse('generate', payload))
                      }
                    }]
                  });
                }
              } catch (e) {
                // Not JSON or not a generation request, continue with message type detection
              }

              const messageType = this.getMessageType(userMessage);
              const payload = this.validateAndParsePayload(userMessage, messageType);
              
              return Promise.resolve({
                choices: [{
                  message: {
                    content: JSON.stringify(this.generateResponse(messageType, payload))
                  }
                }]
              });
            } catch (error) {
              return Promise.reject(error);
            }
          })
        }
      };

      private getMessageType(message: string): AIMessageType {
        if (message.includes('Analyze the following candidate feedback')) return 'analyze';
        if (message.includes('refined criteria') || message.includes('Generate refined criteria')) return 'refine';
        throw new Error('Unknown message type');
      }

      private validateAndParsePayload(message: string, type: AIMessageType): Record<string, unknown> {
        try {
          const payload = JSON.parse(message);
          
          if (type === 'generate') {
            if (!payload.selectionCriteria?.length || !payload.numberOfCandidates || !payload.jobDescription) {
              throw new Error('Invalid generation parameters');
            }
          }
          
          return payload;
        } catch {
          // If JSON.parse fails, return the raw message as payload
          return { content: message };
        }
      }

      private generateResponse(type: AIMessageType, payload: Record<string, unknown>) {
        switch (type) {
          case 'generate':
            return {
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
              ] as Candidate[]
            };
          
          case 'analyze':
            return {
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
            } as FeedbackAnalysis;
          
          case 'refine':
            return {
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
            } as RefinedCriteria;
          
          default:
            throw new Error('Unhandled message type');
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
      status: 'in_progress'
    },
    workflow: {
      job_description_id: '123e4567-e89b-12d3-a456-426614174000',
      iteration_number: 1,
      is_final: false
    }
  };

  return {
    createClient: () => ({
      from: (table: string) => ({
        insert: () => ({
          select: () => ({
            single: () => {
              if (table === 'candidate_feedback') {
                return Promise.resolve({ data: null, error: null });
              }
              return Promise.resolve({ data: mockData.job, error: null });
            }
          })
        }),
        delete: () => ({
          eq: (column: string, value: string) => {
            if (value.includes('invalid')) {
              return Promise.reject(new Error('Record not found'));
            }
            return Promise.resolve({ data: null, error: null });
          }
        }),
        select: () => ({
          eq: (column: string, value: string) => {
            if (value.includes('invalid')) {
              return {
                single: () => Promise.reject(new Error('Record not found')),
                order: () => ({ 
                  limit: () => ({ 
                    single: () => Promise.reject(new Error('Record not found'))
                  })
                })
              };
            }

            // Update iteration number when getting workflow state
            if (mockData.job.status === 'completed') {
              mockData.workflow.iteration_number = 4;
            }

            return {
              single: () => Promise.resolve({ data: mockData.job, error: null }),
              order: () => ({
                limit: () => ({
                  single: () => Promise.resolve({ data: mockData.workflow, error: null })
                })
              })
            };
          }
        }),
        update: () => ({
          eq: (column: string, value: string) => {
            if (value.includes('invalid')) {
              return Promise.reject(new Error('Record not found'));
            }
            if (value === mockData.job.id) {
              mockData.job.status = 'completed';
              mockData.workflow.is_final = true;
              mockData.workflow.iteration_number = 4;
            }
            return Promise.resolve({ data: null, error: null });
          }
        })
      })
    })
  };
}); 