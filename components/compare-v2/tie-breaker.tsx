"use client";

import { motion } from "framer-motion";
import { RotateCcw, Scale } from "lucide-react";
import { useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import {
  DEFAULT_PILLAR_WEIGHTS,
  weightedScore,
  type PillarWeights,
} from "@/types/compare";
import type { Product } from "@/types";

const PILLAR_LABELS: { key: keyof PillarWeights; label: string }[] = [
  { key: "margin", label: "Margin" },
  { key: "marketFit", label: "Market fit" },
  { key: "demand", label: "Demand" },
  { key: "competition", label: "Competition" },
  { key: "creative", label: "Creative" },
];

type Props = {
  products: Product[];
  weights: PillarWeights;
  onChange: (next: PillarWeights) => void;
  /** When true, the tie-breaker is visually emphasized (close scores). */
  emphasized: boolean;
};

/**
 * Pillar-weight sliders. Pure client-side recalculation, free.
 *
 * When the user re-weights and that changes the winner, we surface an inline
 * note: "With your priorities, {other product} actually wins". The page above
 * uses the weighted scores to drive the score row + champion-card score
 * overrides + (optionally) the winner crown.
 */
export function TieBreaker({ products, weights, onChange, emphasized }: Props) {
  const weightedScores = useMemo(
    () => products.map((p) => weightedScore(p, weights)),
    [products, weights],
  );
  const defaultWinnerIdx = useMemo(() => {
    let best = 0;
    for (let i = 1; i < products.length; i++) {
      if (products[i]!.sellScore > products[best]!.sellScore) best = i;
    }
    return best;
  }, [products]);
  const weightedWinnerIdx = useMemo(() => {
    let best = 0;
    for (let i = 1; i < weightedScores.length; i++) {
      if (weightedScores[i]! > weightedScores[best]!) best = i;
    }
    return best;
  }, [weightedScores]);

  const winnerChanged = defaultWinnerIdx !== weightedWinnerIdx;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-3xl p-6"
      style={
        emphasized
          ? {
              boxShadow:
                "0 0 0 1px rgba(255,176,136,0.45), 0 16px 40px -16px rgba(255,176,136,0.40)",
            }
          : undefined
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            <Scale className="h-3 w-3" />
            What matters most to you?
          </div>
          <h3 className="mt-1 font-serif text-xl text-text">
            Tune the weighting
          </h3>
          <p className="mt-1 max-w-md text-xs text-text-muted">
            Slide each pillar&apos;s weight up or down. The scores re-rank in real
            time. Pure client-side — no credits.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_PILLAR_WEIGHTS)}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-3 text-xs text-text-muted hover:border-aurora-blue/45 hover:text-text"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {PILLAR_LABELS.map(({ key, label }) => {
          const value = weights[key];
          return (
            <div key={key} className="flex items-center gap-3">
              <div className="w-24 text-sm text-text">{label}</div>
              <Slider
                value={[value]}
                min={0}
                max={40}
                step={1}
                onValueChange={(v) => onChange({ ...weights, [key]: v[0] ?? 0 })}
                className="flex-1"
              />
              <div className="w-10 text-right font-mono text-xs tabular-nums text-text-dim">
                {value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Re-ranked scores preview */}
      <div className="mt-5 rounded-2xl border border-border-soft bg-surface/50 p-3">
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-dim">
          With your priorities
        </div>
        <ul className="space-y-1">
          {products.map((p, i) => {
            const ws = weightedScores[i] ?? 0;
            const win = i === weightedWinnerIdx;
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="truncate text-text">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono tabular-nums ${win ? "text-go font-semibold" : "text-text-muted"}`}
                  >
                    {ws}
                  </span>
                  <span className="font-mono text-[10px] text-text-dim">
                    was {p.sellScore}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {winnerChanged && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 rounded-2xl border border-aurora-purple/40 bg-aurora-purple/10 px-4 py-3 text-sm text-text"
        >
          <span className="font-mono text-[10px] uppercase tracking-wider text-aurora-purple">
            Heads up
          </span>
          <p className="mt-0.5">
            With your priorities, <strong>{products[weightedWinnerIdx]?.name}</strong>{" "}
            actually wins — not the AI&apos;s pick.
          </p>
        </motion.div>
      )}
    </motion.section>
  );
}
