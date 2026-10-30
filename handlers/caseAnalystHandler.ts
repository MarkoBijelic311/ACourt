
import {
  Agent,
  SemanticEvent,
  SituationSpecification,
  type SituationContext,
  type SituationHandler,
} from "@mozaik-ai/core";

import { COURT_EVENTS } from "../types/courtEvents.js";
import type { CaseAnalysis } from "../types/caseAnalysis.js";
import { resolveRuntime, runLoop, sendEvent } from "../runtime.js";

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
          analysis = JSON.parse(cleanedAnswer);
        } catch {
          console.log("Case Analyst returned invalid JSON.");
          return;
        }

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

      const message = `
You are the Case Analyst in a court simulation.

Analyze the submitted case objectively and systematically.

CASE DESCRIPTION:
${payload.caseDescription}

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
`;

      runLoop(
        participant.getId(),
        message,
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
