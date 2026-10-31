import { createAgent, type SituationHandler } from "@mozaik-ai/core";
import { judgeAgentInstruction } from "../instructions/judgeAgentInstruction.js";

export function createJudgeAgent(handlers: SituationHandler[] = []) {
  return createAgent({
    name: "Judge Agent",
    capabilities: ["inference"],
    instruction: judgeAgentInstruction,
    tools: [],
    handlers,
  });
}