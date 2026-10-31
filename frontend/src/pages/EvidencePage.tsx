import Desk from "../components/Desk";
import FolderTab from "../components/FolderTab";
import PaperDocument from "../components/PaperDocument";
import ExhibitCard from "../components/ExhibitCard";
import PageNav from "../components/PageNav";
import type { CaseEvidence } from "../types";
import evidenceHero from "../assets/evidence-hero.png";
import styles from "./EvidencePage.module.css";

interface EvidencePageProps {
  evidence: CaseEvidence;
  onBack: () => void;
  onNext: () => void;
}

const ROTATIONS = ["a", "b", "c"] as const;

export default function EvidencePage({ evidence, onBack, onNext }: EvidencePageProps) {
  return (
    <Desk
      image={evidenceHero}
      imageAlt="A blank evidence log sheet on the judge's desk, lit by brass lamplight, beside a gavel, inkwell and fountain pen."
      vignette="folder"
    >
      <header className={styles.masthead}>
        <p className={styles.eyebrow}>Division of Automated Adjudication</p>
        <h1>Case File No. 0001 &middot; Evidence</h1>
      </header>

      <main className={styles.stage}>
        <div className={styles.board}>
          <FolderTab label="Evidence" />
          <PaperDocument rotate={-0.3} className={styles.sheet}>
            <div className={styles.stampBlock}>
              <p className={styles.label}>Prepared by</p>
              <p className={styles.signature}>Evidence Agent</p>
              <p className={styles.meta}>Docket 0001 &middot; Filed Oct 31, 2026</p>
            </div>

            <p className={styles.sheetKicker}>Exhibits Entered &mdash;</p>
            <h2 className={styles.section}>Evidence Log</h2>

            <div className={styles.exhibits}>
              {evidence.exhibits.map((exhibit, i) => (
                <ExhibitCard key={exhibit.label} exhibit={exhibit} rotationClass={ROTATIONS[i % 3]} />
              ))}
            </div>

            <div className={styles.custody}>
              <span className={styles.label}>Chain of Custody</span>
              <span className={styles.status}>{evidence.custodyStatus}</span>
              <span className={styles.meta}>{evidence.custodyMeta}</span>
            </div>
          </PaperDocument>
        </div>
      </main>

      <PageNav
        variant="tabs"
        pageCount="Page 3 of 5"
        onBack={onBack}
        backLabel="Case Analysis"
        onNext={onNext}
        nextLabel="Next: Arguments"
      />
    </Desk>
  );
}
