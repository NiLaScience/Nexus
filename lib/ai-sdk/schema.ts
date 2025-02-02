import { z } from 'zod';
import { messageTemplates } from './templates';

// Zod schemas for validation
export const candidateProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  background: z.string(),
  skills: z.array(z.string()),
  yearsOfExperience: z.number(),
  matchScore: z.number().min(0).max(100),
  reasonForMatch: z.string(),
  achievements: z.array(z.string()),
  scoringDetails: z.object({
    skillsScore: z.number(),
    experienceScore: z.number(),
    achievementsScore: z.number(),
    culturalScore: z.number(),
    leadershipScore: z.number().optional(),
    scoreBreakdown: z.string()
  }).optional()
});

export const candidatesResponseSchema = z.object({
  candidates: z.array(candidateProfileSchema)
});

export const baseJobDescriptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  requirements: z.array(z.string()),
  parsed_content: z.string()
});

export const baseCandidateSchema = z.object({
  name: z.string(),
  background: z.string(),
  skills: z.array(z.string()),
  yearsOfExperience: z.number(),
  matchScore: z.number().min(0).max(100),
  reasonForMatch: z.string(),
  achievements: z.array(z.string()),
  scoringDetails: z.object({
    skillsScore: z.number(),
    experienceScore: z.number(),
    achievementsScore: z.number(),
    culturalScore: z.number(),
    leadershipScore: z.number().optional(),
    scoreBreakdown: z.string()
  }).optional()
});

export const baseFeedbackSchema = z.object({
  candidateId: z.string(),
  isPositive: z.boolean(),
  reason: z.string().optional()
});

export { messageTemplates };
 