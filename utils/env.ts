import { z } from 'zod';

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Database
  DATABASE_URL: z.string().optional(),
  
  // Deployment
  VERCEL_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate and get all environment variables
 */
export function getEnvVars(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map(err => err.path.join('.'))
        .join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return getEnvVars().NODE_ENV === 'development';
}

/**
 * Get Supabase configuration
 */
export function getSupabaseConfig() {
  const env = getEnvVars();
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * Get deployment URL
 */
export function getDeploymentUrl(): string {
  const env = getEnvVars();
  return env.VERCEL_URL ? `https://${env.VERCEL_URL}` : 'http://localhost:3000';
}

// Initialize environment variables on startup
getEnvVars(); 