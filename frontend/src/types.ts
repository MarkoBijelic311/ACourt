export interface CaseInput {
  name: string;
  conduct: string;
}

export interface TimelineEntry {
  date: string;
  event: string;
}

export interface ChargeEntry {
  mark: string;
  title: string;
  description: string;
  circled?: boolean;
}

export interface CaseAnalysis {
  summaryParagraphs: string[];
  charges: ChargeEntry[];
  timeline: TimelineEntry[];
}

export interface ExhibitPhoto {
  kind: "photo";
  label: string;
  caption: string;
  imageAlt: string;
}

export interface ExhibitDocument {
  kind: "document";
  label: string;
  caption: string;
  byline: string;
  excerpt: string;
  noReply?: boolean;
}

export type Exhibit = ExhibitPhoto | ExhibitDocument;

export interface CaseEvidence {
  exhibits: Exhibit[];
  custodyStatus: string;
  custodyMeta: string;
}

export interface ArgumentPoint {
  text: string;
  cite?: string;
}

export interface ArgumentBrief {
  kicker: string;
  heading: string;
  points: ArgumentPoint[];
  rebuttalHeading: string;
  rebuttalText: string;
}

export interface CaseArguments {
  prosecution: ArgumentBrief;
  defense: ArgumentBrief;
}

export interface CaseClosing {
  paragraphs: string[];
}

export type Verdict = "GUILTY" | "NOT_GUILTY" | "INSUFFICIENT_EVIDENCE" | "UNABLE_TO_ADJUDICATE";

export interface CaseReport {
  input: CaseInput;
  analysis: CaseAnalysis;
  evidence: CaseEvidence;
  arguments: CaseArguments;
  closing: CaseClosing;
  verdict: Verdict;
}
