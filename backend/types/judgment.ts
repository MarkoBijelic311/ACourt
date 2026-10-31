export type Verdict =
  | "GUILTY"
  | "NOT_GUILTY"
  | "INSUFFICIENT_EVIDENCE";

export interface JudgmentReport {
  verdict: Verdict;
  caseSummary: string;
  prosecutionArguments: string[];
  defenseArguments: string[];
  evidenceAssessment: string;
  contradictions: string[];
  conclusion: string;
  uncertaintiesAndMissingInformation: string[];
}