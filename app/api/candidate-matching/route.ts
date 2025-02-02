import { NextRequest } from 'next/server';
import { candidateMatchingWorkflow } from '@/lib/workflows/candidate-matching';
import { z } from 'zod';
import { getJobDescription } from '@/lib/ai-sdk/database';
import { runCandidateWorkflow } from '@/lib/ai-sdk/candidate-workflow';
import { candidateMatchingRequestSchema, jobDescriptionSchema } from '@/lib/ai-sdk/validation';


type JobDescription = z.infer<typeof jobDescriptionSchema>;

interface JobDescriptionRecord {
  id: string;
  parsed_content: JobDescription;
}

function formatJobDescription(jobDesc: JobDescriptionRecord): string {
  console.log('Raw job description:', JSON.stringify(jobDesc, null, 2));

  const parsed = jobDesc.parsed_content;
  if (!parsed) {
    return 'No job description available';
  }

  return `
Title: ${parsed.title}

Description: ${parsed.description}

Requirements:
${parsed.requirements.map((req: string) => `- ${req}`).join('\n')}

Responsibilities:
${parsed.responsibilities.map((resp: string) => `- ${resp}`).join('\n')}

Location: ${parsed.location || 'Not specified'}
Employment Type: ${parsed.employmentType}
Experience Level: ${parsed.experienceLevel}
Remote: ${parsed.remote ? 'Yes' : 'No'}
`.trim();
}

interface LangGraphResponse {
  finalCandidates: any[];
  iterationCount: number;
  shouldTerminate: boolean;
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
      }) as LangGraphResponse;

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
        const jobDescriptionText = formatJobDescription(jobDescription as JobDescriptionRecord);
        console.log('Formatted job description:', jobDescriptionText);

        // Run the workflow
        const { candidates, workflowState } = await runCandidateWorkflow(
          {
            jobDescription: jobDescriptionText,
            selectionCriteria: jobDescription.requirements || [],
            numberOfCandidates: 5,
            feedback: formattedFeedback
          },
          jobDescriptionId
        );

        console.log('Workflow completed successfully:', {
          candidatesCount: candidates.length,
          iterationCount: workflowState.iterationCount,
          isComplete: workflowState.shouldTerminate
        });

        return Response.json({
          success: true,
          data: {
            finalCandidates: candidates,
            iterationCount: workflowState.iterationCount,
            isComplete: workflowState.shouldTerminate,
            needsFeedback: !workflowState.shouldTerminate,
            refinedCriteria: workflowState.uiCriteria
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

    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid request format' }, { status: 400 });
    }

    return Response.json(
      { error: 'Failed to process candidate matching request' },
      { status: 500 }
    );
  }
} 