import { openai, AI_MODEL } from './config';
import { systemPrompts } from './schema';
import type { 
  WorkflowState, 
  CriteriaRefinement,
  ScoringCriteria,
  CandidateFeedback,
  SystemMessage,
  UserMessage
} from './types';

const MAX_ITERATIONS = 5;

export async function initializeWorkflow(jobDescriptionId: string): Promise<WorkflowState> {
  return {
    jobDescriptionId,
    iterationCount: 0,
    shouldTerminate: false,
    currentPhase: 'INITIAL',
    scoringCriteria: {
      skillsWeight: 0.3,
      experienceWeight: 0.2,
      achievementsWeight: 0.2,
      culturalWeight: 0.2,
      leadershipWeight: 0.1,
      requiredSkills: [],
      preferredSkills: [],
      experienceLevels: {
        minimum: 0,
        preferred: 0,
        maximum: 0,
        yearsWeight: 0.5
      },
      culturalCriteria: [],
      leadershipCriteria: []
    }
  };
}

export async function refineCriteria(
  currentState: WorkflowState,
  feedback: CandidateFeedback[]
): Promise<CriteriaRefinement> {
  const messages: (SystemMessage | UserMessage)[] = [
    { role: 'system', content: systemPrompts.feedbackAnalysis.content },
    {
      role: 'user',
      content: `Analyze the feedback and refine the job criteria to generate better matches.
      
Current Criteria:
${JSON.stringify(currentState.refinedCriteria || currentState.scoringCriteria, null, 2)}

Feedback History:
${feedback.map(f => {
  const feedbackDetails = [
    `Candidate ${f.candidateId}: ${f.isPositive ? 'Good fit' : 'Not a good fit'}`,
    f.reason ? `Reason: ${f.reason}` : null,
    f.criteria?.map(c => `${c.category}: ${c.score}/5${c.comment ? ` (${c.comment})` : ''}`).join(', ')
  ].filter(Boolean).join(' - ');
  
  return `- ${feedbackDetails}`;
}).join('\n')}

Instructions:
1. Analyze patterns in what made candidates good or poor fits
2. Adjust skill requirements based on successful matches
3. Refine experience levels based on feedback
4. Update cultural attributes based on fit
5. Document each change and why it was made
6. Build upon previous refinements if they were successful

Return a structured refinement that clearly shows:
- Which skills became more/less important
- How experience requirements changed
- What cultural attributes matter most
- Clear reasoning for each adjustment`
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

export function shouldContinueWorkflow(state: WorkflowState): boolean {
  if (state.error || state.shouldTerminate) {
    return false;
  }

  if (state.iterationCount >= MAX_ITERATIONS) {
    return false;
  }

  return true;
}

export function updateWorkflowState(
  currentState: WorkflowState,
  updates: Partial<WorkflowState>
): WorkflowState {
  return {
    ...currentState,
    ...updates,
    iterationCount: updates.iterationCount ?? currentState.iterationCount,
    metadata: {
      ...currentState.metadata,
      ...updates.metadata
    }
  };
}

export function calculateConvergence(state: WorkflowState): number {
  // TODO: Implement convergence calculation based on:
  // 1. Changes in criteria refinements over iterations
  // 2. Stability of match scores
  // 3. Consistency in feedback
  return 0;
} 