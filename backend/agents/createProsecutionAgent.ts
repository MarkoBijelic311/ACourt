import { createAgent, type SituationHandler } from "@mozaik-ai/core";
import { prosecutionAgentInstruction } from "../instructions/prosecutionAgentInstruction.js";

export function createProsecutionAgent(handlers: SituationHandler[] = []) {
  return createAgent({
    name: "Prosecution Agent",
    capabilities: ["inference"],
    instruction: prosecutionAgentInstruction,
    tools: [],
    handlers,
  });
}