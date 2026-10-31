
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

const MAX_RETRIES = 2;
let evidenceReviewerRetryCount = 0;

function buildEvidenceReviewerPrompt(
  caseAnalysis: unknown,
  prosecutionArguments: unknown,
  defenseArguments: unknown,
  retry: boolean
): string {
  const retryNotice = retry
    ? `\nYour previous response could not be parsed as JSON (it was either malformed, truncated before the closing brace, or missing required fields). This time, return ONLY the JSON object — no markdown fences, no commentary before or after, and make sure every bracket is closed. Keep explanations concise so the full response fits comfortably within the output limit.\n`
    : "";

  return `
You are the Evidence Reviewer in a court simulation.

Your role is to independently evaluate the evidence and arguments presented by both sides.

CASE ANALYSIS:
${JSON.stringify(caseAnalysis, null, 2)}

PROSECUTION ARGUMENTS:
${JSON.stringify(prosecutionArguments, null, 2)}

DEFENSE ARGUMENTS:
${JSON.stringify(defenseArguments, null, 2)}
${retryNotice}
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
Limit "unsupportedClaims", "missingEvidence" and "recommendations" to at most 4 items each, and "overallAssessment" to 2-3 sentences.
`;
}

function isValidEvidenceReview(value: unknown): value is EvidenceReview {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.reviewedClaims) &&
    Array.isArray(v.contradictions) &&
    Array.isArray(v.unsupportedClaims) &&
    Array.isArray(v.missingEvidence) &&
    typeof v.overallAssessment === "string" &&
    Array.isArray(v.recommendations)
  );
}

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
          const parsed = JSON.parse(cleanedAnswer);

          if (!isValidEvidenceReview(parsed)) {
            throw new Error("invalid structure");
          }

          parsedReview = parsed;
        } catch {
          const state = resolveRuntime().state;

          if (
            !state.caseAnalysis ||
            !state.prosecutionArguments ||
            !state.defenseArguments
          ) {
            console.log(
              "Evidence Reviewer returned invalid JSON and required case data is missing; cannot retry."
            );
            return;
          }

          if (evidenceReviewerRetryCount >= MAX_RETRIES) {
            console.log(
              `Evidence Reviewer returned invalid JSON after ${MAX_RETRIES} retries. Giving up — case is stuck.`
            );
            console.log("RAW EVIDENCE REVIEWER RESPONSE:", content.text);
            return;
          }

          evidenceReviewerRetryCount += 1;
          console.log(
            `Evidence Reviewer returned invalid/truncated JSON. Retrying (${evidenceReviewerRetryCount}/${MAX_RETRIES})...`
          );

          runLoop(
            participant.getId(),
            buildEvidenceReviewerPrompt(
              state.caseAnalysis,
              state.prosecutionArguments,
              state.defenseArguments,
              true
            ),
            {
              model: "claude-sonnet-4-6",
              context: participant.getMemory().getContext(),
              maxOutputTokens: 8192,
              streaming: false,
            }
          );

          return;
        }

        evidenceReviewerRetryCount = 0;

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
      evidenceReviewerRetryCount = 0;

      runLoop(
        participant.getId(),
        buildEvidenceReviewerPrompt(
          state.caseAnalysis,
          state.prosecutionArguments,
          defenseArguments,
          false
        ),
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
