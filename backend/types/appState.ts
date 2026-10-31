import { RuntimeState } from "@mozaik-ai/core";

import type { CaseAnalysis } from "./caseAnalysis.js";
import type { AgentArguments } from "./arguments.js";
import type { EvidenceReview } from "./evidenceReview.js";
import type { JudgmentReport } from "./judgment.js";

export class AppState extends RuntimeState {
  currentCase: string | null = null;

  caseAnalysis: CaseAnalysis | null = null;

  prosecutionArguments: AgentArguments | null = null;

  defenseArguments: AgentArguments | null = null;

  evidenceReview: EvidenceReview | null = null;

  judgment: JudgmentReport | null = null;
}