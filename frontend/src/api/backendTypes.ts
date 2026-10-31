/**
 * Mirrors the response/request shapes of the ACourt backend (backend/types/*.ts).
 * Frontend-only copy so the mapper has concrete types to work against —
 * the backend itself is never imported or modified.
 */

export interface BackendCaseEvidenceItem {
  id: string;
  description: string;
  source: string;
  relevance: string;
  limitations: string[];
}

export interface BackendCaseAnalysis {
  caseOverview: string;
  involvedParties: { name: string; role: string; interests: string[] }[];
  establishedFacts: string[];
  allegationsAndAssumptions: string[];
  evidenceItems: BackendCaseEvidenceItem[];
  keyIssues: string[];
  contradictions: string[];
  strengthsAndWeaknesses: { prosecution: string[]; defense: string[] };
  missingInformation: string[];
  questionsForTheCourt: string[];
}

export type BackendArgumentSide = "Prosecutor" | "Defense";

export interface BackendArgument {
  id: string;
  presentedBy: BackendArgumentSide;
  claim: string;
  reasoning: string;
  evidenceIds: string[];
  counterArguments: string[];
}

export interface BackendAgentArguments {
  presentedBy: BackendArgumentSide;
  arguments: BackendArgument[];
}

export type BackendEvidenceSupportStatus =
  | "Supported"
  | "Partially supported"
  | "Unsupported"
  | "Contradicted";

export interface BackendClaimReview {
  argumentId: string;
  claim: string;
  presentedBy: BackendArgumentSide;
  status: BackendEvidenceSupportStatus;
  supportingEvidenceIds: string[];
  explanation: string;
}

export interface BackendContradiction {
  description: string;
  relatedEvidenceIds: string[];
  affectedClaims: string[];
}

export interface BackendEvidenceReview {
  reviewedClaims: BackendClaimReview[];
  contradictions: BackendContradiction[];
  unsupportedClaims: string[];
  missingEvidence: string[];
  overallAssessment: string;
  recommendations: string[];
}

export type BackendVerdict = "GUILTY" | "NOT_GUILTY" | "INSUFFICIENT_EVIDENCE";

export interface BackendJudgmentReport {
  verdict: BackendVerdict;
  caseSummary: string;
  prosecutionArguments: string[];
  defenseArguments: string[];
  evidenceAssessment: string;
  contradictions: string[];
  conclusion: string;
  uncertaintiesAndMissingInformation: string[];
}

export interface BackendStatus {
  caseSubmitted: boolean;
  caseAnalystCompleted: boolean;
  prosecutorCompleted: boolean;
  defenseCompleted: boolean;
  evidenceReviewerCompleted: boolean;
  judgeCompleted: boolean;
}

export interface BackendAnalysisResponse {
  status: "processing" | "done";
  analysis?: BackendCaseAnalysis;
}

export interface BackendArgumentsResponse {
  status: "processing" | "done";
  prosecution: BackendAgentArguments | null;
  defense: BackendAgentArguments | null;
}

export interface BackendEvidenceReviewResponse {
  status: "processing" | "done";
  evidenceReview?: BackendEvidenceReview;
}

export interface BackendJudgmentResponse {
  status: "processing" | "done";
  judgment?: BackendJudgmentReport;
}

export interface BackendErrorResponse {
  error: string;
}
