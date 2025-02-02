import type { 
  WorkflowState,
  DbWorkflowState
} from './types/base';

export function mapDbToWorkflowState(db: DbWorkflowState): WorkflowState {
  return {
    jobDescriptionId: db.jobdescriptionid,
    iterationCount: db.iterationcount,
    shouldTerminate: db.shouldterminate,
    currentPhase: db.currentphase,
    refinedCriteria: db.refinedcriteria,
    scoringCriteria: {
      skillsWeight: db.scoringcriteria.skillsweight,
      experienceWeight: db.scoringcriteria.experienceweight,
      achievementsWeight: db.scoringcriteria.achievementsweight,
      culturalWeight: db.scoringcriteria.culturalweight,
      leadershipWeight: db.scoringcriteria.leadershipweight,
      requiredSkills: db.scoringcriteria.requiredskills,
      preferredSkills: db.scoringcriteria.preferredskills,
      experienceLevels: {
        minimum: db.scoringcriteria.experiencelevels.minimum,
        preferred: db.scoringcriteria.experiencelevels.preferred,
        maximum: db.scoringcriteria.experiencelevels.maximum,
        yearsWeight: db.scoringcriteria.experiencelevels.yearsweight
      },
      culturalCriteria: db.scoringcriteria.culturalcriteria,
      leadershipCriteria: db.scoringcriteria.leadershipcriteria
    },
    error: db.error,
    metadata: db.metadata
  };
}

export function mapWorkflowStateToDb(state: WorkflowState): DbWorkflowState {
  return {
    jobdescriptionid: state.jobDescriptionId,
    iterationcount: state.iterationCount,
    shouldterminate: state.shouldTerminate,
    currentphase: state.currentPhase,
    refinedcriteria: state.refinedCriteria,
    scoringcriteria: {
      skillsweight: state.scoringCriteria.skillsWeight,
      experienceweight: state.scoringCriteria.experienceWeight,
      achievementsweight: state.scoringCriteria.achievementsWeight,
      culturalweight: state.scoringCriteria.culturalWeight,
      leadershipweight: state.scoringCriteria.leadershipWeight,
      requiredskills: state.scoringCriteria.requiredSkills,
      preferredskills: state.scoringCriteria.preferredSkills,
      experiencelevels: {
        minimum: state.scoringCriteria.experienceLevels.minimum,
        preferred: state.scoringCriteria.experienceLevels.preferred,
        maximum: state.scoringCriteria.experienceLevels.maximum,
        yearsweight: state.scoringCriteria.experienceLevels.yearsWeight
      },
      culturalcriteria: state.scoringCriteria.culturalCriteria,
      leadershipcriteria: state.scoringCriteria.leadershipCriteria
    },
    error: state.error,
    metadata: state.metadata
  };
} 