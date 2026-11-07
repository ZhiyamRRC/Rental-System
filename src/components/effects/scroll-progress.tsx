"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Ambient reading-progress bar — an indicator only, never content, so its
 * initial zero scale is always a valid visual state. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[55] h-[3px] origin-left bg-gradient-to-r from-ember via-amber to-ember"
      style={{ scaleX }}
    />
  );
}
