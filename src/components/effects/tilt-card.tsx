"use client";

import type { ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/**
 * Pointer-follow 3D tilt with spring physics.
 * SSR-safe: renders children fully visible; client effects only transform
 * the wrapper on pointer move — the card is never hidden waiting for JS.
 */
export function TiltCard({
  children,
  className,
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRx = useSpring(rotateX, { stiffness: 300, damping: 28, mass: 0.6 });
  const springRy = useSpring(rotateY, { stiffness: 300, damping: 28, mass: 0.6 });

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(-py * max);
    rotateY.set(px * max);
  }

  function onPointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      className={className}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{ rotateX: springRx, rotateY: springRy, transformPerspective: 900 }}
    >
      {children}
    </motion.div>
  );
}
