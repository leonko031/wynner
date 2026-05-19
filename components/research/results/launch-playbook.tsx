"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Target } from "lucide-react";
import type { DeepResearchReport } from "@/types/research";
import { ConfidencePill, ResultsSection } from "./section";
import { cn } from "@/lib/utils";

export function LaunchPlaybookSection({ report }: { report: DeepResearchReport }) {
  // Hooks must run unconditionally — keep useState before the early return.
  const [openDay, setOpenDay] = useState<number | null>(null);
  const pb = report.launchPlaybook;
  if (!pb) return null;

  return (
    <ResultsSection
      eyebrow="Launch playbook"
      title="Your 14-day playbook"
      subtitle="Sequenced from creative testing through scaling and retargeting."
    >
      {/* Calendar grid */}
      <div className="glass rounded-3xl p-4">
        <div className="grid grid-cols-7 gap-2">
          {pb.dailyActions.map((day) => {
            const active = openDay === day.day;
            return (
              <button
                key={day.day}
                type="button"
                onClick={() => setOpenDay(active ? null : day.day)}
                aria-expanded={active}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-all",
                  active
                    ? "border-aurora-blue/50 bg-aurora-blue/10"
                    : "border-border-soft bg-surface/50 hover:border-border-strong",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                    Day
                  </span>
                  <span className="font-mono text-lg font-medium tabular-nums leading-none text-text">
                    {day.day}
                  </span>
                </div>
                <div className="mt-2 text-xs leading-snug text-text">{day.focus}</div>
                <div className="mt-2 font-mono text-[10px] tabular-nums text-text-dim">
                  {day.actions.length} actions · {day.creativeCount} creatives
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded day */}
      <AnimatePresence initial={false}>
        {openDay !== null && (() => {
          const d = pb.dailyActions.find((x) => x.day === openDay);
          if (!d) return null;
          return (
            <motion.div
              key={openDay}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="glass mt-4 rounded-3xl p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-medium tracking-tight text-text">
                    Day {d.day} — {d.focus}
                  </h3>
                  <span className="font-mono text-xs tabular-nums text-text-dim">
                    {d.creativeCount} creatives
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                      Actions
                    </div>
                    <ul className="space-y-1.5">
                      {d.actions.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-aurora-blue" />
                          <span className="leading-snug">{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                      Budget
                    </div>
                    <div className="rounded-xl border border-border-soft bg-surface/50 p-3 text-sm text-text">
                      {d.budgetSplit}
                    </div>
                    <div className="mt-3 mb-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                      KPIs to check
                    </div>
                    <ul className="space-y-1">
                      {d.kpis.map((k, i) => (
                        <li
                          key={i}
                          className="inline-flex items-center gap-1 mr-1.5 rounded-full border border-border-soft bg-surface/50 px-2 py-0.5 text-[11px] text-text"
                        >
                          <Target className="h-3 w-3 text-text-dim" />
                          {k}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* KPI dashboard */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatBig label="Total budget" value={`$${pb.totalBudget.toLocaleString()}`} color="#5B8DFF" />
        <StatBig label="Expected ROAS" value={`${pb.expectedROAS}×`} color="#A788FF" />
        <div className="glass flex items-center justify-between rounded-2xl p-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Playbook confidence
            </div>
            <div className="mt-2"><ConfidencePill level={pb.confidenceLevel} /></div>
          </div>
        </div>
      </div>
    </ResultsSection>
  );
}

function StatBig({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="glass rounded-2xl p-5"
      style={{ boxShadow: `inset 0 1px 0 0 var(--surface-glass-highlight), 0 0 32px -12px ${color}55` }}
    >
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">{label}</div>
      <div className="mt-1 text-3xl font-medium tabular-nums tracking-tight text-text">{value}</div>
    </div>
  );
}
