import type { CaseInput, CaseReport } from "../types";
import type {
  BackendAnalysisResponse,
  BackendArgumentsResponse,
  BackendErrorResponse,
  BackendEvidenceReviewResponse,
  BackendJudgmentResponse,
  BackendStatus,
} from "./backendTypes";
import { buildCaseReport } from "./mapCaseReport";

const API_URL = import.meta.env.VITE_API_URL;

// Agents are slow (sequential LLM calls) — give the whole run plenty of room.
const OVERALL_TIMEOUT_MS = 170_000;
const POLL_INTERVAL_MS = 1500;

export type AgentStage =
  | "Filing the case…"
  | "The Case Analyst is reviewing the filing…"
  | "The Prosecution is preparing arguments…"
  | "The Defense is preparing arguments…"
  | "The Evidence Reviewer is weighing the record…"
  | "The Judge is deliberating…"
  | "Finalizing the case file…";

function stageFromStatus(status: BackendStatus): AgentStage {
  if (!status.caseAnalystCompleted) return "The Case Analyst is reviewing the filing…";
  if (!status.prosecutorCompleted) return "The Prosecution is preparing arguments…";
  if (!status.defenseCompleted) return "The Defense is preparing arguments…";
  if (!status.evidenceReviewerCompleted) return "The Evidence Reviewer is weighing the record…";
  if (!status.judgeCompleted) return "The Judge is deliberating…";
  return "Finalizing the case file…";
}

function buildCaseDescription(input: CaseInput): string {
  return `Defendant: ${input.name}\n\nAlleged Conduct: ${input.conduct}`;
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    throw new Error(`The court returned an unreadable response (${res.status}).`);
  }
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal.aborted) onAbort();
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function pollUntilJudged(
  signal: AbortSignal,
  onProgress?: (stage: AgentStage) => void
): Promise<void> {
  while (true) {
    const res = await fetch(`${API_URL}/api/status`, { signal });
    if (!res.ok) {
      throw new Error(`Could not reach the court for a status update (${res.status}).`);
    }
    const status = await readJson<BackendStatus>(res);
    onProgress?.(stageFromStatus(status));

    if (status.judgeCompleted) return;

    await sleep(POLL_INTERVAL_MS, signal);
  }
}

export async function runCase(
  input: CaseInput,
  onProgress?: (stage: AgentStage) => void
): Promise<CaseReport> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OVERALL_TIMEOUT_MS);

  try {
    onProgress?.("Filing the case…");

    const caseDescription = buildCaseDescription(input);

    const submitRes = await fetch(`${API_URL}/api/case`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseDescription }),
      signal: controller.signal,
    });

    if (!submitRes.ok) {
      const body = await readJson<BackendErrorResponse>(submitRes).catch(() => null);
      throw new Error(body?.error || `Failed to file the case (${submitRes.status}).`);
    }

    await pollUntilJudged(controller.signal, onProgress);

    const [analysisRes, argumentsRes, evidenceRes, judgmentRes] = await Promise.all([
      fetch(`${API_URL}/api/analysis`, { signal: controller.signal }),
      fetch(`${API_URL}/api/arguments`, { signal: controller.signal }),
      fetch(`${API_URL}/api/evidence-review`, { signal: controller.signal }),
      fetch(`${API_URL}/api/judgment`, { signal: controller.signal }),
    ]);

    if (!analysisRes.ok || !argumentsRes.ok || !evidenceRes.ok || !judgmentRes.ok) {
      throw new Error("The court returned an error while fetching the final case file.");
    }

    const [analysisBody, argumentsBody, evidenceBody, judgmentBody] = await Promise.all([
      readJson<BackendAnalysisResponse>(analysisRes),
      readJson<BackendArgumentsResponse>(argumentsRes),
      readJson<BackendEvidenceReviewResponse>(evidenceRes),
      readJson<BackendJudgmentResponse>(judgmentRes),
    ]);

    if (!analysisBody.analysis || !judgmentBody.judgment) {
      throw new Error("The court finished deliberating but did not return a complete case file.");
    }

    return buildCaseReport(
      input,
      analysisBody.analysis,
      argumentsBody.prosecution,
      argumentsBody.defense,
      evidenceBody.evidenceReview ?? null,
      judgmentBody.judgment
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        "The court did not reach a verdict in time. The agents may still be working — please try again."
      );
    }
    if (err instanceof TypeError) {
      throw new Error(
        `Could not reach the court backend at ${API_URL}. Is it running?`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
