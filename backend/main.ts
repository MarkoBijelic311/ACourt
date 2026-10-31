import "dotenv/config";
import { join } from "./src/runtime.js";

import { createCaseAnalyst } from "./agents/createCaseAnalyst.js";
import { createProsecutionAgent } from "./agents/createProsecutionAgent.js";
import { createDefenseAgent } from "./agents/createDefenseAgent.js";
import { createEvidenceReviewer } from "./agents/createEvidenceReviewer.js";
import { createJudgeAgent } from "./agents/createJudgeAgent.js";

import { caseAnalystHandler } from "./handlers/caseAnalystHandler.js";
import { prosecutionHandler } from "./handlers/prosecutionHandler.js";
import { defenseHandler } from "./handlers/defenseHandler.js";
import { evidenceReviewerHandler } from "./handlers/evidenceReviewerHandler.js";
import { judgeHandler } from "./handlers/judgeHandler.js";

import { courtObserver } from "./agents/observe.js";

import { startApi } from "./api.js";

async function main() {
  const caseAnalyst = createCaseAnalyst([caseAnalystHandler]);
  const prosecution = createProsecutionAgent([prosecutionHandler]);
  const defense = createDefenseAgent([defenseHandler]);
  const evidenceReviewer = createEvidenceReviewer([
    evidenceReviewerHandler,
  ]);
  const judge = createJudgeAgent([judgeHandler]);

  await join(caseAnalyst);
  await join(prosecution);
  await join(defense);
  await join(evidenceReviewer);
  await join(judge);
  await join(courtObserver);

  console.log("ACourt agents registered successfully.");

  startApi(caseAnalyst.getId());
}

main().catch(console.error);