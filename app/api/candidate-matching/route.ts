import { NextRequest } from 'next/server';
import { candidateMatchingWorkflow } from '@/lib/workflows/candidate-matching';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { generateCandidates } from '@/lib/ai-sdk/candidate-generation';
import { getJobDescription, getWorkflowState, storeGeneratedCandidates } from '@/lib/ai-sdk/database';
import { initializeWorkflow } from '@/lib/ai-sdk/workflow';
import { candidateMatchingRequestSchema } from '@/lib/ai-sdk/schema';
import type { CandidateFeedback } from '@/lib/ai-sdk/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { jobDescriptionId, workflowType, feedback } = 
      candidateMatchingRequestSchema.parse(await req.json());

    if (workflowType === 'langgraph') {
      // Use existing LangGraph workflow
      const result = await candidateMatchingWorkflow.invoke({
        jobDescriptionId,
        userFeedback: feedback?.map(f => ({
          candidateId: f.candidateId,
          isGoodFit: f.isPositive,
          feedback: f.reason
        })) || []
      });

      return Response.json({
        success: true,
        data: {
          finalCandidates: result.finalCandidates,
          iterationCount: result.iterationCount,
          isComplete: result.shouldTerminate,
          needsFeedback: !result.shouldTerminate
        }
      });
    } else {
      // Use AI SDK workflow
      const jobDescription = await getJobDescription(jobDescriptionId);
      if (!jobDescription) {
        return Response.json({
          success: false,
          error: 'Job description not found'
        }, { status: 404 });
      }

      // Get or initialize workflow state
      let workflowState = await getWorkflowState(jobDescriptionId);
      if (!workflowState) {
        workflowState = await initializeWorkflow(jobDescriptionId);
      }

      // Format selection criteria as array of strings
      const criteria = workflowState.refinedCriteria || workflowState.scoringCriteria;
      const selectionCriteria = [
        `Required Skills: ${criteria.requiredSkills.map((s: { skill: string } | string) => 
          typeof s === 'string' ? s : s.skill
        ).join(', ')}`,
        criteria.preferredSkills?.length ? 
          `Preferred Skills: ${criteria.preferredSkills.map((s: { skill: string } | string) => 
            typeof s === 'string' ? s : s.skill
          ).join(', ')}` : null,
        `Minimum Experience: ${criteria.experienceLevels?.minimum || 0} years`,
        criteria.culturalCriteria?.length ? 
          `Cultural Fit: ${criteria.culturalCriteria.map((c: { attribute: string } | string) => 
            typeof c === 'string' ? c : c.attribute
          ).join(', ')}` : null,
        criteria.leadershipCriteria?.length ? 
          `Leadership: ${criteria.leadershipCriteria.map((c: { attribute: string } | string) => 
            typeof c === 'string' ? c : c.attribute
          ).join(', ')}` : null
      ].filter(Boolean) as string[];

      console.log('Formatted selection criteria:', selectionCriteria);

      // Generate candidates
      const candidates = await generateCandidates({
        jobDescription: jobDescription.parsed_content,
        selectionCriteria,
        numberOfCandidates: workflowState.iterationCount >= 4 ? 10 : 5,
        feedback: feedback as CandidateFeedback[] || []
      });

      // Store candidates in database
      const isFinal = workflowState.iterationCount >= 4;
      await storeGeneratedCandidates(
        jobDescriptionId,
        candidates,
        workflowState.iterationCount,
        isFinal
      );

      return Response.json({
        success: true,
        data: {
          finalCandidates: candidates,
          iterationCount: workflowState.iterationCount,
          isComplete: isFinal,
          needsFeedback: !isFinal
        }
      });
    }
  } catch (error) {
    console.error('Error in candidate matching:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to match candidates'
    }, { status: 500 });
  }
} 