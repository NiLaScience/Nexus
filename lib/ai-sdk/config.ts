import { openai } from '@ai-sdk/openai';

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing required environment variable: OPENAI_API_KEY');
}

// Create AI SDK provider instance
export const aiProvider = openai;

// Model configuration
export const AI_MODEL = 'gpt-4-0125-preview';
export const MAX_TOKENS = 4096;
export const TEMPERATURE = 0.7;

// Feature flags
export const AI_SDK_ENABLED = process.env.ENABLE_AI_SDK === 'true';

export { openai }; 