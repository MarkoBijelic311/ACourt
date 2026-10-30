export const Events = {
  COURT_EVENTS_CASE_SUBMITTED : 'court.case_submitted', // Coder   -> Court
  COURT_EVENTS_ARGUMENTS_SUBMITTED : 'court.arguments_submitted', // Coder   -> Court
  COURT_EVENTS_CODE_REJECTED : 'court.code_rejected', // Court   -> Coder
  COURT_EVENTS_CASE_ANALYSIS_COMPLETED : 'court.case_analysis_completed' // Court   -> everyone
} as const;

export interface TaskAssigned { taskId: string; task: string }
export interface CaseSubmitted { taskId: string; task: string }
export interface ArgumentsSubmitted { taskId: string; task: string; code: string; round: number }
export interface CodeRejected { taskId: string; task: string; code: string; round: number; issues: string[] }
export interface CaseAnalysisCompleted { taskId: string; code: string; round: number; approved: boolean }
