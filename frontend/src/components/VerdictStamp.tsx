import type { Verdict } from "../types";
import guiltyStamp from "../assets/guilty-stamp-alpha.png";
import notGuiltyStamp from "../assets/not-guilty-stamp-alpha.png";
import styles from "./VerdictStamp.module.css";

interface VerdictStampProps {
  verdict: Verdict;
}

export default function VerdictStamp({ verdict }: VerdictStampProps) {
  const isGuilty = verdict === "GUILTY";
  // No dedicated artwork exists for INSUFFICIENT_EVIDENCE — it reuses the
  // NOT GUILTY stamp visually, with the caption below clarifying the actual verdict.
  const src = isGuilty ? guiltyStamp : notGuiltyStamp;
  const alt = isGuilty
    ? "A red ink court seal stamped diagonally across the form, reading GUILTY, inside a circular border that reads AI Agent Court, Division of Automated Adjudication."
    : "A green ink court seal stamped diagonally across the form, reading NOT GUILTY, inside a circular border that reads AI Agent Court, Division of Automated Adjudication.";

  return (
    <>
      <img className={styles.stampImg} src={src} alt={alt} aria-hidden="true" />
      {verdict === "INSUFFICIENT_EVIDENCE" && (
        <p className={styles.caption}>Verdict: Insufficient Evidence</p>
      )}
    </>
  );
}
