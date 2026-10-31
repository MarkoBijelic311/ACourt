
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
let defenseRetryCount = 0;

function buildDefensePrompt(
  caseAnalysis: unknown,
  prosecutionArguments: AgentArguments,
  retry: boolean
): string {
  const retryNotice = retry
    ? `\nYour previous response could not be parsed as JSON (it was either malformed or truncated before the closing brace). This time, return ONLY the JSON object — no markdown fences, no commentary before or after, and make sure every bracket is closed. Keep each argument's "reasoning" concise (2-3 sentences) so the full response fits comfortably within the output limit.\n`
    : "";

  return `
You are the Defense Agent in a court simulation.

Your role is to prepare arguments for the defense and critically examine the prosecution's claims.

CASE ANALYSIS:
${JSON.stringify(caseAnalysis, null, 2)}

PROSECUTION ARGUMENTS:
${JSON.stringify(prosecutionArguments, null, 2)}
${retryNotice}
Your tasks:
1. Examine the prosecution's arguments critically.
2. Identify weaknesses, unsupported claims and assumptions.
3. Identify evidence that supports the defense.
4. Point out contradictions and limitations in the available evidence.
5. Prepare reasoned counterarguments.
6. Identify missing information that could affect the case.
7. Do not invent facts, evidence or sources.

Clearly distinguish established facts from allegations and assumptions.

Return only valid JSON matching this exact structure:

{
  "arguments": [
    {
      "id": "DEF-1",
      "presentedBy": "Defense",
      "claim": "Defense claim",
      "reasoning": "Explanation of the claim",
      "evidenceIds": [],
      "counterArguments": []
    }
  ]
}

Use "Defense" as presentedBy for every argument.
Use empty arrays when there is no relevant information.
Be concise: present at most 3-4 of your strongest arguments, and keep each "reasoning" entry and each "counterArguments" item to 1-2 sentences.
`;
}

class WhenProsecutionArgumentsAreSubmitted extends SituationSpecification {
  isSatisfiedBy({ event, participant }: SituationContext): boolean {
    if (event.type === "model.answer") {
      return (
        participant instanceof Agent &&
        event.producerId === participant.getId()
      );
    }

    if (
      event.type !== COURT_EVENTS.ARGUMENTS_SUBMITTED ||
      !(participant instanceof Agent)
    ) {
      return false;
    }

    const payload = event.payload;

    return (
      typeof payload === "object" &&
      payload !== null &&
      "presentedBy" in payload &&
      payload.presentedBy === "Prosecutor" &&
      "arguments" in payload
    );
  }
}

export const defenseHandler: SituationHandler = {
  specification: new WhenProsecutionArgumentsAreSubmitted(),

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
            presentedBy: "Defense",
            arguments: parsed.arguments,
          };
        } catch {
          const state = resolveRuntime().state;

          if (!state.caseAnalysis || !state.prosecutionArguments) {
            console.log(
              "Defense Agent returned invalid JSON and required case data is missing; cannot retry."
            );
            return;
          }

          if (defenseRetryCount >= MAX_RETRIES) {
            console.log(
              `Defense Agent returned invalid JSON after ${MAX_RETRIES} retries. Giving up — case is stuck.`
            );
            console.log("RAW DEFENSE RESPONSE:", content.text);
            return;
          }

          defenseRetryCount += 1;
          console.log(
            `Defense Agent returned invalid/truncated JSON. Retrying (${defenseRetryCount}/${MAX_RETRIES})...`
          );

          runLoop(
            participant.getId(),
            buildDefensePrompt(state.caseAnalysis, state.prosecutionArguments, true),
            {
              model: "claude-sonnet-4-6",
              context: participant.getMemory().getContext(),
              maxOutputTokens: 4096,
              streaming: false,
            }
          );

          return;
        }

        defenseRetryCount = 0;

        const state = resolveRuntime().state;

        state.defenseArguments = parsedArguments;

        console.log("Defense arguments completed.");

        const completedEvent = SemanticEvent.create(
          COURT_EVENTS.ARGUMENTS_SUBMITTED,
          participant.getId(),
          {
            presentedBy: "Defense",
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
        !("presentedBy" in payload) ||
        payload.presentedBy !== "Prosecutor" ||
        !("arguments" in payload)
      ) {
        return;
      }

      const state = resolveRuntime().state;

      if (!state.caseAnalysis) {
        console.log("Case analysis is not available.");
        return;
      }

      const prosecutionArguments = payload.arguments as AgentArguments;

      state.prosecutionArguments = prosecutionArguments;
      defenseRetryCount = 0;

      runLoop(
        participant.getId(),
        buildDefensePrompt(state.caseAnalysis, prosecutionArguments, false),
        {
          model: "claude-sonnet-4-6",
          context: participant.getMemory().getContext(),
          maxOutputTokens: 4096,
          streaming: false,
        }
      );
    },
  },
};
