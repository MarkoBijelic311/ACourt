import type { ButtonHTMLAttributes } from "react";
import styles from "./BrassButton.module.css";

type BrassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "bar" | "pill";
};

export default function BrassButton({ variant = "bar", className, children, ...rest }: BrassButtonProps) {
  const variantClass = variant === "pill" ? styles.pill : styles.bar;
  return (
    <button className={`${variantClass} ${className ?? ""}`} {...rest}>
      {children}
    </button>
  );
}
