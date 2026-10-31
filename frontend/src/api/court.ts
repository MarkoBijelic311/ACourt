import type { CaseInput, CaseReport, Verdict } from "../types";

const MOCK_DELAY_MS = 3000;

function buildReport(input: CaseInput, verdict: Verdict): CaseReport {
  return {
    input,
    analysis: {
      summaryParagraphs: [
        "On the evening in question, the Defendant is alleged to have engaged in conduct inconsistent with the standards of good‑faith dealing described in the original filing. The Analyst Agent reviewed the submitted account and cross‑referenced the available correspondence, finding ==no immediate contradictions== within the Complainant's narrative.",
        "Three points of fact were extracted for consideration: the timing of the alleged conduct, the parties present at the time, and the ==absence of any prior resolution attempt== between the two parties.",
      ],
      charges: [
        {
          mark: "I",
          title: "Breach of Good Faith",
          description: "failure to engage in good‑faith resolution prior to escalation.",
        },
        {
          mark: "✓",
          title: "Pattern of Disregard",
          description: "repeated conduct despite prior notice to the Defendant.",
          circled: true,
        },
        {
          mark: "III",
          title: "Undue Delay",
          description: "failure to respond within a reasonable time.",
        },
      ],
      timeline: [
        { date: "Oct 14", event: "Initial disagreement reported by the Complainant." },
        { date: "Oct 19", event: "Defendant allegedly repeats the conduct in a written exchange." },
        { date: "Oct 22", event: "Complainant requests resolution; ==no response recorded==." },
        { date: "Oct 31", event: "Case formally filed with the Court." },
      ],
    },
    evidence: {
      exhibits: [
        {
          kind: "photo",
          label: "Exhibit A",
          caption: "Scene photograph, taken Oct 14 — cup overturned, chairs disturbed.",
          imageAlt:
            "Polaroid-style evidence photograph of an empty conference table, a chair pushed back, and a coffee cup knocked over with liquid spilled across the surface.",
        },
        {
          kind: "document",
          label: "Exhibit B",
          caption: "Excerpt from the Defendant's message, entered in full under seal.",
          byline: "Written exchange · Oct 19",
          excerpt:
            "“…I told you already, I'm not doing this again the same way. Don't expect me to wait around—”",
        },
        {
          kind: "document",
          label: "Exhibit C",
          caption: "Complainant's final request. Left unanswered for nine days.",
          byline: "Resolution request · Oct 22",
          excerpt: "“I'm asking one more time that we settle this properly before it goes further.”",
          noReply: true,
        },
      ],
      custodyStatus: "Unbroken — sealed",
      custodyMeta:
        "Logged by Evidence Agent, 10/31/2026 14:02. Exhibits A–C retained in the digital locker.",
    },
    arguments: {
      prosecution: {
        kicker: "On behalf of the Complainant",
        heading: "Prosecution",
        points: [
          { text: "The record shows a documented pattern, not an isolated incident.", cite: "Exhibit B" },
          { text: "No attempt at resolution was made despite a direct, dated request.", cite: "Exhibit C" },
          { text: "The scene photograph corroborates the timeline exactly as filed.", cite: "Exhibit A" },
        ],
        rebuttalHeading: "In Reply to the Defense",
        rebuttalText:
          "A claim of miscommunication does not account for nine days of unbroken silence following a direct request.",
      },
      defense: {
        kicker: "On behalf of the Defendant",
        heading: "Defense",
        points: [
          { text: "A single heated exchange does not establish a pattern of conduct." },
          { text: "The Complainant's request arrived during an already-acknowledged period of unavailability." },
          { text: "No physical harm or measurable loss has been demonstrated by the record." },
        ],
        rebuttalHeading: "In Reply to the Prosecution",
        rebuttalText:
          "A photograph of a disturbed room is evidence of a disturbed room — not proof of what was said, or by whom.",
      },
    },
    closing: {
      paragraphs: [
        "This tribunal has reviewed the matter in full. The Analyst Agent found the Complainant's account internally consistent; the Evidence Agent entered three exhibits without objection from either party; the Debate Agent heard the Prosecution and the Defense argue the same five days of record to opposite conclusions.",
        "Nothing remains in dispute as to what occurred. What remains is a judgment as to what it means, and what, if anything, is owed.",
        "The panel has heard enough. Let the record show the hearing closed on the 31st of October, 2026, and let judgment follow without further delay.",
      ],
    },
    verdict,
  };
}

/**
 * TODO(backend): replace with a real network call once the service exists, e.g.
 *
 *   export async function runCase(input: CaseInput): Promise<CaseReport> {
 *     const res = await fetch("/api/case", {
 *       method: "POST",
 *       headers: { "Content-Type": "application/json" },
 *       body: JSON.stringify(input),
 *     });
 *     if (!res.ok) throw new Error(`runCase failed: ${res.status}`);
 *     return res.json();
 *   }
 */
export function runCase(input: CaseInput): Promise<CaseReport> {
  const verdict: Verdict = Math.random() < 0.5 ? "GUILTY" : "NOT GUILTY";
  return new Promise((resolve) => {
    setTimeout(() => resolve(buildReport(input, verdict)), MOCK_DELAY_MS);
  });
}
