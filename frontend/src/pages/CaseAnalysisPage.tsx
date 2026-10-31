import Desk from "../components/Desk";
import FolderTab from "../components/FolderTab";
import PageNav from "../components/PageNav";
import type { CaseAnalysis } from "../types";
import { renderMarked } from "../utils/renderMarked";
import folderHero from "../assets/folder-hero.png";
import styles from "./CaseAnalysisPage.module.css";

interface CaseAnalysisPageProps {
  analysis: CaseAnalysis;
  onBack: () => void;
  onNext: () => void;
}

export default function CaseAnalysisPage({ analysis, onBack, onNext }: CaseAnalysisPageProps) {
  return (
    <Desk
      image={folderHero}
      imageAlt="An opened manila case folder lying on the judge's desk, lit by brass lamplight, flanked by a gavel, inkwell and fountain pen."
      vignette="folder"
    >
      <header className={styles.masthead}>
        <p className={styles.eyebrow}>Division of Automated Adjudication</p>
        <h1>Case File No. 0001 &middot; Case Analysis</h1>
      </header>

      <main className={styles.stage}>
        <div className={styles.folder}>
          <FolderTab label="Case Analysis" />
          <div className={styles.folderBody}>
            <div className={styles.leaves}>
              <div className={`${styles.leaf} ${styles.leafLeft}`}>
                <h2 className={styles.section}>Summary of Facts</h2>
                {analysis.summaryParagraphs.map((paragraph, i) => (
                  <p key={i} className={styles.bodyText}>
                    {renderMarked(paragraph, styles.underlineMark)}
                  </p>
                ))}
                <span className={styles.marginNote}>verify w/ complainant</span>

                <h2 className={styles.section}>Charges Considered</h2>
                <ul className={styles.charges}>
                  {analysis.charges.map((charge) => (
                    <li key={charge.title}>
                      <span className={styles.mark} aria-hidden="true">
                        {charge.mark}
                      </span>
                      <span className={styles.text}>
                        {charge.circled ? (
                          <span className={styles.circleMark}>
                            <strong>{charge.title}</strong>
                          </span>
                        ) : (
                          <strong>{charge.title}</strong>
                        )}{" "}
                        &mdash; {charge.description}
                      </span>
                    </li>
                  ))}
                </ul>
                <span className={styles.marginNote} style={{ marginTop: "0.6rem" }}>
                  strongest count
                </span>
              </div>

              <div className={`${styles.leaf} ${styles.leafRight}`}>
                <div className={styles.stampBlock}>
                  <p className={styles.label}>Prepared by</p>
                  <p className={styles.signature}>Case Analyst Agent</p>
                  <p className={styles.meta}>Docket 0001 &middot; Filed Oct 31, 2026</p>
                </div>

                <h2 className={styles.section} style={{ marginTop: "5.4rem" }}>
                  Timeline of Events
                </h2>
                <ul className={styles.timeline}>
                  {analysis.timeline.map((entry) => (
                    <li key={entry.date}>
                      <span className={styles.date}>{entry.date}</span>
                      <span className={styles.event}>{renderMarked(entry.event, styles.underlineMark)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PageNav variant="tabs" pageCount="Page 2 of 5" onBack={onBack} backLabel="Back to Desk" onNext={onNext} nextLabel="Next: Evidence" />
    </Desk>
  );
}
