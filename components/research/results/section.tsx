"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Wrapper that fades + slides each results section into view as it scrolls
 * in. All section components on the new results page use this so the reveals
 * feel coherent.
 */
export function ResultsSection({
  title,
  subtitle,
  eyebrow,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative", className)}
    >
      {(title || eyebrow || subtitle) && (
        <header className="mb-5">
          {eyebrow && (
            <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              {eyebrow}
            </div>
          )}
          {title && (
            <h2 className="mt-1 text-2xl font-medium tracking-tight md:text-3xl">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm text-text-muted md:text-base">
              {subtitle}
            </p>
          )}
        </header>
      )}
      {children}
    </motion.section>
  );
}

/** Tiny confidence-level chip used across results sections. */
export function ConfidencePill({
  level,
  className,
}: {
  level: "low" | "medium" | "high";
  className?: string;
}) {
  const color =
    level === "high" ? "var(--color-go)" : level === "medium" ? "var(--color-test)" : "var(--ink-whisper)";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        className,
      )}
      style={{
        color,
        background: `${level === "high" ? "rgba(61,214,140,0.10)" : level === "medium" ? "rgba(255,171,64,0.10)" : "rgba(157,160,191,0.10)"}`,
        border: `1px solid ${level === "high" ? "rgba(61,214,140,0.40)" : level === "medium" ? "rgba(255,171,64,0.40)" : "rgba(157,160,191,0.30)"}`,
      }}
    >
      <span
        className="h-1 w-1 rounded-full"
        style={{ background: color }}
      />
      Confidence: {level}
    </span>
  );
}
