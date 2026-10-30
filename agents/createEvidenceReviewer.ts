
import { createAgent, type SituationHandler } from "@mozaik-ai/core";
import { evidenceReviewerInstruction } from "../instructions/evidenceReviewerInstruction.js";

export function createEvidenceReviewer(handlers: SituationHandler[] = []) {
  return createAgent({
    name: "Evidence Reviewer",
    capabilities: ["inference"],
    instruction: evidenceReviewerInstruction,
    tools: [],
    handlers,
  });
}
