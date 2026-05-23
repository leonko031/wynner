"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Check, Circle } from "lucide-react";
import { STAGE_LABELS, type ResearchStageId } from "@/types/research";
import { cn } from "@/lib/utils";

/**
 * Horizontal stage timeline along the bottom of the cinematic UI. Each
 * stage is a small node connected by a thin line. State maps to styling:
 *
 *   pending  — empty circle, dim
 *   active   — pulsing aurora-blue circle, label glows
 *   complete — filled aurora-green with checkmark
 *   fallback — filled aurora-blue with dotted ring (offline mode)
 *   failed   — filled aurora-amber with warning icon
 */

export type TimelineStage = {
  id: ResearchStageId;
  status: "pending" | "active" | "complete" | "fallback" | "failed";
  durationMs?: number;
};

export function StageTimeline({ stages }: { stages: TimelineStage[] }) {
  return (
    <div className="glass mx-auto flex w-full max-w-5xl items-center gap-1 rounded-2xl p-3 md:p-4">
      {stages.map((stage, i) => (
        <div key={stage.id} className="flex flex-1 items-center">
          <Node stage={stage} />
          {i < stages.length - 1 && (
            <div
              className={cn(
                "h-px flex-1 transition-colors duration-500",
                stage.status === "complete" || stage.status === "fallback"
                  ? "bg-aurora-purple/60"
                  : "bg-border-soft",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Node({ stage }: { stage: TimelineStage }) {
  const label = STAGE_LABELS[stage.id];
  const isActive = stage.status === "active";
  const isComplete = stage.status === "complete";
  const isFallback = stage.status === "fallback";
  const isFailed = stage.status === "failed";

  return (
    <div className="flex min-w-0 flex-col items-center gap-1 px-1">
      <div className="relative flex h-7 w-7 items-center justify-center">
        {/* Dotted ring for fallback */}
        {isFallback && (
          <span
            className="absolute inset-0 rounded-full border-2 border-dashed"
            style={{ borderColor: "rgba(91,141,255,0.5)" }}
          />
        )}
        {/* Active pulse */}
        {isActive && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgba(91,141,255,0.35), transparent 70%)",
            }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <span
          className={cn(
            "relative flex h-4 w-4 items-center justify-center rounded-full transition-colors",
            stage.status === "pending" && "border border-border-soft bg-surface/40",
            isActive && "bg-aurora-blue shadow-[0_0_10px_rgba(91,141,255,0.7)]",
            isComplete && "bg-go shadow-[0_0_10px_rgba(61,214,140,0.5)]",
            isFallback && "bg-aurora-blue",
            isFailed && "bg-aurora-peach shadow-[0_0_10px_rgba(255,176,136,0.5)]",
          )}
        >
          {isComplete && <Check className="h-2.5 w-2.5 text-white" />}
          {isFailed && <AlertTriangle className="h-2.5 w-2.5 text-white" />}
          {stage.status === "pending" && (
            <Circle className="h-2 w-2 text-text-dim" />
          )}
        </span>
      </div>
      <span
        className={cn(
          "truncate text-center font-mono text-[9px] uppercase tracking-wider transition-colors",
          isActive ? "text-text" : "text-text-dim",
        )}
        style={{ maxWidth: 88 }}
      >
        {label}
      </span>
      {stage.durationMs !== undefined && (
        <span className="font-mono text-[9px] tabular-nums text-text-dim">
          {(stage.durationMs / 1000).toFixed(1)}s
        </span>
      )}
    </div>
  );
}
