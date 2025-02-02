import { NextRequest } from 'next/server';
import { candidateMatchingWorkflow } from '@/lib/workflows/candidate-matching';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { getJobDescription } from '@/lib/ai-sdk/database';
import { runCandidateWorkflow } from '@/lib/ai-sdk/candidate-workflow';
import { candidateMatchingRequestSchema } from '@/lib/ai-sdk/schema';
import type { CandidateFeedback } from '@/lib/ai-sdk/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function formatJobDescription(jobDesc: any): string {
  console.log('Raw job description:', JSON.stringify(jobDesc, null, 2));

  const parsed = jobDesc.parsed_content;
  if (!parsed) {
    return 'No job description available';
  }

  return `
Title: ${parsed.title}

Company: ${parsed.company.name}
Industry: ${parsed.company.industry}
${parsed.company.description ? `Company Description: ${parsed.company.description}` : ''}

Location: ${parsed.location}
Employment Type: ${parsed.employmentType}

Required Skills:
${parsed.requiredSkills.map((skill: string) => `- ${skill}`).join('\n')}

${parsed.preferredSkills.length > 0 ? `Preferred Skills:
${parsed.preferredSkills.map((skill: string) => `- ${skill}`).join('\n')}` : ''}

Responsibilities:
${parsed.responsibilities.map((resp: string) => `- ${resp}`).join('\n')}

Qualifications:
${parsed.qualifications.map((qual: string) => `- ${qual}`).join('\n')}

Years of Experience Required: ${parsed.yearsOfExperience}

Career Level: ${parsed.careerLevel.level}
Management Responsibilities: ${parsed.careerLevel.managementResponsibilities ? 'Yes' : 'No'}
Direct Reports: ${parsed.careerLevel.directReports}
Scope: ${parsed.careerLevel.scope}
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    console.log('Received candidate matching request');
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
      console.log('Using AI SDK workflow for job:', jobDescriptionId);
      
      // Get job description
      const jobDescription = await getJobDescription(jobDescriptionId);
      if (!jobDescription) {
        console.error('Job description not found:', jobDescriptionId);
        return Response.json({
          success: false,
          error: 'Job description not found'
        }, { status: 404 });
      }

      try {
        // Convert feedback to match our lowercase convention
        const formattedFeedback = feedback?.map(f => ({
          candidateId: f.candidateId,
          isPositive: f.isPositive,
          reason: f.reason || 'Manual selection'
        }));

        // Format the job description into a string
        const jobDescriptionText = formatJobDescription(jobDescription);
        console.log('Formatted job description:', jobDescriptionText);

        // Run the workflow
        const result = await runCandidateWorkflow(
          {
            jobDescription: jobDescriptionText,
            selectionCriteria: jobDescription.requirements || [],
            numberOfCandidates: 5,
            feedback: formattedFeedback
          },
          jobDescriptionId
        );

        console.log('Workflow completed successfully:', {
          candidatesCount: result.candidates.length,
          iterationCount: result.workflowState.iterationcount,
          isComplete: result.workflowState.shouldterminate
        });

        return Response.json({
          success: true,
          data: {
            finalCandidates: result.finalCandidates,
            iterationCount: result.iterationCount,
            isComplete: result.shouldTerminate,
            needsFeedback: !result.shouldTerminate,
            refinedCriteria: result.refinedCriteria
          }
        });

      } catch (error) {
        console.error('Error running candidate workflow:', error);
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to run candidate workflow'
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error in candidate matching:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to match candidates'
    }, { status: 500 });
  }
} 