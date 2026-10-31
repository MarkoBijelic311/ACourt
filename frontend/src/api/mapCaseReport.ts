import type {
  CaseArguments,
  CaseAnalysis,
  CaseClosing,
  CaseEvidence,
  CaseInput,
  CaseReport,
  ChargeEntry,
  Exhibit,
  Verdict,
} from "../types";
import type {
  BackendAgentArguments,
  BackendCaseAnalysis,
  BackendEvidenceReview,
  BackendJudgmentReport,
} from "./backendTypes";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function romanize(index: number): string {
  return ROMAN[index] ?? String(index + 1);
}

/**
 * The backend's CaseAnalysis has no "charges" concept — it has
 * allegationsAndAssumptions (plain strings). Each one becomes a charge entry;
 * the strongest-sounding one (first) is circled, matching the original design.
 */
function mapCharges(analysis: BackendCaseAnalysis): ChargeEntry[] {
  if (analysis.allegationsAndAssumptions.length === 0) {
    return [
      {
        mark: "—",
        title: "No Allegations Identified",
        description:
          "The Case Analyst agent did not list any specific allegations or assumptions for this matter.",
      },
    ];
  }

  return analysis.allegationsAndAssumptions.map((text, i) => ({
    mark: romanize(i),
    title: `Allegation ${i + 1}`,
    description: text,
    circled: i === 0,
  }));
}

/**
 * The backend provides no dated timeline at all. We say so explicitly instead
 * of rendering a blank section.
 */
function mapTimeline(): CaseAnalysis["timeline"] {
  return [
    {
      date: "—",
      event: "No dated timeline was provided by the Case Analyst agent for this case.",
    },
  ];
}

export function mapCaseAnalysis(analysis: BackendCaseAnalysis): CaseAnalysis {
  const summaryParagraphs = [analysis.caseOverview];

  if (analysis.establishedFacts.length > 0) {
    summaryParagraphs.push(`Established facts: ${analysis.establishedFacts.join("; ")}.`);
  }

  if (analysis.keyIssues.length > 0) {
    summaryParagraphs.push(`Key issues for the court: ${analysis.keyIssues.join("; ")}.`);
  }

  return {
    summaryParagraphs,
    charges: mapCharges(analysis),
    timeline: mapTimeline(),
  };
}

/**
 * Exhibits come from the Case Analyst's raw evidenceItems (closest backend
 * concept to "exhibits"). Chain-of-custody fields come from the Evidence
 * Reviewer's overall assessment, since the backend has no literal custody
 * concept — the reviewer's sign-off stands in for it.
 */
export function mapCaseEvidence(
  analysis: BackendCaseAnalysis,
  evidenceReview: BackendEvidenceReview | null
): CaseEvidence {
  const exhibits: Exhibit[] =
    analysis.evidenceItems.length > 0
      ? analysis.evidenceItems.map((item, i) => ({
          kind: "document" as const,
          label: `Exhibit ${String.fromCharCode(65 + (i % 26))}`,
          caption: item.description,
          byline: item.source || "Source not specified",
          excerpt:
            item.relevance +
            (item.limitations.length > 0 ? ` (Limitations: ${item.limitations.join("; ")})` : ""),
        }))
      : [
          {
            kind: "document" as const,
            label: "Exhibit —",
            caption: "No evidence items were identified by the Case Analyst agent.",
            byline: "",
            excerpt: "",
          },
        ];

  const custodyStatus = evidenceReview?.overallAssessment
    ? evidenceReview.overallAssessment
    : "Evidence review pending or unavailable.";

  const custodyMeta = evidenceReview
    ? `Logged by Evidence Reviewer Agent · ${evidenceReview.unsupportedClaims.length} unsupported claim(s), ${evidenceReview.missingEvidence.length} missing item(s) noted.`
    : "Logged by Evidence Reviewer Agent · review not yet available.";

  return { exhibits, custodyStatus, custodyMeta };
}

function mapBrief(
  side: BackendAgentArguments | null,
  kicker: string,
  heading: string,
  rebuttalHeading: string
): CaseArguments["prosecution"] {
  if (!side || side.arguments.length === 0) {
    return {
      kicker,
      heading,
      points: [
        {
          text: `No arguments were submitted by the ${heading.toLowerCase()} for this case.`,
        },
      ],
      rebuttalHeading,
      rebuttalText: "No rebuttal was recorded.",
    };
  }

  const points = side.arguments.map((arg) => ({
    text: arg.reasoning ? `${arg.claim} — ${arg.reasoning}` : arg.claim,
    cite: arg.evidenceIds.length > 0 ? arg.evidenceIds.join(", ") : undefined,
  }));

  const counterArguments = side.arguments.flatMap((arg) => arg.counterArguments);
  const rebuttalText =
    counterArguments.length > 0
      ? counterArguments.join(" ")
      : "No anticipated counterarguments were recorded for this side.";

  return { kicker, heading, points, rebuttalHeading, rebuttalText };
}

export function mapCaseArguments(
  prosecution: BackendAgentArguments | null,
  defense: BackendAgentArguments | null
): CaseArguments {
  return {
    prosecution: mapBrief(
      prosecution,
      "On behalf of the Complainant",
      "Prosecution",
      "In Reply to the Defense"
    ),
    defense: mapBrief(
      defense,
      "On behalf of the Defendant",
      "Defense",
      "In Reply to the Prosecution"
    ),
  };
}

/**
 * The backend has no dedicated "closing statement" entity or endpoint — the
 * Judge agent's write-up (summary / evidence assessment / conclusion) is
 * reused as the closing statement text, since it's the closest equivalent.
 */
export function mapCaseClosing(judgment: BackendJudgmentReport): CaseClosing {
  const paragraphs = [judgment.caseSummary, judgment.evidenceAssessment, judgment.conclusion].filter(
    (p): p is string => Boolean(p && p.trim())
  );

  return {
    paragraphs:
      paragraphs.length > 0
        ? paragraphs
        : ["The court has reviewed the matter in full, but no closing narrative was provided."],
  };
}

/**
 * If neither side produced a single argument, the filing gave the agents
 * nothing to work with — there's no real case to render a verdict on, so we
 * flag it distinctly rather than passing through whatever the Judge agent
 * guessed at from empty input.
 */
export function mapVerdict(
  judgment: BackendJudgmentReport,
  prosecution: BackendAgentArguments | null,
  defense: BackendAgentArguments | null
): Verdict {
  const prosecutionEmpty = !prosecution || prosecution.arguments.length === 0;
  const defenseEmpty = !defense || defense.arguments.length === 0;

  if (prosecutionEmpty && defenseEmpty) {
    return "UNABLE_TO_ADJUDICATE";
  }

  return judgment.verdict;
}

export function buildCaseReport(
  input: CaseInput,
  analysis: BackendCaseAnalysis,
  prosecution: BackendAgentArguments | null,
  defense: BackendAgentArguments | null,
  evidenceReview: BackendEvidenceReview | null,
  judgment: BackendJudgmentReport
): CaseReport {
  return {
    input,
    analysis: mapCaseAnalysis(analysis),
    evidence: mapCaseEvidence(analysis, evidenceReview),
    arguments: mapCaseArguments(prosecution, defense),
    closing: mapCaseClosing(judgment),
    verdict: mapVerdict(judgment, prosecution, defense),
  };
}
