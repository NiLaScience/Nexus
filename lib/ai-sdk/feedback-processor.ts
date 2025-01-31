// /lib/ai-sdk/feedback-processor.ts

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

/**
 * Analyzes candidate feedback and extracts feedback patterns.
 */
export async function analyzeFeedbackPatterns(
  feedback: CandidateFeedback[]
): Promise<FeedbackAnalysis> {
  try {
    // Format feedback for analysis
    const formattedFeedback = feedback.map(f => ({
      ...f,
      timestamp: new Date()
    }));

    console.log('Analyzing feedback patterns for:', formattedFeedback);

    const result = await generateObject({
      model: openai(AI_MODEL),
      schema: feedbackAnalysisSchema,
      messages: [
        systemPrompts.feedbackAnalysis,
        {
          role: 'user',
          content: messageTemplates.feedbackAnalysis.userPrompt(formattedFeedback)
        }
      ]
    });

    if (!result.object) {
      console.error('Missing result.object in feedback analysis');
      throw new Error('Failed to analyze feedback patterns');
    }

    console.log('Feedback analysis result:', result.object);
    return result.object;

  } catch (error) {
    console.error('Error analyzing feedback patterns:', error);
    throw new Error(
      `Failed to analyze feedback patterns: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generates criteria refinements based on feedback analysis.
 */
export async function generateCriteriaRefinements(
  currentState: WorkflowState,
  feedbackAnalysis: FeedbackAnalysis
): Promise<CriteriaRefinement> {
  try {
    console.log('Generating criteria refinements based on:', { currentState, feedbackAnalysis });

    const result = await generateObject({
      model: openai(AI_MODEL),
      schema: criteriaRefinementSchema,
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI recruiter refining job criteria based on candidate feedback patterns.'
        },
        {
          role: 'user',
          content: messageTemplates.criteriaRefinement.userPrompt(currentState, feedbackAnalysis)
        }
      ]
    });

    if (!result.object) {
      console.error('Missing result.object in criteria refinement');
      throw new Error('Failed to generate criteria refinements');
    }

    console.log('Generated criteria refinements:', result.object);
    return result.object;

  } catch (error) {
    console.error('Error generating criteria refinements:', error);
    throw new Error(
      `Failed to generate criteria refinements: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Calculates an impact score based on feedback and analysis.
 */
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

  const totalFeedback = feedback.length;
  const feedbackWithCriteria = feedback.filter(f => f.criteria?.length).length;

  impacts.skillsImpact = analysis.recommendations.skillsToEmphasize.length * 0.2;
  impacts.experienceImpact = (feedbackWithCriteria / totalFeedback) * 0.3;
  impacts.culturalImpact = analysis.patterns.culturalInsights.length * 0.25;
  impacts.overallConfidence = analysis.confidence;

  return impacts;
}

/**
 * Determines whether criteria should be refined based on feedback patterns.
 */
export function shouldRefineBasedOnFeedback(
  feedback: CandidateFeedback[],
  analysis: FeedbackAnalysis
): boolean {
  if (!feedback.length) return false;

  // Calculate the ratio of positive to negative feedback
  const positiveCount = feedback.filter(f => f.isPositive).length;
  const negativeCount = feedback.length - positiveCount;
  const positiveRatio = positiveCount / feedback.length;

  // Check if we have enough feedback to make a decision
  if (feedback.length < 3) return false;

  // Check if the feedback is significantly negative
  if (positiveRatio < 0.4) return true;

  // Check if we have clear patterns in the analysis
  const hasSignificantPatterns = 
    analysis.patterns.skillGaps.length > 0 ||
    analysis.patterns.culturalInsights.length > 0;

  // Check if there are specific recommendations
  const hasActionableRecommendations =
    analysis.recommendations.skillsToEmphasize.length > 0 ||
    analysis.recommendations.skillsToDeemphasize.length > 0 ||
    analysis.recommendations.experienceAdjustments.length > 0;

  return hasSignificantPatterns || hasActionableRecommendations;
}
