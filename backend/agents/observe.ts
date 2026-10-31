import {
    createAgent,
    SituationSpecification,
    type SituationContext,
    type SituationHandler,
} from "@mozaik-ai/core";

import { courtObserverInstruction } from "../instructions/courtObserverInstruction.js";
import { courtLog } from "./observerLog.js";
import { COURT_EVENTS } from "../types/courtEvents.js";

class WhenCourtEventOccurs extends SituationSpecification {
    isSatisfiedBy({ event, participant }: SituationContext): boolean {
        return (
            event.producerId !== participant.getId() &&
            (
                event.type === "message.sent" ||
                event.type === "model.answer" ||
                event.type === COURT_EVENTS.CASE_SUBMITTED ||
                event.type === COURT_EVENTS.CASE_ANALYSIS_COMPLETED ||
                event.type === COURT_EVENTS.ARGUMENTS_SUBMITTED ||
                event.type === COURT_EVENTS.EVIDENCE_REVIEW_COMPLETED
            )
        );
    }
}

const observerMessageHandler: SituationHandler = {
    specification: new WhenCourtEventOccurs(),

    processor: {
        apply({ event }) {
            courtLog.push({
                eventType: event.type,
                participantId: event.producerId,
                content: event.payload,
                timestamp: new Date().toISOString(),
            });

            console.log(`[CourtObserver] Recorded event: ${event.type}`);
        },
    },
};

export const courtObserver = createAgent({
    name: "CourtObserver",
    capabilities: [],
    instruction: courtObserverInstruction,
    tools: [],
    handlers: [observerMessageHandler],
});
