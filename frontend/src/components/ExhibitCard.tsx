import type { Exhibit } from "../types";
import exhibitAImage from "../assets/exhibit-a.png";
import styles from "./ExhibitCard.module.css";

interface ExhibitCardProps {
  exhibit: Exhibit;
  rotationClass: "a" | "b" | "c";
}

const ROTATION_CLASS = {
  a: "rotA",
  b: "rotB",
  c: "rotC",
} as const;

export default function ExhibitCard({ exhibit, rotationClass }: ExhibitCardProps) {
  return (
    <figure className={`${styles.exhibit} ${styles[ROTATION_CLASS[rotationClass]]}`}>
      <div className={styles.clip} aria-hidden="true" />
      {exhibit.kind === "photo" ? (
        <div className={styles.polaroid}>
          <img src={exhibitAImage} alt={exhibit.imageAlt} />
        </div>
      ) : (
        <div className={styles.docCard}>
          <p className={styles.docByline}>{exhibit.byline}</p>
          <p className={styles.docExcerpt}>{exhibit.excerpt}</p>
          {exhibit.noReply && <span className={styles.noReply}>No reply received</span>}
        </div>
      )}
      <div className={styles.evidenceTag}>
        <span>{exhibit.label}</span>
      </div>
      <figcaption className={styles.exhibitDesc}>{exhibit.caption}</figcaption>
    </figure>
  );
}
