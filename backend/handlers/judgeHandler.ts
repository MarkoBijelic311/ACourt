import {
  Agent,
  SemanticEvent,
  SituationSpecification,
  type SituationContext,
  type SituationHandler,
} from "@mozaik-ai/core";

import { COURT_EVENTS } from "../types/courtEvents.js";
import type { JudgmentReport } from "../types/judgment.js";

import {
  resolveRuntime,
  runLoop,
  sendEvent,
} from "../src/runtime.js";

const MAX_RETRIES = 2;
let judgeRetryCount = 0;

const VALID_VERDICTS = ["GUILTY", "NOT_GUILTY", "INSUFFICIENT_EVIDENCE"];

function buildJudgePrompt(
  currentCase: string,
  caseAnalysis: unknown,
  prosecutionArguments: unknown,
  defenseArguments: unknown,
  evidenceReview: unknown,
  retry: boolean
): string {
  const retryNotice = retry
    ? `\nYour previous response could not be parsed as valid JSON, had an invalid verdict, or was missing required fields (it may also have been truncated before the closing brace). This time, return ONLY the JSON object — no markdown fences, no commentary before or after, and make sure every bracket is closed. Keep "conclusion" and "evidenceAssessment" concise so the full response fits comfortably within the output limit.\n`
    : "";

  return `
You are the Judge Agent in the ACourt system.

Evaluate the following case using all information provided.

CASE DESCRIPTION:
${currentCase}

CASE ANALYSIS:
${JSON.stringify(caseAnalysis, null, 2)}

PROSECUTION ARGUMENTS:
${JSON.stringify(prosecutionArguments, null, 2)}

DEFENSE ARGUMENTS:
${JSON.stringify(defenseArguments, null, 2)}

EVIDENCE REVIEW:
${JSON.stringify(evidenceReview, null, 2)}
${retryNotice}
Your task is to produce an impartial and reasoned judgment.

You MUST select exactly one verdict:

- GUILTY
- NOT_GUILTY
- INSUFFICIENT_EVIDENCE

Evaluate the evidence and arguments objectively.
Do not invent facts or evidence.

Return ONLY valid JSON with this exact structure:

{
  "verdict": "INSUFFICIENT_EVIDENCE",
  "caseSummary": "Case summary",
  "prosecutionArguments": [],
  "defenseArguments": [],
  "evidenceAssessment": "Evidence assessment",
  "contradictions": [],
  "conclusion": "Reasoned conclusion",
  "uncertaintiesAndMissingInformation": []
}

Be concise: limit "prosecutionArguments", "defenseArguments", "contradictions" and "uncertaintiesAndMissingInformation" to at most 4 items each, and keep "caseSummary", "evidenceAssessment" and "conclusion" each to at most 3-4 sentences.
`;
}

function isValidJudgment(value: unknown): value is JudgmentReport {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.verdict === "string" &&
    VALID_VERDICTS.includes(v.verdict) &&
    typeof v.caseSummary === "string" &&
    Array.isArray(v.prosecutionArguments) &&
    Array.isArray(v.defenseArguments) &&
    typeof v.evidenceAssessment === "string" &&
    Array.isArray(v.contradictions) &&
    typeof v.conclusion === "string" &&
    Array.isArray(v.uncertaintiesAndMissingInformation)
  );
}

class WhenEvidenceReviewIsCompleted extends SituationSpecification {
  isSatisfiedBy({ event, participant }: SituationContext): boolean {
    if (event.type === "model.answer") {
      return (
        participant instanceof Agent &&
        event.producerId === participant.getId()
      );
    }

    return (
      event.type === COURT_EVENTS.EVIDENCE_REVIEW_COMPLETED &&
      participant instanceof Agent &&
      event.producerId !== participant.getId()
    );
  }
}

export const judgeHandler: SituationHandler = {
  specification: new WhenEvidenceReviewIsCompleted(),

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

        let parsedJudgment: JudgmentReport;

        try {
          const parsed = JSON.parse(cleanedAnswer);

          if (!isValidJudgment(parsed)) {
            throw new Error("invalid structure or verdict");
          }

          parsedJudgment = parsed;
        } catch {
          const state = resolveRuntime().state;

          if (
            !state.currentCase ||
            !state.caseAnalysis ||
            !state.prosecutionArguments ||
            !state.defenseArguments ||
            !state.evidenceReview
          ) {
            console.log(
              "Judge returned invalid JSON and required case data is missing; cannot retry."
            );
            return;
          }

          if (judgeRetryCount >= MAX_RETRIES) {
            console.log(
              `Judge returned invalid JSON after ${MAX_RETRIES} retries. Giving up — case is stuck.`
            );
            console.log("RAW JUDGE RESPONSE:", content.text);
            return;
          }

          judgeRetryCount += 1;
          console.log(
            `Judge returned invalid JSON, invalid verdict, or an invalid structure. Retrying (${judgeRetryCount}/${MAX_RETRIES})...`
          );

          runLoop(
            participant.getId(),
            buildJudgePrompt(
              state.currentCase,
              state.caseAnalysis,
              state.prosecutionArguments,
              state.defenseArguments,
              state.evidenceReview,
              true
            ),
            {
              model: "claude-sonnet-4-6",
              context: participant.getMemory().getContext(),
              maxOutputTokens: 4096,
              streaming: false,
            }
          );

          return;
        }

        judgeRetryCount = 0;

        const state = resolveRuntime().state;

        state.judgment = parsedJudgment;

        console.log("Judge completed the judgment.");
        console.log("FINAL VERDICT:", parsedJudgment.verdict);

        const completedEvent = SemanticEvent.create(
          COURT_EVENTS.JUDGMENT_COMPLETED,
          participant.getId(),
          { judgment: parsedJudgment }
        );

        sendEvent(completedEvent, participant.getId());

        return;
      }

      const state = resolveRuntime().state;

      if (
        !state.currentCase ||
        !state.caseAnalysis ||
        !state.prosecutionArguments ||
        !state.defenseArguments ||
        !state.evidenceReview
      ) {
        console.log(
          "Judge cannot start: required case data is missing."
        );
        return;
      }

      judgeRetryCount = 0;

      console.log("Judge started evaluating the case.");

      runLoop(
        participant.getId(),
        buildJudgePrompt(
          state.currentCase,
          state.caseAnalysis,
          state.prosecutionArguments,
          state.defenseArguments,
          state.evidenceReview,
          false
        ),
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
