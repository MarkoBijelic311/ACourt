import type { Verdict } from "../types";
import guiltyStamp from "../assets/guilty-stamp-alpha.png";
import notGuiltyStamp from "../assets/not-guilty-stamp-alpha.png";
import styles from "./VerdictStamp.module.css";

interface VerdictStampProps {
  verdict: Verdict;
}

export default function VerdictStamp({ verdict }: VerdictStampProps) {
  if (verdict === "UNABLE_TO_ADJUDICATE") {
    return (
      <div className={styles.noCaseStamp} aria-hidden="true">
        <span className={styles.noCaseStampText}>Case Dismissed</span>
        <span className={styles.noCaseStampSub}>No Arguments Presented</span>
      </div>
    );
  }

  // No dedicated artwork exists for INSUFFICIENT_EVIDENCE — unlike GUILTY/NOT
  // GUILTY, it gets its own distinct text stamp rather than reusing the NOT
  // GUILTY artwork, since the two are materially different outcomes and
  // looked too easy to confuse when they shared the same image.
  if (verdict === "INSUFFICIENT_EVIDENCE") {
    return (
      <div className={styles.insufficientStamp} aria-hidden="true">
        <span className={styles.insufficientStampText}>Insufficient Evidence</span>
        <span className={styles.insufficientStampSub}>Verdict Withheld</span>
      </div>
    );
  }

  const isGuilty = verdict === "GUILTY";
  const src = isGuilty ? guiltyStamp : notGuiltyStamp;
  const alt = isGuilty
    ? "A red ink court seal stamped diagonally across the form, reading GUILTY, inside a circular border that reads AI Agent Court, Division of Automated Adjudication."
    : "A green ink court seal stamped diagonally across the form, reading NOT GUILTY, inside a circular border that reads AI Agent Court, Division of Automated Adjudication.";

  return <img className={styles.stampImg} src={src} alt={alt} aria-hidden="true" />;
}
