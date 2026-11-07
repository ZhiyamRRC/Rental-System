"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const adminInput =
  "dark-controls w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-sm text-mist outline-none transition-colors focus:border-ember placeholder:text-smoke";

export const adminLabel = "mb-1.5 block font-display text-[10px] font-bold tracking-[0.18em] text-smoke uppercase";

export function AdminButton({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  children: ReactNode;
}) {
  return (
    <button
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-display text-xs font-bold tracking-[0.12em] uppercase transition-colors disabled:opacity-50",
        variant === "primary" && "bg-ember text-ink hover:bg-amber",
        variant === "ghost" && "border border-line text-mist/80 hover:border-mist/40 hover:text-mist",
        variant === "danger" && "border border-ember/40 text-ember hover:bg-ember/10",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "border-amber/50 bg-amber/10 text-amber",
    confirmed: "border-seafoam/50 bg-seafoam/10 text-seafoam",
    active: "border-seafoam/50 bg-seafoam/10 text-seafoam",
    completed: "border-line bg-mist/5 text-mist/60",
    cancelled: "border-ember/50 bg-ember/10 text-ember",
    available: "border-seafoam/50 bg-seafoam/10 text-seafoam",
    maintenance: "border-amber/50 bg-amber/10 text-amber",
    retired: "border-line bg-mist/5 text-mist/50",
  };
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-2.5 py-0.5 font-display text-[10px] font-bold tracking-[0.14em] uppercase",
        styles[status] ?? styles.completed,
      )}
    >
      {status}
    </span>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      {/* modals mount only on user action, so entrance animation is always safe */}
      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className={cn(
          "max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-carbon p-6 sm:rounded-3xl sm:p-8",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full border border-line text-smoke transition-colors hover:border-mist/40 hover:text-mist"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

export function PageHeader({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1.5 text-sm text-smoke">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
