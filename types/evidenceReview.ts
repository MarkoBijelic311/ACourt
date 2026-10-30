
import type { ArgumentSide } from "./arguments.js";

export type EvidenceSupportStatus =
  | "Supported"
  | "Partially supported"
  | "Unsupported"
  | "Contradicted";

export interface ClaimReview {
  argumentId: string;
  claim: string;
  presentedBy: ArgumentSide;
  status: EvidenceSupportStatus;
  supportingEvidenceIds: string[];
  explanation: string;
}

export interface Contradiction {
  description: string;
  relatedEvidenceIds: string[];
  affectedClaims: string[];
}

export interface EvidenceReview {
  reviewedClaims: ClaimReview[];
  contradictions: Contradiction[];
  unsupportedClaims: string[];
  missingEvidence: string[];
  overallAssessment: string;
  recommendations: string[];
}
