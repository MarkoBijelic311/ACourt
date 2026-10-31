# AI Agent Court — Frontend

React + Vite frontend for the AI Agent Court demo. Connects to the backend's agent pipeline (Case Analyst → Prosecution → Defense → Evidence Reviewer → Judge) at `VITE_API_URL`.

## Running locally

```bash
npm install
npm run dev
```

Requires the backend running separately (see its own setup) and `VITE_API_URL` set in `.env` (see `.env.example`).

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

- `INSUFFICIENT_EVIDENCE` and `UNABLE_TO_ADJUDICATE` (filing with no real arguments on either side) each render with their own distinct stamp — see `src/components/VerdictStamp.tsx`.
- The form rejects submissions where the Alleged Conduct field is under 6 words or doesn't look like a real English sentence (see `src/pages/DeskPage.tsx`) before they ever reach the backend.
