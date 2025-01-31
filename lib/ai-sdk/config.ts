import OpenAI from 'openai';

// Validate environment variables
const requiredEnvVars = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ENABLE_AI_SDK: process.env.ENABLE_AI_SDK,
};

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configuration
export const AI_MODEL = 'gpt-4-0125-preview';
export const MAX_TOKENS = 4096;
export const TEMPERATURE = 0.7;

// Feature flags
export const AI_SDK_ENABLED = process.env.ENABLE_AI_SDK === 'true';

export { openai }; 