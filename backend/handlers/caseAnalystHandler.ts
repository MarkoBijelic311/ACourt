
import {
  Agent,
  SemanticEvent,
  SituationSpecification,
  type SituationContext,
  type SituationHandler,
} from "@mozaik-ai/core";

import { COURT_EVENTS } from "../types/courtEvents.js";
import type { CaseAnalysis } from "../types/caseAnalysis.js";
import { resolveRuntime, runLoop, sendEvent } from "../src/runtime.js";

const MAX_RETRIES = 2;
let caseAnalystRetryCount = 0;

function buildCaseAnalystPrompt(caseDescription: string, retry: boolean): string {
  const retryNotice = retry
    ? `\nYour previous response could not be parsed as JSON (it was either malformed or truncated before the closing brace). This time, return ONLY the JSON object — no markdown fences, no commentary before or after, and make sure every bracket is closed.\n`
    : "";

  return `
You are the Case Analyst in a court simulation.

Analyze the submitted case objectively and systematically.

CASE DESCRIPTION:
${caseDescription}
${retryNotice}
Identify:
1. Case overview.
2. Involved parties, their roles and interests.
3. Established facts.
4. Allegations and assumptions.
5. Evidence items, their sources, relevance and limitations.
6. Key legal and factual issues.
7. Contradictions.
8. Strengths and weaknesses of the prosecution and defense.
9. Missing information.
10. Questions that the court should consider.

Do not invent facts, evidence, sources or legal conclusions.
Clearly distinguish established facts from allegations and assumptions.

Return only valid JSON matching this structure:

{
  "caseOverview": "Overview",
  "involvedParties": [
    {
      "name": "Party name",
      "role": "Role",
      "interests": []
    }
  ],
  "establishedFacts": [],
  "allegationsAndAssumptions": [],
  "evidenceItems": [
    {
      "id": "E-1",
      "description": "Evidence description",
      "source": "Evidence source",
      "relevance": "Relevance",
      "limitations": []
    }
  ],
  "keyIssues": [],
  "contradictions": [],
  "strengthsAndWeaknesses": {
    "prosecution": [],
    "defense": []
  },
  "missingInformation": [],
  "questionsForTheCourt": []
}

Use empty arrays when information is unavailable.
Be concise: limit each array to at most 4-5 of the most important items, "involvedParties.interests" to at most 2 items each, and keep "caseOverview" and every text field to 1-3 sentences. This analysis is reused as context by four downstream agents, so brevity here keeps the whole case affordable.
`;
}

function isValidCaseAnalysis(value: unknown): value is CaseAnalysis {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.caseOverview === "string" &&
    Array.isArray(v.involvedParties) &&
    Array.isArray(v.establishedFacts) &&
    Array.isArray(v.allegationsAndAssumptions) &&
    Array.isArray(v.evidenceItems) &&
    Array.isArray(v.keyIssues) &&
    Array.isArray(v.contradictions) &&
    typeof v.strengthsAndWeaknesses === "object" &&
    v.strengthsAndWeaknesses !== null &&
    Array.isArray(v.missingInformation) &&
    Array.isArray(v.questionsForTheCourt)
  );
}

class WhenCaseIsSubmitted extends SituationSpecification {
  isSatisfiedBy({ event, participant }: SituationContext): boolean {
    if (event.type === "CASE_SUBMITTED") {
      return participant instanceof Agent;
    }

    if (event.type === "model.answer") {
      return (
        participant instanceof Agent &&
        event.producerId === participant.getId()
      );
    }

    return false;
  }
}

export const caseAnalystHandler: SituationHandler = {
  specification: new WhenCaseIsSubmitted(),

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

        let analysis: CaseAnalysis;

        try {
          const parsed = JSON.parse(cleanedAnswer);

          if (!isValidCaseAnalysis(parsed)) {
            throw new Error("invalid structure");
          }

          analysis = parsed;
        } catch {
          const state = resolveRuntime().state;

          if (!state.currentCase) {
            console.log(
              "Case Analyst returned invalid JSON and the current case is missing; cannot retry."
            );
            return;
          }

          if (caseAnalystRetryCount >= MAX_RETRIES) {
            console.log(
              `Case Analyst returned invalid JSON after ${MAX_RETRIES} retries. Giving up — case is stuck.`
            );
            console.log("RAW CASE ANALYST RESPONSE:", content.text);
            return;
          }

          caseAnalystRetryCount += 1;
          console.log(
            `Case Analyst returned invalid/truncated JSON. Retrying (${caseAnalystRetryCount}/${MAX_RETRIES})...`
          );

          runLoop(
            participant.getId(),
            buildCaseAnalystPrompt(state.currentCase, true),
            {
              model: "claude-sonnet-4-6",
              context: participant.getMemory().getContext(),
              maxOutputTokens: 8192,
              streaming: false,
            }
          );

          return;
        }

        caseAnalystRetryCount = 0;

        const state = resolveRuntime().state;

        state.caseAnalysis = analysis;

        console.log("Case analysis completed.");

        const completedEvent = SemanticEvent.create(
          COURT_EVENTS.CASE_ANALYSIS_COMPLETED,
          participant.getId(),
          { analysis }
        );

        sendEvent(completedEvent, participant.getId());
        return;
      }

      const payload = event.payload;

      if (
        typeof payload !== "object" ||
        payload === null ||
        !("caseDescription" in payload) ||
        typeof payload.caseDescription !== "string"
      ) {
        return;
      }

      const state = resolveRuntime().state;

      state.currentCase = payload.caseDescription;
      caseAnalystRetryCount = 0;

      runLoop(
        participant.getId(),
        buildCaseAnalystPrompt(payload.caseDescription, false),
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
