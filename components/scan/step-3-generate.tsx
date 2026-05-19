"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LivePreviewCard, type Draft } from "./live-preview-card";
import { ScanParticles } from "./scan-particles";
import { COUNTRIES } from "@/lib/data/countries";
import { CostPreview } from "@/components/credits/cost-preview";
import { ScanPowerUpsToggle } from "@/components/credits/scan-powerups-toggle";
import { scanCostBreakdown, bundleSavings } from "@/lib/credits/helpers";
import { useCreditsStore } from "@/lib/store/credits";
import type { ScanPowerUps } from "@/types/credits";
import { cn } from "@/lib/utils";

export const SCORING_PHASES = [
  { id: "margin", label: "Analyzing margin and pricing", ms: 800 },
  { id: "fit", label: "Matching against country profile", ms: 700 },
  { id: "demand", label: "Predicting demand signal", ms: 1000 },
  { id: "comp", label: "Estimating competition", ms: 900 },
  { id: "creative", label: "Scoring creative potential", ms: 700 },
  { id: "reasoning", label: "Generating reasoning", ms: 1200 },
] as const;

export const VOICE_PHASE = {
  id: "voice",
  label: "Mining Reddit voice (~25s)",
  ms: 24_000,
} as const;

export const TOTAL_MS = SCORING_PHASES.reduce((s, p) => s + p.ms, 0);

type Phase = { id: string; label: string; ms: number };

type Props = {
  draft: Draft;
  context: string;
  phaseIdx: number; // -1 = idle, >=0 = current, SCORING_PHASES.length = done
  running: boolean;
  phases?: readonly Phase[]; // override the default phases (e.g. to append voice)
  powerUps: ScanPowerUps;
  onPowerUpsChange: (next: ScanPowerUps) => void;
  onBack: () => void;
  onStart: () => void;
};

export function Step3Generate({
  draft,
  context,
  phaseIdx,
  running,
  phases = SCORING_PHASES,
  powerUps,
  onPowerUpsChange,
  onBack,
  onStart,
}: Props) {
  const country = draft.targetCountry ? COUNTRIES[draft.targetCountry] : null;
  const totalDone = phaseIdx >= phases.length;
  const progressPct = Math.min(
    100,
    Math.max(0, ((phaseIdx + (running ? 0.5 : 0)) / phases.length) * 100),
  );
  const scanCost = useCreditsStore((s) => s.getScanCost(powerUps));
  const balance = useCreditsStore((s) => s.balance);
  const cantAfford = balance < scanCost;
  const savings = bundleSavings(powerUps);

  return (
    <div>
      {/* Ambient particles when scoring is in flight */}
      <ScanParticles active={running} />

      {/* Progress bar */}
      <div className="fixed inset-x-0 top-24 z-30 h-0.5 w-full bg-transparent">
        <motion.div
          className="h-full bg-go shadow-[0_0_8px_rgba(0,210,106,0.7)]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[5fr_4fr]">
        {/* LEFT — confirmation card */}
        <div className="space-y-5">
          <div className="glass-strong rounded-2xl p-5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Confirming
            </div>
            <h2 className="mt-1 text-2xl font-medium tracking-tight">
              {draft.name || "Untitled product"}
            </h2>
            {country && (
              <div className="mt-1 text-sm text-text-muted">
                Targeting {country.flag} {country.name} · AOV €{country.avgAOV} ·
                CPM idx {country.cpmIndex}
              </div>
            )}
            {context && (
              <p className="mt-3 rounded-md border border-border-soft bg-surface p-3 text-xs text-text-muted">
                {context}
              </p>
            )}
          </div>

          {/* Phases */}
          <ul className="glass space-y-2 rounded-2xl p-4">
            {phases.map((p, i) => {
              const status =
                i < phaseIdx ? "done" : i === phaseIdx && running ? "active" : "future";
              return (
                <li
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors",
                    status === "done" && "text-text",
                    status === "active" && "bg-surface text-text",
                    status === "future" && "text-text-dim",
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center">
                    <AnimatePresence mode="wait">
                      {status === "done" ? (
                        <motion.span
                          key="done"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 20,
                          }}
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-go/15 text-go"
                        >
                          <Check className="h-3 w-3" />
                        </motion.span>
                      ) : status === "active" ? (
                        <Loader2 key="act" className="h-3.5 w-3.5 animate-spin text-text" />
                      ) : (
                        <span
                          key="fut"
                          className="h-1.5 w-1.5 rounded-full bg-border-strong"
                        />
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="flex-1">{p.label}</span>
                </li>
              );
            })}
          </ul>

          {/* Per-scan power-ups + cost */}
          <div className="glass rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text">Power-ups</div>
                <div className="text-xs text-text-muted">
                  Toggle deeper signals for this scan
                </div>
              </div>
              <CostPreview
                cost={scanCost}
                breakdown={scanCostBreakdown(powerUps)}
                showInsufficient
              />
            </div>
            <ScanPowerUpsToggle
              value={powerUps}
              onChange={onPowerUpsChange}
              disabled={running}
            />
            {savings > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-go/10 px-3 py-1 text-[11px] text-go">
                <Sparkles className="h-3 w-3" />
                Full Power Scan bundle saves {savings} credit{savings === 1 ? "" : "s"}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full text-text-muted"
              onClick={onBack}
              disabled={running}
            >
              Back
            </Button>
            <Button
              size="lg"
              className="rounded-full"
              onClick={onStart}
              disabled={running || totalDone}
            >
              {running ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Scoring…
                </>
              ) : totalDone ? (
                "Finalizing…"
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  {cantAfford ? `Need ${scanCost - balance} more credits` : `Generate score (✦ ${scanCost})`}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* RIGHT — preview */}
        <LivePreviewCard draft={draft} />
      </div>
    </div>
  );
}
