import { useRef, useState } from "react";
import type { FormEvent } from "react";
import Desk from "../components/Desk";
import PaperDocument from "../components/PaperDocument";
import BrassButton from "../components/BrassButton";
import VerdictStamp from "../components/VerdictStamp";
import CourtLoader from "../components/CourtLoader";
import type { CaseInput, Verdict } from "../types";
import deskHero from "../assets/desk-hero.png";
import styles from "./DeskPage.module.css";

type DeskPageProps =
  | {
      mode: "form";
      onFileCase: (input: CaseInput) => void;
      error?: string | null;
      initialInput?: CaseInput | null;
    }
  | { mode: "verdict"; input: CaseInput; verdict: Verdict; onNewCase: () => void };

const DESK_ALT =
  "A mahogany judge's desk lit by a brass banker's lamp, with a gavel, inkwell, fountain pen and folders arranged on a leather blotter.";

export default function DeskPage(props: DeskPageProps) {
  if (props.mode === "verdict") {
    return <VerdictDesk input={props.input} verdict={props.verdict} onNewCase={props.onNewCase} />;
  }
  return <FormDesk onFileCase={props.onFileCase} error={props.error} initialInput={props.initialInput} />;
}

function FormDesk({
  onFileCase,
  error,
  initialInput,
}: {
  onFileCase: (input: CaseInput) => void;
  error?: string | null;
  initialInput?: CaseInput | null;
}) {
  const [defendant, setDefendant] = useState(initialInput?.name ?? "");
  const [conduct, setConduct] = useState(initialInput?.conduct ?? "");
  const [isFiled, setIsFiled] = useState(false);
  const [loaderActive, setLoaderActive] = useState(false);
  const timeouts = useRef<number[]>([]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isFiled) return;
    if (!defendant.trim() || !conduct.trim()) return;
    setIsFiled(true);
    timeouts.current.push(window.setTimeout(() => setLoaderActive(true), 650));
    timeouts.current.push(
      window.setTimeout(() => {
        onFileCase({ name: defendant.trim(), conduct: conduct.trim() });
      }, 1600)
    );
  }

  function handleRetry() {
    if (!defendant.trim() || !conduct.trim()) return;
    onFileCase({ name: defendant.trim(), conduct: conduct.trim() });
  }

  return (
    <Desk image={deskHero} imageAlt={DESK_ALT} vignette="desk">
      <header className={styles.masthead}>
        <p className={styles.eyebrow}>Division of Automated Adjudication</p>
        <h1 className={styles.wordmark}>
          AI Agent <em>Court</em>
        </h1>
        <p className={styles.subhead}>State your grievance. The panel is impartial, tireless, and already listening.</p>
      </header>

      <main className={styles.cardStage}>
        <form className={isFiled ? `${styles.isFiled}` : ""} onSubmit={handleSubmit}>
          <PaperDocument rotate={-0.55} className={styles.caseCard}>
            <div className={styles.seal} aria-hidden="true">
              <span>AC</span>
            </div>

            <p className={styles.cardKicker}>In the Matter of&nbsp;&mdash;</p>
            <h2 className={styles.cardTitle}>Case File No. 0001</h2>
            <div className={styles.rule} aria-hidden="true">
              <span />
              <span />
            </div>

            <div className={styles.field}>
              <label htmlFor="defendant">Defendant Name</label>
              <input
                type="text"
                id="defendant"
                name="defendant"
                placeholder="Full name of the accused"
                autoComplete="off"
                required
                value={defendant}
                onChange={(e) => setDefendant(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="conduct">
                Alleged Conduct
                <span className={styles.hint}>— describe what the person has done</span>
              </label>
              <textarea
                id="conduct"
                name="conduct"
                placeholder="On the evening in question, the defendant did knowingly..."
                required
                value={conduct}
                onChange={(e) => setConduct(e.target.value)}
              />
            </div>

            <p className={styles.finePrint}>
              By filing, you attest this account is true to the best of your knowledge.
              <br />
              The tribunal&apos;s verdict shall be rendered without delay or recess.
            </p>

            {error && (
              <div className={styles.errorNotice} role="alert">
                <p className={styles.errorText}>{error}</p>
                <BrassButton
                  className={styles.retryButton}
                  type="button"
                  variant="pill"
                  onClick={handleRetry}
                >
                  Try Again
                </BrassButton>
              </div>
            )}

            <BrassButton className={styles.fileButton} type="submit" disabled={isFiled}>
              File the Case
            </BrassButton>

            <div className={styles.stampOverlay} aria-hidden="true">
              <span className={styles.stampText}>Filed</span>
            </div>
          </PaperDocument>
        </form>
      </main>

      <section className={styles.docketFooter}>
        <div className={styles.sealsRow}>
          <div className={styles.sealCard}>
            <div className={styles.ring}>01</div>
            <h3>Docket, Instantly</h3>
            <p>Every filing receives a case number the moment it&apos;s submitted.</p>
          </div>
          <div className={styles.sealCard}>
            <div className={styles.ring}>02</div>
            <h3>Heard by the Panel</h3>
            <p>AI judges review the account and weigh it on its merits.</p>
          </div>
          <div className={styles.sealCard}>
            <div className={styles.ring}>03</div>
            <h3>Verdict in Minutes</h3>
            <p>No continuances. A ruling returns the same sitting.</p>
          </div>
        </div>
        <p className={styles.docketClose}>&mdash; Clerk of the Court, AI Agent Court &mdash;</p>
      </section>

      <CourtLoader active={loaderActive} text="Filing with the Court…" />
    </Desk>
  );
}

function VerdictDesk({
  input,
  verdict,
  onNewCase,
}: {
  input: CaseInput;
  verdict: Verdict;
  onNewCase: () => void;
}) {
  return (
    <Desk image={deskHero} imageAlt={DESK_ALT} vignette="desk">
      <header className={styles.masthead}>
        <p className={styles.eyebrow}>Division of Automated Adjudication</p>
        <h1 className={styles.wordmark}>
          AI Agent <em>Court</em>
        </h1>
        <p className={styles.subhead}>State your grievance. The panel is impartial, tireless, and already listening.</p>
      </header>

      <main className={styles.cardStage}>
        <PaperDocument rotate={-0.55} className={styles.caseCard}>
          <div className={styles.seal} aria-hidden="true">
            <span>AC</span>
          </div>

          <p className={styles.cardKicker}>In the Matter of&nbsp;&mdash;</p>
          <h2 className={styles.cardTitle}>Case File No. 0001</h2>
          <div className={styles.rule} aria-hidden="true">
            <span />
            <span />
          </div>

          <div className={styles.field}>
            <label>Defendant Name</label>
            <div className={styles.filledLine}>
              <span className={styles.hand}>{input.name || "Unnamed"}</span>
            </div>
          </div>

          <div className={styles.field}>
            <label>
              Alleged Conduct
              <span className={styles.hint}>— describe what the person has done</span>
            </label>
            <div className={styles.filledArea}>
              <span className={styles.hand}>{input.conduct}</span>
            </div>
          </div>

          <VerdictStamp verdict={verdict} />
        </PaperDocument>

        <p className={styles.verdictCaption}>Verdict delivered by the Court</p>

        <div className={styles.verdictActions}>
          <BrassButton variant="pill" type="button" onClick={onNewCase}>
            File a New Case
          </BrassButton>
        </div>
      </main>
    </Desk>
  );
}
