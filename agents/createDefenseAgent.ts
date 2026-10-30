import { createAgent, type SituationHandler } from "@mozaik-ai/core";
import { defenseAgentInstruction } from "../instructions/defenseAgentInstruction.js";

export function createDefenseAgent(handlers: SituationHandler[] = []) {
  return createAgent({
    name: "Defense Agent",
    capabilities: ["inference"],
    instruction: defenseAgentInstruction,
    tools: [],
    handlers,
  });
}