
import express from "express";
import cors from "cors";
import { SemanticEvent } from "@mozaik-ai/core";
import { resolveRuntime, sendEvent } from "./runtime.js";
import { COURT_EVENTS } from "./types/courtEvents.js";

export function startApi(caseAnalystId: string) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.post("/api/case", (req, res) => {
    const { caseDescription } = req.body ?? {};

    if (
      typeof caseDescription !== "string" ||
      !caseDescription.trim()
    ) {
      return res.status(400).json({
        error: "caseDescription is required",
      });
    }

    const state = resolveRuntime().state;

    state.currentCase = caseDescription;
    state.caseAnalysis = null;
    state.prosecutionArguments = null;
    state.defenseArguments = null;
    state.evidenceReview = null;

    const event = SemanticEvent.create(
      COURT_EVENTS.CASE_SUBMITTED,
      caseAnalystId,
      { caseDescription }
    );

    sendEvent(event, caseAnalystId);

    return res.status(202).json({
      status: "processing",
      message: "Case submitted successfully",
    });
  });

  app.get("/api/analysis", (_req, res) => {
    const analysis = resolveRuntime().state.caseAnalysis;

    if (!analysis) {
      return res.json({ status: "processing" });
    }

    return res.json({
      status: "done",
      analysis,
    });
  });

  app.listen(3001, () => {
    console.log("API running on http://localhost:3001");
  });
}
