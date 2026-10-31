# AI Agent Court

A playful AI-judged "court" app. A React/Vite frontend lets you file a case against a defendant; a Node/TypeScript backend runs it through a 5-agent pipeline — **Case Analyst → Prosecution → Defense → Evidence Reviewer → Judge** — each a separate Claude call via `@mozaik-ai/core`, and returns a real verdict: `GUILTY`, `NOT_GUILTY`, or `INSUFFICIENT_EVIDENCE`.

## Prerequisites

- Node.js (v18+) and npm
- An Anthropic API key with access to `claude-sonnet-4-6`, **or** credentials for a Mozaik Cloud gateway project (see below) — the backend needs one or the other to actually run the agents

## Project structure

```
backend/    Express API + the 5-agent pipeline (port 3001)
frontend/   React/Vite app (port 5173)
```

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```bash
# Required — either a real Anthropic key:
ANTHROPIC_API_KEY=sk-ant-...

# ...or, if routing through a Mozaik Cloud gateway project instead:
ANTHROPIC_API_KEY=<your Mozaik gateway key>
ANTHROPIC_BASE_URL=https://api.app.jigjoy.ai/gateway/anthropic
MOZAIK_API_KEY=<your Mozaik API key>
MOZAIK_PROJECT_ID=<your Mozaik project id>
```

Only `ANTHROPIC_API_KEY` is strictly required. Omit `ANTHROPIC_BASE_URL` to call Anthropic directly; set it (plus the two `MOZAIK_*` vars) to route through a Mozaik gateway project instead — useful for shared projects, but note its daily token quota is scoped to the Mozaik project/account, not the individual key.

There's no `dev`/`start` script in `backend/package.json`, so run it directly with `tsx` (already a dependency):

```bash
npx tsx main.ts
```

You should see:
```
ACourt agents registered successfully.
API running on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
```

`frontend/.env` (see `.env.example`) should already point at the backend:
```bash
VITE_API_URL=http://localhost:3001
```

Run it:
```bash
npm run dev
```

Open **http://localhost:5173**.

### 3. Run both together

Two terminals — one running `npx tsx main.ts` in `backend/`, one running `npm run dev` in `frontend/`. Both need to stay up while you use the app.

**Note:** the backend holds a single global case slot (not per-session) — don't submit a second case while one is still processing, and don't test through the UI and via a direct API call at the same time, or they'll collide. A full run through all 5 agents takes roughly 1.5–2 minutes.

## Writing a case that reaches a clear verdict

The Judge agent holds a high bar — a thin or ambiguous case lands on `INSUFFICIENT_EVIDENCE` rather than guessing. Use these templates to reliably get `GUILTY` or `NOT_GUILTY` instead, verified against real runs.

### Template for `GUILTY`

```
Defendant: [Name]

Alleged Conduct: [Evidence type: e.g. "Security camera footage" / "Witnesses"]
captured/saw [Defendant] committing [the act] directly — the act itself, not
just before or after it — on [date] at [location]. The victim was identified
as [Victim name], and [authority, e.g. "the medical examiner" / "police report"]
confirmed [outcome/harm]. [Defendant] was arrested and gave a recorded
confession, admitting to [the act]. [Physical/forensic evidence] was recovered
and confirmed to match. [Defendant] has not claimed self-defense, an alibi,
or any other justification.
```

**Checklist — all 7 required:**
1. Evidence of the **act itself** (not just before/after it)
2. Defendant clearly **identified** (named, face/identity confirmed)
3. Victim **named**
4. An **authority** confirms the outcome (examiner, official report)
5. A **confession**
6. **Forensic/physical evidence** recovered and matched
7. **No defense angle** mentioned (no alibi, no self-defense, no alternate suspect)

### Template for `NOT_GUILTY`

Needs *affirmative* proof of innocence — not just a thin prosecution case.

```
Defendant: [Name]

Alleged Conduct: [Defendant] was accused of [the act] on [date] at [location].
However, [alibi evidence — e.g. timestamped footage/records] places [Defendant]
at [a different location] during the exact window of the incident, confirmed
independently by [multiple named witnesses]. [Investigators] later identified
and recovered [the evidence/item] from [a different named person], who was
found in possession of it and confessed. [Defendant] has no connection to
[that person] and was never in possession of [the item/evidence].
```

**Checklist — all 4 required:**
1. A **corroborated alibi** (timestamped evidence + independent witnesses)
2. Alibi places the defendant **elsewhere during the exact window**
3. The **actual perpetrator identified** — caught with the evidence, and confessed
4. Explicit statement defendant has **no connection** to the real perpetrator/evidence

### What reliably causes `INSUFFICIENT_EVIDENCE` (avoid these)

- Evidence placed *near* the act (an argument beforehand, ownership of a weapon) but not *of* the act itself
- Victim or perpetrator left **unnamed**
- No confession and no statement from the defendant either way
- Eyewitness ID under challengeable conditions (nighttime, no stated procedure)
- Any single missing piece from the checklists above — the Judge treats gaps strictly, not generously

### Other verdict states

- `INSUFFICIENT_EVIDENCE` and `UNABLE_TO_ADJUDICATE` (filing with no real arguments on either side) each render with their own distinct stamp — see `frontend/src/components/VerdictStamp.tsx`.
- The form rejects submissions where the Alleged Conduct field is under 6 words or doesn't look like a real English sentence (see `frontend/src/pages/DeskPage.tsx`) before they ever reach the backend.

## Troubleshooting

- **Backend crashes on submit:** each agent handler retries once/twice on a malformed model response, and the server won't crash outright on a failed inference call (timeout, rate limit) — but if you still see it die, check the terminal log for the actual error.
- **Stuck on "processing" forever:** usually means a Mozaik/Anthropic rate limit was hit mid-run with no retries left. Restart the backend (`npx tsx main.ts`) to clear the stuck state and try again.
- **"Could not reach the court backend" on the form:** the backend isn't running, or isn't on the port `VITE_API_URL` points to.
