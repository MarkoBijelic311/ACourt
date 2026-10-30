
import { join } from "./runtime.js";

import { createCaseAnalyst } from "./agents/createCaseAnalyst.js";
import { createProsecutionAgent } from "./agents/createProsecutionAgent.js";
import { createDefenseAgent } from "./agents/createDefenseAgent.js";
import { createEvidenceReviewer } from "./agents/createEvidenceReviewer.js";

import { caseAnalystHandler } from "./handlers/caseAnalystHandler.js";
import { prosecutionHandler } from "./handlers/prosecutionHandler.js";
import { defenseHandler } from "./handlers/defenseHandler.js";
import { evidenceReviewerHandler } from "./handlers/evidenceReviewerHandler.js";

import { startApi } from "./api.js";

async function main() {
  const caseAnalyst = createCaseAnalyst([caseAnalystHandler]);
  const prosecution = createProsecutionAgent([prosecutionHandler]);
  const defense = createDefenseAgent([defenseHandler]);
  const evidenceReviewer = createEvidenceReviewer([
    evidenceReviewerHandler,
  ]);

  await join(caseAnalyst);
  await join(prosecution);
  await join(defense);
  await join(evidenceReviewer);

  console.log("ACourt agents registered successfully.");

  startApi(caseAnalyst.getId());
}

main().catch(console.error);
