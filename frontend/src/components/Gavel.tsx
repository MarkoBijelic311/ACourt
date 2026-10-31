import styles from "./Gavel.module.css";

interface GavelProps {
  struck: boolean;
  disabled: boolean;
  label: string;
  subLabel: string;
  statusText: string;
  onStrike: () => void;
}

export default function Gavel({ struck, disabled, label, subLabel, statusText, onStrike }: GavelProps) {
  return (
    <>
      <div className={styles.trialWrap}>
        <div className={styles.trialGlow} aria-hidden="true" />
        <button
          type="button"
          className={`${styles.trialButton} ${struck ? styles.struck : ""}`}
          disabled={disabled}
          onClick={onStrike}
        >
          <span className={styles.trialLabel}>{label}</span>
          <span className={styles.trialSub}>{subLabel}</span>
        </button>
      </div>
      <p className={`${styles.statusLine} ${struck ? styles.statusVisible : ""}`}>{statusText}</p>
    </>
  );
}
