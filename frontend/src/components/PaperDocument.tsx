import type { CSSProperties, ReactNode } from "react";
import styles from "./PaperDocument.module.css";

interface PaperDocumentProps {
  children: ReactNode;
  className?: string;
  /** Degrees of rotation applied to the sheet, matching the original hand-set tilt per page. */
  rotate?: number;
}

export default function PaperDocument({ children, className, rotate }: PaperDocumentProps) {
  const style: CSSProperties | undefined = rotate !== undefined ? { transform: `rotate(${rotate}deg)` } : undefined;
  return (
    <div className={`${styles.paper} ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}
