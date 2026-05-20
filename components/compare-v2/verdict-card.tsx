"use client";

import { motion } from "framer-motion";
import { RefreshCw, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AiOrb } from "@/components/research/ai-orb";
import { useCreditsStore } from "@/lib/store/credits";
import type { JudgeVerdict } from "@/types/compare";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  verdict: JudgeVerdict | null;
  loading: boolean;
  cached: boolean;
  /** When set, the verdict failed and we surface a retry path. */
  error: string | null;
  /** Resolved winner product (or null while loading / on error). */
  winner: Product | null;
  onRegenerate: () => void;
  onGenerate: () => void;
};

const REGEN_COST = 3;

/**
 * Centerpiece "judge's verdict" card. Orb on the left, 4-part analysis on
 * the right (declaration, why, tradeoffs, recommendation). Regenerate +
 * confidence pill at the bottom.
 */
export function VerdictCard({
  verdict,
  loading,
  cached,
  error,
  winner,
  onRegenerate,
  onGenerate,
}: Props) {
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  const confidence = verdict?.confidenceLevel ?? null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div
        className="glass-strong relative overflow-hidden rounded-[28px] p-6 md:p-8"
        style={{
          boxShadow:
            "0 0 0 1px rgba(167,136,255,0.45), 0 32px 80px -20px rgba(91,141,255,0.45), 0 0 60px rgba(167,136,255,0.20)",
        }}
      >
        {/* Aurora mesh background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 10% 50%, rgba(167,136,255,0.22), transparent 60%), radial-gradient(ellipse 50% 60% at 90% 80%, rgba(91,141,255,0.18), transparent 60%)",
          }}
        />

        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-[120px_1fr] md:items-start">
          {/* Orb */}
          <div className="flex items-center justify-center md:justify-start">
            <AiOrb size={96} intensity={loading ? 0.95 : 0.55} celebrate={!loading && !!verdict && !cached} />
          </div>

          {/* Content */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                  The verdict
                </span>
                {cached && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim/70">
                    · cached
                  </span>
                )}
                {verdict && !cached && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-aurora-purple">
                    · fresh
                  </span>
                )}
              </div>
              {verdict && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onRegenerate}
                      disabled={loading}
                      aria-label="Regenerate verdict"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border-soft bg-surface/70 text-text-muted hover:border-aurora-purple/45 hover:text-text disabled:opacity-50"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
                    Regenerate verdict {isAdmin ? "(free for you)" : `(✦ ${REGEN_COST})`}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <h2 className="mt-3 font-serif text-2xl tracking-tight text-text md:text-3xl">
              {loading
                ? "Wynner is deliberating…"
                : error
                  ? "The judge couldn't reach a verdict"
                  : verdict
                    ? verdict.declaration
                    : "Generate the verdict"}
            </h2>

            {loading && <SkeletonBody />}

            {error && !loading && (
              <ErrorRetry message={error} onRetry={onGenerate} />
            )}

            {verdict && !loading && !error && (
              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <Block title="Why" items={verdict.whyBullets} accent="#3DD68C" />
                <Block title="The tradeoffs" items={verdict.tradeoffBullets} accent="#FF7E5F" />
              </div>
            )}

            {verdict && !loading && !error && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="mt-5 rounded-2xl border border-aurora-purple/35 bg-aurora-purple/[0.08] p-4"
              >
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-aurora-purple">
                  <Sparkles className="h-3 w-3" />
                  What an operator should do
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-text">
                  {verdict.recommendation}
                </p>
              </motion.div>
            )}

            {/* Footer: confidence + winner */}
            {verdict && !loading && !error && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <span className="font-mono uppercase tracking-wider">
                    Confidence:
                  </span>
                  <ConfidencePill level={confidence} />
                </div>
                {winner && (
                  <div className="text-right">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-text-dim">
                      Winner
                    </div>
                    <div className="text-sm text-text">{winner.name}</div>
                  </div>
                )}
              </div>
            )}

            {!verdict && !loading && !error && (
              <button
                type="button"
                onClick={onGenerate}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-white shadow-[0_12px_28px_-8px_rgba(167,136,255,0.55)] hover:brightness-110"
                style={{
                  background:
                    "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                }}
              >
                <Sparkles className="h-4 w-4" />
                Generate the verdict
                <span className="font-mono text-[10px]">
                  {isAdmin ? "free" : "✦ 3"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */

function Block({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: string;
}) {
  return (
    <div>
      <div
        className="mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
        style={{
          background: `${accent}1A`,
          color: accent,
          border: `1px solid ${accent}40`,
        }}
      >
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-text">
            <span
              aria-hidden
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
              style={{ background: accent }}
            />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConfidencePill({ level }: { level: "low" | "medium" | "high" | null }) {
  if (!level) return null;
  const color =
    level === "high"
      ? "var(--color-go)"
      : level === "medium"
        ? "var(--color-test)"
        : "var(--ink-whisper)";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
      style={{
        color,
        background:
          level === "high"
            ? "rgba(61,214,140,0.10)"
            : level === "medium"
              ? "rgba(255,171,64,0.10)"
              : "rgba(157,160,191,0.10)",
        border: `1px solid ${
          level === "high"
            ? "rgba(61,214,140,0.40)"
            : level === "medium"
              ? "rgba(255,171,64,0.40)"
              : "rgba(157,160,191,0.30)"
        }`,
      }}
    >
      {level}
    </span>
  );
}

function SkeletonBody() {
  return (
    <div className="mt-5 space-y-3">
      <div className="shimmer-bg h-4 w-5/6 rounded-full bg-surface-elevated" />
      <div className="shimmer-bg h-4 w-3/4 rounded-full bg-surface-elevated" />
      <div className="shimmer-bg h-4 w-2/3 rounded-full bg-surface-elevated" />
    </div>
  );
}

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-5 rounded-2xl border border-aurora-peach/40 bg-aurora-peach/10 p-4">
      <p className="text-sm leading-relaxed text-text">
        Hmm, couldn&apos;t reach the judge&apos;s bench. Your credits weren&apos;t
        charged. Try again?
      </p>
      <p className="mt-1 text-[10px] text-text-dim">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-aurora-peach/20 px-3 text-xs font-medium text-aurora-peach hover:bg-aurora-peach/30"
      >
        <RefreshCw className="h-3 w-3" />
        Try again
      </button>
    </div>
  );
}
