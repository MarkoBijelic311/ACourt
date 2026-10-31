
import { createAgent, type SituationHandler } from "@mozaik-ai/core";
import { caseAnalystInstruction } from "../instructions/caseAnalystInstructions.js";

export function createCaseAnalyst(handlers: SituationHandler[] = []) {
  return createAgent({
    name: "Case Analyst",
    capabilities: ["inference"],
    instruction: caseAnalystInstruction,
    tools: [],
    handlers,
  });
}
