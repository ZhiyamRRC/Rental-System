import type { ReactNode } from "react";

/**
 * Zero-JS scroll reveal. Content is always server-rendered visible;
 * browsers with scroll-driven animations add the entrance effect, everyone
 * else simply sees content — impossible to leave a page blank.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <div className={`rv ${className ?? ""}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
