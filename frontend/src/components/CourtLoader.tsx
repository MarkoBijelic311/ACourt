import styles from "./CourtLoader.module.css";

interface CourtLoaderProps {
  active: boolean;
  text: string;
}

export default function CourtLoader({ active, text }: CourtLoaderProps) {
  return (
    <div
      className={`${styles.courtLoader} ${active ? styles.isActive : ""}`}
      aria-hidden="true"
    >
      <div className={styles.seal} />
      <p className={styles.text}>{text}</p>
    </div>
  );
}
