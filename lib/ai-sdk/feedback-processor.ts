// /lib/ai-sdk/feedback-processor.ts

import { AI_MODEL } from './config';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import {
  feedbackAnalysisSchema,
  criteriaRefinementSchema,
  systemPrompts
} from './validation';
import { messageTemplates } from './templates';
import type {
  CandidateFeedback,
  WorkflowState,
  CriteriaRefinement
} from './types/base';
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
      prompt: messageTemplates.feedbackAnalysis.userPrompt(formattedFeedback),
      mode: 'json',
      output: 'no-schema',
      messages: [
        systemPrompts.feedbackAnalysis,
        {
          role: 'user',
          content: messageTemplates.feedbackAnalysis.userPrompt(formattedFeedback)
        }
      ]
    });

    // Parse and validate the response
    const validatedResponse = feedbackAnalysisSchema.parse(result);
    console.log('Feedback analysis result:', validatedResponse);
    return validatedResponse;

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
      prompt: messageTemplates.criteriaRefinement.userPrompt(currentState, feedbackAnalysis),
      mode: 'json',
      output: 'no-schema',
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

    // Parse and validate the response
    const validatedResponse = criteriaRefinementSchema.parse(result);
    console.log('Generated criteria refinements:', validatedResponse);
    return validatedResponse;

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

  // Calculate the ratio of positive feedback
  const positiveCount = feedback.filter(f => f.isPositive).length;
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

// Process feedback and generate refinements
export async function processFeedback(
  feedback: CandidateFeedback[],
  currentState: WorkflowState
): Promise<{
  analysis: z.infer<typeof feedbackAnalysisSchema>;
  refinements: CriteriaRefinement;
}> {
  try {
    // Generate feedback analysis
    const feedbackPrompt = messageTemplates.feedbackAnalysis.userPrompt(feedback);
    
    const analysisResult = await generateObject({
      model: openai(AI_MODEL),
      prompt: feedbackPrompt,
      mode: 'json',
      output: 'no-schema',
      messages: [
        systemPrompts.feedbackAnalysis,
        {
          role: 'user',
          content: feedbackPrompt
        }
      ]
    });

    const validatedAnalysis = feedbackAnalysisSchema.parse(analysisResult);

    // Generate criteria refinements based on analysis
    const refinementPrompt = messageTemplates.criteriaRefinement.userPrompt(
      currentState,
      validatedAnalysis
    );

    const refinementsResult = await generateObject({
      model: openai(AI_MODEL),
      prompt: refinementPrompt,
      mode: 'json',
      output: 'no-schema',
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI recruiter refining job criteria based on candidate feedback patterns.'
        },
        {
          role: 'user',
          content: refinementPrompt
        }
      ]
    });

    const validatedRefinements = criteriaRefinementSchema.parse(refinementsResult);

    return {
      analysis: validatedAnalysis,
      refinements: validatedRefinements
    };
  } catch (error) {
    console.error('Error processing feedback:', error);
    throw error;
  }
}
