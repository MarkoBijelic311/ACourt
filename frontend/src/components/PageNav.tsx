import styles from "./PageNav.module.css";

interface TabsNavProps {
  variant: "tabs";
  pageCount: string;
  onBack?: () => void;
  backLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
}

interface MiniNavProps {
  variant: "mini";
  pageCount: string;
  onBack: () => void;
  backLabel: string;
}

type PageNavProps = TabsNavProps | MiniNavProps;

export default function PageNav(props: PageNavProps) {
  if (props.variant === "mini") {
    return (
      <nav className={styles.miniNav}>
        <button type="button" className={styles.miniNavLink} onClick={props.onBack}>
          &larr; {props.backLabel}
        </button>
        <span className={styles.sep}>&middot;</span>
        <span className={styles.pageCount}>{props.pageCount}</span>
      </nav>
    );
  }

  const { onBack, backLabel, onNext, nextLabel, pageCount } = props;
  return (
    <footer className={styles.docFooter}>
      {onBack ? (
        <button type="button" className={styles.navTab} onClick={onBack}>
          &larr; {backLabel}
        </button>
      ) : (
        <span className={`${styles.navTab} ${styles.navTabDisabled}`} aria-disabled="true" />
      )}
      <span className={styles.pageCount}>{pageCount}</span>
      {onNext ? (
        <button type="button" className={styles.navTab} onClick={onNext}>
          {nextLabel} &rarr;
        </button>
      ) : (
        <span className={`${styles.navTab} ${styles.navTabDisabled}`} aria-disabled="true" />
      )}
    </footer>
  );
}
