import styles from "./FolderTab.module.css";

interface FolderTabProps {
  label: string;
}

export default function FolderTab({ label }: FolderTabProps) {
  return (
    <div className={styles.tab} aria-hidden="true">
      <span>{label}</span>
    </div>
  );
}
