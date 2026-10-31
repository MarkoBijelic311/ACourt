import Desk from "../components/Desk";
import FolderTab from "../components/FolderTab";
import PaperDocument from "../components/PaperDocument";
import PageNav from "../components/PageNav";
import type { ArgumentBrief, CaseArguments } from "../types";
import argumentsHero from "../assets/arguments-hero.png";
import styles from "./ArgumentsPage.module.css";

interface ArgumentsPageProps {
  caseArguments: CaseArguments;
  onBack: () => void;
  onNext: () => void;
}

function Brief({ brief, side }: { brief: ArgumentBrief; side: "prosecution" | "defense" }) {
  const sideClass = side === "prosecution" ? styles.briefProsecution : styles.briefDefense;
  return (
    <PaperDocument className={`${styles.brief} ${sideClass}`}>
      <div className={styles.briefBar} />
      <p className={styles.briefKicker}>{brief.kicker}</p>
      <h2>{brief.heading}</h2>
      <ol className={styles.points}>
        {brief.points.map((point, i) => (
          <li key={i}>
            <span className={styles.pointText}>
              {point.text}
              {point.cite && <span className={styles.cite}>{point.cite}</span>}
            </span>
          </li>
        ))}
      </ol>
      <div className={styles.rebuttal}>
        <h3>{brief.rebuttalHeading}</h3>
        <p>{brief.rebuttalText}</p>
      </div>
    </PaperDocument>
  );
}

export default function ArgumentsPage({ caseArguments, onBack, onNext }: ArgumentsPageProps) {
  return (
    <Desk
      image={argumentsHero}
      imageAlt="Two blank legal-brief sheets lying side by side on the judge's desk, lit by brass lamplight, beside a gavel, inkwell and fountain pen."
      vignette="folder"
    >
      <header className={styles.masthead}>
        <p className={styles.eyebrow}>Division of Automated Adjudication</p>
        <h1>Case File No. 0001 &middot; Arguments</h1>
        <div className={styles.stampBlock}>
          <p className={styles.label}>Prepared by</p>
          <p className={styles.signature}>Debate Agent</p>
        </div>
      </header>

      <main className={styles.stage}>
        <div className={styles.board}>
          <FolderTab label="Arguments" />

          <div className={styles.briefs}>
            <div className={styles.divider} aria-hidden="true" />
            <div className={styles.vsMedallion} aria-hidden="true">
              <span>vs</span>
            </div>

            <Brief brief={caseArguments.prosecution} side="prosecution" />
            <Brief brief={caseArguments.defense} side="defense" />
          </div>
        </div>
      </main>

      <PageNav
        variant="tabs"
        pageCount="Page 4 of 5"
        onBack={onBack}
        backLabel="Evidence"
        onNext={onNext}
        nextLabel="Next: Closing"
      />
    </Desk>
  );
}
