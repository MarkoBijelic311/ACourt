
export interface CaseEvidence {
  id: string;
  description: string;
  source: string;
  relevance: string;
  limitations: string[];
}

export interface CaseAnalysis {
  caseOverview: string;

  involvedParties: {
    name: string;
    role: string;
    interests: string[];
  }[];

  establishedFacts: string[];

  allegationsAndAssumptions: string[];

  evidenceItems: CaseEvidence[];

  keyIssues: string[];

  contradictions: string[];

  strengthsAndWeaknesses: {
    prosecution: string[];
    defense: string[];
  };

  missingInformation: string[];

  questionsForTheCourt: string[];
}
