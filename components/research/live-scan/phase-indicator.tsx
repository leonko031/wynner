"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Three-segment phase pill bar centered at the top of the cinematic UI.
 *   Discover → Synthesize → Verdict
 *
 * Active phase: aurora gradient fill.
 * Complete phase: filled in green-tinted, checkmark icon.
 * Future phase: dimmed.
 * The progress line at the bottom fills 0..1 across all three segments.
 */

const PHASES = [
  { id: 1, label: "Discover" },
  { id: 2, label: "Synthesize" },
  { id: 3, label: "Verdict" },
] as const;

export function PhaseIndicator({
  currentPhase,
  progress,
}: {
  /** 1 | 2 | 3 — which phase is in flight. 0 means not started, 4 means done. */
  currentPhase: number;
  /** 0..1 — overall scan progress driving the bottom bar. */
  progress: number;
}) {
  return (
    <div className="glass inline-flex max-w-full overflow-hidden rounded-full p-1">
      {PHASES.map((p, i) => {
        const isActive = currentPhase === p.id;
        const isComplete = currentPhase > p.id;
        const isFuture = currentPhase < p.id;
        return (
          <div key={p.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs transition-colors",
                isActive && "text-white",
                isComplete && "text-go",
                isFuture && "text-text-dim",
              )}
              style={
                isActive
                  ? {
                      background:
                        "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                      boxShadow: "0 6px 20px -6px rgba(167,136,255,0.7)",
                    }
                  : undefined
              }
            >
              {isComplete ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="font-mono text-[10px] tabular-nums">
                  0{p.id}
                </span>
              )}
              <span className="font-medium tracking-wide">{p.label}</span>
            </div>
            {i < PHASES.length - 1 && (
              <span className="px-1 text-text-dim">·</span>
            )}
          </div>
        );
      })}
      {/* Progress line below */}
      <span
        className="pointer-events-none absolute left-3 right-3 bottom-1 h-0.5 overflow-hidden rounded-full bg-border-soft/60"
      >
        <motion.span
          className="block h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(progress * 100)}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: "linear-gradient(90deg, #5B8DFF, #A788FF, #FF89C5)",
          }}
        />
      </span>
    </div>
  );
}
