import { AI_MODEL } from './config';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { 
  systemPrompts, 
  feedbackAnalysisSchema, 
  criteriaRefinementSchema,
  messageTemplates
} from './schema';
import type { 
  CandidateFeedback, 
  WorkflowState,
  CriteriaRefinement
} from './types';
import { z } from 'zod';

type FeedbackAnalysis = z.infer<typeof feedbackAnalysisSchema>;

export async function analyzeFeedbackPatterns(
  feedback: CandidateFeedback[]
): Promise<FeedbackAnalysis> {
  try {
    // Transform feedback to match the expected format
    const formattedFeedback = feedback.map(f => ({
      ...f,
      timestamp: new Date()
    }));

    const prompt = messageTemplates.feedbackAnalysis.userPrompt(formattedFeedback);

    const result = await generateObject({
      model: openai(AI_MODEL),
      schema: feedbackAnalysisSchema,
      prompt,
      messages: [
        {
          role: 'system',
          content: systemPrompts.feedbackAnalysis.content
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Log any warnings for debugging
    if (result.warnings?.length) {
      console.warn('AI SDK Warnings:', result.warnings);
    }

    return feedbackAnalysisSchema.parse(result.response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error('Failed to analyze feedback: ' + errorMessage);
  }
}

export async function generateCriteriaRefinements(
  currentState: WorkflowState,
  feedbackAnalysis: FeedbackAnalysis
): Promise<CriteriaRefinement> {
  try {
    // Transform the state to match the expected format
    const formattedState = {
      ...currentState,
      scoringCriteria: {
        ...currentState.scoringCriteria,
        requiredSkills: currentState.scoringCriteria.requiredSkills.map(skill => ({
          skill: typeof skill === 'string' ? skill : skill.skill,
          weight: typeof skill === 'string' ? 3 : skill.weight
        })),
        preferredSkills: currentState.scoringCriteria.preferredSkills.map(skill => ({
          skill: typeof skill === 'string' ? skill : skill.skill,
          weight: typeof skill === 'string' ? 2 : skill.weight
        })),
        culturalCriteria: currentState.scoringCriteria.culturalCriteria.map(attr => ({
          attribute: typeof attr === 'string' ? attr : attr.attribute,
          weight: typeof attr === 'string' ? 3 : attr.weight
        })),
        leadershipCriteria: currentState.scoringCriteria.leadershipCriteria.map(attr => ({
          attribute: typeof attr === 'string' ? attr : attr.attribute,
          weight: typeof attr === 'string' ? 3 : attr.weight
        }))
      }
    };

    const prompt = messageTemplates.criteriaRefinement.userPrompt(formattedState, feedbackAnalysis);

    const result = await generateObject({
      model: openai(AI_MODEL),
      schema: criteriaRefinementSchema,
      prompt,
      messages: [
        {
          role: 'system',
          content: systemPrompts.feedbackAnalysis.content
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Log any warnings for debugging
    if (result.warnings?.length) {
      console.warn('AI SDK Warnings:', result.warnings);
    }

    return criteriaRefinementSchema.parse(result.response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error('Failed to generate criteria refinements: ' + errorMessage);
  }
}

export function calculateFeedbackImpact(
  feedback: CandidateFeedback[],
  analysis: FeedbackAnalysis
): Record<string, number> {
  const impacts: Record<string, number> = {
    skillsImpact: 0,
    experienceImpact: 0,
    culturalImpact: 0,
    overallConfidence: 0
  };

  // Calculate impact scores based on feedback patterns and analysis
  const totalFeedback = feedback.length;
  const positiveFeedback = feedback.filter(f => f.isPositive).length;
  const feedbackWithCriteria = feedback.filter(f => f.criteria?.length).length;

  impacts.skillsImpact = analysis.recommendations.skillsToEmphasize.length * 0.2;
  impacts.experienceImpact = (feedbackWithCriteria / totalFeedback) * 0.3;
  impacts.culturalImpact = analysis.patterns.culturalInsights.length * 0.25;
  impacts.overallConfidence = analysis.confidence;

  return impacts;
}

export function shouldRefineBasedOnFeedback(
  feedback: CandidateFeedback[],
  analysis: FeedbackAnalysis
): boolean {
  const impacts = calculateFeedbackImpact(feedback, analysis);
  
  // Determine if the feedback provides enough signal for refinement
  const significantImpact = Object.values(impacts).some(impact => impact > 0.3);
  const sufficientFeedback = feedback.length >= 3;
  const highConfidence = analysis.confidence > 0.7;

  return significantImpact && sufficientFeedback && highConfidence;
} 