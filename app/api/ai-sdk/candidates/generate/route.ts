import { NextRequest } from 'next/server';
import { generateCandidates } from '@/lib/ai-sdk/candidate-generation';
import { 
  getJobDescription, 
  getWorkflowState,
  storeGeneratedCandidates 
} from '@/lib/ai-sdk/database';
import { initializeWorkflow } from '@/lib/ai-sdk/workflow';
import { z } from 'zod';

export const runtime = 'edge';

// Request schema
const generateRequestSchema = z.object({
  jobDescriptionId: z.string().uuid()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobDescriptionId } = generateRequestSchema.parse(body);

    // Get job description
    const jobDescription = await getJobDescription(jobDescriptionId);
    if (!jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Job description not found' }),
        { status: 404 }
      );
    }

    // Get or initialize workflow state
    let workflowState = await getWorkflowState(jobDescriptionId);
    if (!workflowState) {
      workflowState = await initializeWorkflow(jobDescriptionId);
    }

    // Generate candidates
    const candidates = await generateCandidates({
      jobDescription: jobDescription.parsed_content,
      selectionCriteria: workflowState.refinedCriteria || workflowState.scoringCriteria,
      numberOfCandidates: workflowState.iterationCount >= 4 ? 10 : 5,
      feedback: []  // Will be populated in subsequent iterations
    });

    // Store candidates in database
    const isFinal = workflowState.iterationCount >= 4;
    await storeGeneratedCandidates(
      jobDescriptionId,
      candidates,
      workflowState.iterationCount,
      isFinal
    );

    // Update workflow state
    const updatedState = {
      ...workflowState,
      currentPhase: 'EVALUATING',
      shouldTerminate: isFinal
    };

    return new Response(JSON.stringify({
      candidates,
      state: updatedState
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating candidates:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format',
          details: error.errors 
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to generate candidates' }),
      { status: 500 }
    );
  }
} 