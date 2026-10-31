import { useRef, useState } from "react";
import Desk from "../components/Desk";
import PaperDocument from "../components/PaperDocument";
import Gavel from "../components/Gavel";
import PageNav from "../components/PageNav";
import CourtLoader from "../components/CourtLoader";
import type { CaseClosing } from "../types";
import closingHero from "../assets/closing-hero.png";
import styles from "./ClosingPage.module.css";

interface ClosingPageProps {
  closing: CaseClosing;
  onBack: () => void;
  onReachVerdict: () => void;
}

export default function ClosingPage({ closing, onBack, onReachVerdict }: ClosingPageProps) {
  const [struck, setStruck] = useState(false);
  const [label, setLabel] = useState("Trial");
  const [subLabel, setSubLabel] = useState("Strike to begin proceedings");
  const [statusText, setStatusText] = useState("The court is now in session.");
  const [loaderActive, setLoaderActive] = useState(false);
  const timeouts = useRef<number[]>([]);

  function handleStrike() {
    if (struck) return;
    setStruck(true);
    setLabel("In Session");
    setSubLabel("Deliberation underway");
    timeouts.current.push(
      window.setTimeout(() => {
        setStatusText("The judge has reached a verdict.");
        setLabel("Verdict Reached");
        setSubLabel("Opening the ruling…");
        setLoaderActive(true);
      }, 900)
    );
    timeouts.current.push(window.setTimeout(() => onReachVerdict(), 2200));
  }

  return (
    <Desk
      image={closingHero}
      imageAlt="A single formal document on the judge's desk with the gavel resting close beside it, lit by brass lamplight."
      vignette="closing"
      overlay={<div className={`${styles.flash} ${struck ? styles.flashStruck : ""}`} aria-hidden="true" />}
    >
      <header className={styles.masthead}>
        <p className={styles.eyebrow}>Division of Automated Adjudication</p>
        <h1>Case File No. 0001 &middot; Closing Statement</h1>
      </header>

      <main className={styles.stage}>
        <PaperDocument rotate={-0.4} className={styles.statement}>
          <p className={styles.statementKicker}>Final Entry &mdash;</p>
          <h2>Closing Statement</h2>
          <div className={styles.rule} aria-hidden="true">
            <span />
            <span />
          </div>

          {closing.paragraphs.map((paragraph, i) => (
            <p key={i} className={styles.bodyText}>
              {paragraph}
            </p>
          ))}

          <div className={styles.signoff}>
            <div className={styles.sigLine} />
            <div className={styles.sigCaption}>
              <span className={styles.role}>Presiding &mdash; AI Agent Court</span>
              <span>Case No. 0001 &middot; Oct 31, 2026</span>
            </div>
          </div>

          <div className={`${styles.seal} ${struck ? styles.sealStruck : ""}`} aria-hidden="true">
            <div className={styles.sealRing}>
              <span>
                Verdict
                <br />
                Rendered
              </span>
            </div>
          </div>
        </PaperDocument>
      </main>

      <Gavel
        struck={struck}
        disabled={struck}
        label={label}
        subLabel={subLabel}
        statusText={statusText}
        onStrike={handleStrike}
      />

      <PageNav variant="mini" pageCount="Page 5 of 5" onBack={onBack} backLabel="Arguments" />

      <CourtLoader active={loaderActive} text="The Panel Is Deliberating…" />
    </Desk>
  );
}
