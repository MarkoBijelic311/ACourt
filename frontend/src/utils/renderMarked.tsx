import type { ReactNode } from "react";

/**
 * Splits text on `==marked==` segments and wraps them in the given className,
 * so copy can carry inline emphasis (e.g. the red pen underline) without
 * baking markup into the data layer.
 */
export function renderMarked(text: string, markClassName: string): ReactNode[] {
  const parts = text.split(/==(.+?)==/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className={markClassName}>
        {part}
      </span>
    ) : (
      part
    )
  );
}
