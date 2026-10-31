
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

      // 1. Obrada odgovora Judge agenta
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
          parsedJudgment = JSON.parse(cleanedAnswer);
        } catch (error) {
          console.log("Judge returned invalid JSON.");
          console.log("PARSER ERROR:", error);
          console.log("RAW JUDGE RESPONSE:", content.text);
          return;
        }

        // Provera dozvoljenih presuda
        const validVerdicts = [
          "GUILTY",
          "NOT_GUILTY",
          "INSUFFICIENT_EVIDENCE",
        ];

        if (!validVerdicts.includes(parsedJudgment.verdict)) {
          console.log("Judge returned an invalid verdict.");
          console.log("RAW JUDGE RESPONSE:", content.text);
          return;
        }

        // Provera strukture presude
        if (
          typeof parsedJudgment.caseSummary !== "string" ||
          !Array.isArray(parsedJudgment.prosecutionArguments) ||
          !Array.isArray(parsedJudgment.defenseArguments) ||
          typeof parsedJudgment.evidenceAssessment !== "string" ||
          !Array.isArray(parsedJudgment.contradictions) ||
          typeof parsedJudgment.conclusion !== "string" ||
          !Array.isArray(
            parsedJudgment.uncertaintiesAndMissingInformation
          )
        ) {
          console.log("Judge returned an invalid judgment structure.");
          console.log("RAW JUDGE RESPONSE:", content.text);
          return;
        }

        // Čuvanje presude u zajedničkom stanju
        const state = resolveRuntime().state;

        state.judgment = parsedJudgment;

        console.log("Judge completed the judgment.");
        console.log("FINAL VERDICT:", parsedJudgment.verdict);

        // Slanje događaja o završenoj presudi
        const completedEvent = SemanticEvent.create(
          COURT_EVENTS.JUDGMENT_COMPLETED,
          participant.getId(),
          { judgment: parsedJudgment }
        );

        sendEvent(completedEvent, participant.getId());

        return;
      }

      // 2. Obrada završetka Evidence Review-a

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

      const message = `
You are the Judge Agent in the ACourt system.

Evaluate the following case using all information provided.

CASE DESCRIPTION:
${state.currentCase}

CASE ANALYSIS:
${JSON.stringify(state.caseAnalysis, null, 2)}

PROSECUTION ARGUMENTS:
${JSON.stringify(state.prosecutionArguments, null, 2)}

DEFENSE ARGUMENTS:
${JSON.stringify(state.defenseArguments, null, 2)}

EVIDENCE REVIEW:
${JSON.stringify(state.evidenceReview, null, 2)}

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
`;

      console.log("Judge started evaluating the case.");

      runLoop(participant.getId(), message, {
        model: "claude-sonnet-4-6",
        context: participant.getMemory().getContext(),
        maxOutputTokens: 4096,
        streaming: false,
      });
    },
  },
};
