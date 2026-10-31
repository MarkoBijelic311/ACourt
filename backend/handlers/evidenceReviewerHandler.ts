
import {
  Agent,
  SemanticEvent,
  SituationSpecification,
  type SituationContext,
  type SituationHandler,
} from "@mozaik-ai/core";

import { COURT_EVENTS } from "../types/courtEvents.js";
import type { AgentArguments } from "../types/arguments.js";
import type { EvidenceReview } from "../types/evidenceReview.js";
import { resolveRuntime, runLoop, sendEvent } from "../src/runtime.js";

class WhenDefenseArgumentsAreSubmitted extends SituationSpecification {
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
      payload.presentedBy === "Defense" &&
      "arguments" in payload
    );
  }
}

export const evidenceReviewerHandler: SituationHandler = {
  specification: new WhenDefenseArgumentsAreSubmitted(),

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

        let parsedReview: EvidenceReview;

        try {
          parsedReview = JSON.parse(cleanedAnswer);
        } catch (error) {
          console.log("Evidence Reviewer returned invalid JSON.");
          console.log("PARSER ERROR:", error);
          console.log("RAW CLAUDE RESPONSE:", content.text);
          return;
        }

        if (
          !Array.isArray(parsedReview.reviewedClaims) ||
          !Array.isArray(parsedReview.contradictions) ||
          !Array.isArray(parsedReview.unsupportedClaims) ||
          !Array.isArray(parsedReview.missingEvidence) ||
          typeof parsedReview.overallAssessment !== "string" ||
          !Array.isArray(parsedReview.recommendations)
        ) {
          console.log("Evidence Reviewer returned an invalid review structure.");
          console.log("RAW CLAUDE RESPONSE:", content.text);
          return;
        }

        const state = resolveRuntime().state;

        state.evidenceReview = parsedReview;

        console.log("Evidence review completed.");

        const completedEvent = SemanticEvent.create(
          COURT_EVENTS.EVIDENCE_REVIEW_COMPLETED,
          participant.getId(),
          {
            review: parsedReview,
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
        payload.presentedBy !== "Defense" ||
        !("arguments" in payload)
      ) {
        return;
      }

      const state = resolveRuntime().state;

      if (!state.caseAnalysis || !state.prosecutionArguments) {
        console.log("Required case data is not available.");
        return;
      }

      const defenseArguments = payload.arguments as AgentArguments;

      state.defenseArguments = defenseArguments;

      const message = `
You are the Evidence Reviewer in a court simulation.

Your role is to independently evaluate the evidence and arguments presented by both sides.

CASE ANALYSIS:
${JSON.stringify(state.caseAnalysis, null, 2)}

PROSECUTION ARGUMENTS:
${JSON.stringify(state.prosecutionArguments, null, 2)}

DEFENSE ARGUMENTS:
${JSON.stringify(defenseArguments, null, 2)}

Your tasks:
1. Evaluate the relevance and reliability of each piece of evidence.
2. Identify contradictions between the evidence and the arguments.
3. Identify unsupported claims made by either side.
4. Identify missing information and limitations of the available evidence.
5. Assess the strengths and weaknesses of both sides.
6. Provide an impartial assessment without favoring either party.

Do not invent facts, evidence, sources or legal conclusions.
Clearly distinguish established facts from allegations and assumptions.

Return only valid JSON matching this exact structure:

{
  "reviewedClaims": [
    {
      "argumentId": "ARG-1",
      "claim": "The claim being reviewed",
      "presentedBy": "Prosecutor",
      "status": "Supported",
      "supportingEvidenceIds": [],
      "explanation": "Explanation of the assessment"
    }
  ],
  "contradictions": [
    {
      "description": "Description of the contradiction",
      "relatedEvidenceIds": [],
      "affectedClaims": []
    }
  ],
  "unsupportedClaims": [],
  "missingEvidence": [],
  "overallAssessment": "Overall impartial assessment",
  "recommendations": []
}

The status must be one of:
"Supported", "Partially supported", "Unsupported", "Contradicted".

The presentedBy value must be either "Prosecutor" or "Defense".

Use empty arrays when there are no items in a category.
Keep the entire response concise.
Each explanation must contain no more than 2 short sentences.
Do not repeat information.
Do not include lengthy legal analysis.
Return compact JSON and make sure every bracket is properly closed.
`;

      runLoop(
        participant.getId(),
        message,
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
