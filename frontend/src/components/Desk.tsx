import type { CSSProperties, ReactNode } from "react";
import styles from "./Desk.module.css";

const VIGNETTES: Record<"desk" | "folder" | "closing", string> = {
  desk: "radial-gradient(ellipse 85% 65% at 50% 46%, rgba(10, 6, 3, 0) 40%, rgba(10, 6, 3, 0.55) 100%), linear-gradient(to bottom, rgba(8, 5, 2, 0.62) 0%, rgba(8, 5, 2, 0.08) 22%, rgba(8, 5, 2, 0.08) 72%, rgba(8, 5, 2, 0.72) 100%)",
  folder: "radial-gradient(ellipse 88% 70% at 50% 48%, rgba(10, 6, 3, 0) 42%, rgba(10, 6, 3, 0.5) 100%), linear-gradient(to bottom, rgba(8, 5, 2, 0.55) 0%, rgba(8, 5, 2, 0.05) 20%, rgba(8, 5, 2, 0.05) 74%, rgba(8, 5, 2, 0.68) 100%)",
  closing: "radial-gradient(ellipse 88% 70% at 50% 44%, rgba(10, 6, 3, 0) 40%, rgba(10, 6, 3, 0.55) 100%), linear-gradient(to bottom, rgba(8, 5, 2, 0.6) 0%, rgba(8, 5, 2, 0.06) 20%, rgba(8, 5, 2, 0.06) 62%, rgba(8, 5, 2, 0.78) 100%)",
};

interface DeskProps {
  image: string;
  imageAlt: string;
  vignette: "desk" | "folder" | "closing";
  children: ReactNode;
  id?: string;
  /** Rendered as an absolutely-positioned sibling of the photo, before children (e.g. a flash overlay). */
  overlay?: ReactNode;
}

export default function Desk({ image, imageAlt, vignette, children, id, overlay }: DeskProps) {
  const vignetteStyle: CSSProperties = { background: VIGNETTES[vignette] };
  return (
    <div id={id} className={styles.desk}>
      <img className={styles.deskPhoto} src={image} alt={imageAlt} />
      <div className={styles.deskVignette} style={vignetteStyle} />
      {overlay}
      {children}
    </div>
  );
}
