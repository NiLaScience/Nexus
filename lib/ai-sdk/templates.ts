import type { 
  JobDescription,
  CandidateProfile,
  CandidateFeedback,
  WorkflowState
} from './types/base';

// Evaluation categories
export const evaluationCategories = {
  technical: {
    name: 'Technical Skills',
    weight: 0.4,
    criteria: ['Required Skills Match', 'Technical Experience', 'Technical Depth']
  },
  experience: {
    name: 'Experience',
    weight: 0.3,
    criteria: ['Years of Experience', 'Industry Knowledge', 'Project Complexity']
  },
  education: {
    name: 'Education & Certifications',
    weight: 0.15,
    criteria: ['Education Level', 'Relevant Certifications', 'Continuous Learning']
  },
  jobFit: {
    name: 'Job Fit',
    weight: 0.15,
    criteria: ['Role Alignment', 'Company Culture', 'Growth Potential']
  }
} as const;

// Message templates
export const messageTemplates = {
  candidateEvaluation: {
    userPrompt: (job: JobDescription, candidate: CandidateProfile, categories: typeof evaluationCategories) => `Please evaluate this candidate for the following job:

Job Title: ${job.title}
Job Description: ${job.description}
Requirements: ${job.requirements.join(', ')}
Experience Level: ${job.parsed_content}

Candidate Profile:
Name: ${candidate.name}
Skills: ${candidate.skills.join(', ')}
Background: ${candidate.background}
Years of Experience: ${candidate.yearsOfExperience}
Achievements: ${candidate.achievements.join(', ')}

Evaluate the candidate across these categories:
${Object.entries(categories).map(([_, cat]) => 
  `${cat.name} (Weight: ${cat.weight})
   Criteria: ${cat.criteria.join(', ')}`
).join('\n')}`
  },

  feedbackAnalysis: {
    userPrompt: (feedback: CandidateFeedback[]) => `Analyze the following candidate feedback and identify patterns and insights. Return your analysis as a JSON object:

${feedback.map(f => {
  const details = [
    `Candidate: ${f.candidateId}`,
    f.isPositive ? 'Positive' : 'Negative',
    f.reason
  ].filter(Boolean).join(' - ');
  
  return `- ${details}`;
}).join('\n')}`
  },

  criteriaRefinement: {
    userPrompt: (currentState: WorkflowState, feedbackAnalysis: any) => `Based on the feedback analysis, refine the job criteria and return the refinements as a JSON object:

Current Criteria:
${JSON.stringify(currentState.refinedCriteria || currentState.scoringCriteria, null, 2)}

Feedback Analysis:
${JSON.stringify(feedbackAnalysis, null, 2)}`
  }
} as const; 