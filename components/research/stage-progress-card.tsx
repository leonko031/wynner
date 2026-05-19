"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import type {
  ResearchStageId,
} from "@/types/research";
import { STAGE_LABELS } from "@/types/research";
import { cn } from "@/lib/utils";

export type StageStatus = "pending" | "active" | "completed" | "failed";

export type StageState = {
  id: ResearchStageId;
  status: StageStatus;
  /** Latest thinking thought (active state) or summary preview (completed). */
  detail?: string;
  durationMs?: number;
  usedFallback?: boolean;
};

type Props = {
  stage: StageState;
  index: number;
};

const STATUS_ACCENT: Record<StageStatus, string> = {
  pending: "var(--surface-glass-border-strong)",
  active: "var(--color-aurora-blue)",
  completed: "var(--color-go)",
  failed: "var(--color-test)",
};

export function StageProgressCard({ stage, index }: Props) {
  const accent = STATUS_ACCENT[stage.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass relative rounded-2xl p-4 transition-all",
        stage.status === "active" && "ring-1 ring-aurora-blue/45",
        stage.status === "completed" && "bg-go/[0.06]",
        stage.status === "failed" && "bg-test/[0.07]",
      )}
      style={
        stage.status === "active"
          ? {
              boxShadow:
                "0 0 0 1px rgba(91,141,255,0.45), 0 18px 36px -16px rgba(91,141,255,0.45), 0 0 36px rgba(91,141,255,0.18)",
            }
          : undefined
      }
    >
      {/* Active pulsing aurora ring */}
      {stage.status === "active" && (
        <motion.span
          aria-hidden
          className="absolute -inset-px rounded-2xl"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background:
              "linear-gradient(135deg, rgba(91,141,255,0.0), rgba(167,136,255,0.35), rgba(255,137,197,0.0))",
            mask: "linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)",
            WebkitMask: "linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            padding: 1,
            borderRadius: 16,
          }}
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
            style={{
              backgroundColor: stage.status === "pending" ? "var(--surface-glass)" : `${accent}1A`,
              color: stage.status === "pending" ? "var(--ink-whisper)" : accent,
              border: `1px solid ${stage.status === "pending" ? "var(--surface-glass-border)" : accent + "55"}`,
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {stage.status === "completed" ? (
                <motion.span
                  key="ok"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                >
                  <Check className="h-4 w-4" />
                </motion.span>
              ) : stage.status === "active" ? (
                <Loader2 key="loading" className="h-4 w-4 animate-spin" />
              ) : stage.status === "failed" ? (
                <AlertTriangle key="warn" className="h-4 w-4" />
              ) : (
                <Activity key="idle" className="h-4 w-4 opacity-70" />
              )}
            </AnimatePresence>
          </span>
          <div>
            <div className="text-sm font-medium text-text">
              {STAGE_LABELS[stage.id]}
            </div>
            {stage.detail && (
              <div
                className={cn(
                  "mt-0.5 text-xs leading-snug",
                  stage.status === "completed"
                    ? "text-go"
                    : stage.status === "failed"
                      ? "text-test"
                      : "text-text-muted",
                )}
              >
                {stage.detail}
                {stage.usedFallback && " · fallback used"}
              </div>
            )}
          </div>
        </div>
        {stage.durationMs !== undefined && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            {(stage.durationMs / 1000).toFixed(1)}s
          </span>
        )}
      </div>
    </motion.div>
  );
}
