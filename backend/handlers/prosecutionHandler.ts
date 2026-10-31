
import {
  Agent,
  SemanticEvent,
  SituationSpecification,
  type SituationContext,
  type SituationHandler,
} from "@mozaik-ai/core";

import { COURT_EVENTS } from "../types/courtEvents.js";
import type { AgentArguments } from "../types/arguments.js";
import { resolveRuntime, runLoop, sendEvent } from "../src/runtime.js";

const MAX_RETRIES = 2;
let prosecutionRetryCount = 0;

function buildProsecutionPrompt(analysis: unknown, retry: boolean): string {
  const retryNotice = retry
    ? `\nYour previous response could not be parsed as JSON (it was either malformed or truncated before the closing brace). This time, return ONLY the JSON object — no markdown fences, no commentary before or after, and make sure every bracket is closed. Keep each argument's "reasoning" concise (2-3 sentences) so the full response fits comfortably within the output limit.\n`
    : "";

  return `
You are the Prosecution Agent in a court simulation.

Your role is to prepare arguments for the prosecution based on the case analysis.

CASE ANALYSIS:
${JSON.stringify(analysis, null, 2)}
${retryNotice}
Your tasks:
1. Identify facts and evidence that support the prosecution.
2. Develop clear and logical arguments.
3. Connect each claim to relevant evidence IDs.
4. Explain the reasoning behind each argument.
5. Anticipate possible defense counterarguments.
6. Do not present assumptions as established facts.

Do not invent facts, evidence, sources or legal conclusions.
Use only information contained in the case analysis.

Return only valid JSON matching this exact structure:

{
  "arguments": [
    {
      "id": "PROS-1",
      "presentedBy": "Prosecutor",
      "claim": "Prosecution claim",
      "reasoning": "Explanation of the claim",
      "evidenceIds": [],
      "counterArguments": []
    }
  ]
}

Use "Prosecutor" as presentedBy for every argument.
Use empty arrays when there is no relevant information.
Be concise: present at most 3-4 of your strongest arguments, and keep each "reasoning" entry and each "counterArguments" item to 1-2 sentences.
`;
}

class WhenCaseAnalysisIsCompleted extends SituationSpecification {
  isSatisfiedBy({ event, participant }: SituationContext): boolean {
    if (event.type === "model.answer") {
      return (
        participant instanceof Agent &&
        event.producerId === participant.getId()
      );
    }

    return (
      event.type === COURT_EVENTS.CASE_ANALYSIS_COMPLETED &&
      participant instanceof Agent
    );
  }
}

export const prosecutionHandler: SituationHandler = {
  specification: new WhenCaseAnalysisIsCompleted(),

  processor: {
    apply({ event, participant }) {
      if (!(participant instanceof Agent)) return;

      if (event.type === "model.answer") {
        const payload = event.payload;

        if (
          typeof payload !== "object" ||
          payload === null ||
          !("answer" in payload)
        ) {
          return;
        }

        const answer = payload.answer;

        if (
          typeof answer !== "object" ||
          answer === null ||
          !("content" in answer)
        ) {
          return;
        }

        const content = answer.content;

        if (
          typeof content !== "object" ||
          content === null ||
          !("text" in content) ||
          typeof content.text !== "string"
        ) {
          return;
        }

        const cleanedAnswer = content.text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "")
          .trim();

        let parsedArguments: AgentArguments;

        try {
          const parsed = JSON.parse(cleanedAnswer);

          if (
            typeof parsed !== "object" ||
            parsed === null ||
            !Array.isArray(parsed.arguments)
          ) {
            throw new Error("invalid structure");
          }

          parsedArguments = {
            presentedBy: "Prosecutor",
            arguments: parsed.arguments,
          };
        } catch {
          const state = resolveRuntime().state;

          if (!state.caseAnalysis) {
            console.log(
              "Prosecution Agent returned invalid JSON and case analysis is missing; cannot retry."
            );
            return;
          }

          if (prosecutionRetryCount >= MAX_RETRIES) {
            console.log(
              `Prosecution Agent returned invalid JSON after ${MAX_RETRIES} retries. Giving up — case is stuck.`
            );
            console.log("RAW PROSECUTION RESPONSE:", content.text);
            return;
          }

          prosecutionRetryCount += 1;
          console.log(
            `Prosecution Agent returned invalid/truncated JSON. Retrying (${prosecutionRetryCount}/${MAX_RETRIES})...`
          );

          runLoop(
            participant.getId(),
            buildProsecutionPrompt(state.caseAnalysis, true),
            {
              model: "claude-sonnet-4-6",
              context: participant.getMemory().getContext(),
              maxOutputTokens: 8192,
              streaming: false,
            }
          );

          return;
        }

        prosecutionRetryCount = 0;

        const state = resolveRuntime().state;

        state.prosecutionArguments = parsedArguments;

        console.log("Prosecution arguments completed.");

        const completedEvent = SemanticEvent.create(
          COURT_EVENTS.ARGUMENTS_SUBMITTED,
          participant.getId(),
          {
            presentedBy: "Prosecutor",
            arguments: parsedArguments,
          }
        );

        sendEvent(completedEvent, participant.getId());
        return;
      }

      const payload = event.payload;

      if (
        typeof payload !== "object" ||
        payload === null ||
        !("analysis" in payload)
      ) {
        return;
      }

      prosecutionRetryCount = 0;

      runLoop(
        participant.getId(),
        buildProsecutionPrompt(payload.analysis, false),
        {
          model: "claude-sonnet-4-6",
          context: participant.getMemory().getContext(),
          maxOutputTokens: 8192,
          streaming: false,
        }
      );
    },
  },
};
