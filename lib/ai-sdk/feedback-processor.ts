import { openai, AI_MODEL } from './config';
import { systemPrompts } from './schema';
import type { 
  CandidateFeedback, 
  WorkflowState,
  CriteriaRefinement,
  SystemMessage,
  UserMessage
} from './types';

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

export async function analyzeFeedbackPatterns(
  feedback: CandidateFeedback[]
): Promise<FeedbackAnalysis> {
  const messages: (SystemMessage | UserMessage)[] = [
    { role: 'system', content: systemPrompts.feedbackAnalysis.content },
    {
      role: 'user',
      content: `Analyze the following candidate feedback and identify patterns and insights:

${feedback.map(f => {
  const details = [
    `Candidate ${f.candidateId}: ${f.isPositive ? 'Positive' : 'Negative'}`,
    f.reason ? `Reason: ${f.reason}` : null,
    f.criteria?.map(c => `${c.category}: ${c.score}/5${c.comment ? ` (${c.comment})` : ''}`).join(', ')
  ].filter(Boolean).join(' - ');
  
  return `- ${details}`;
}).join('\n')}

Provide a structured analysis including:
1. Positive and negative patterns in feedback
2. Identified skill gaps
3. Cultural fit insights
4. Specific recommendations for adjustments`
    }
  ];

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages,
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

export async function generateCriteriaRefinements(
  currentState: WorkflowState,
  feedbackAnalysis: FeedbackAnalysis
): Promise<CriteriaRefinement> {
  const messages: (SystemMessage | UserMessage)[] = [
    { role: 'system', content: systemPrompts.feedbackAnalysis.content },
    {
      role: 'user',
      content: `Based on the feedback analysis, refine the job criteria:

Current Criteria:
${JSON.stringify(currentState.refinedCriteria || currentState.scoringCriteria, null, 2)}

Feedback Analysis:
${JSON.stringify(feedbackAnalysis, null, 2)}

Generate refined criteria that:
1. Adjusts skill requirements based on identified patterns
2. Updates experience requirements based on feedback
3. Refines cultural attributes based on insights
4. Provides clear reasoning for each adjustment

Return a structured refinement following the CriteriaRefinement schema.`
    }
  ];

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages,
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
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