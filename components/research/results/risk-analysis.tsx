"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { DeepResearchReport, Severity } from "@/types/research";
import { ConfidencePill, ResultsSection } from "./section";

const SEVERITY_META: Record<Severity, { label: string; color: string; glow: string }> = {
  critical: { label: "Critical", color: "#FF5C7C", glow: "rgba(255,92,124,0.45)" },
  high: { label: "High", color: "#FF7E5F", glow: "rgba(255,126,95,0.40)" },
  medium: { label: "Medium", color: "#FFAB40", glow: "rgba(255,171,64,0.35)" },
  low: { label: "Low", color: "#5B8DFF", glow: "rgba(91,141,255,0.30)" },
};

export function RiskAnalysisSection({ report }: { report: DeepResearchReport }) {
  const r = report.riskAnalysis;
  if (!r) return null;
  return (
    <ResultsSection
      eyebrow="Risk analysis"
      title="What could go wrong"
      subtitle="Surface every red flag before you spend a dollar."
    >
      <div className="space-y-3">
        {r.redFlags.map((flag, i) => {
          const meta = SEVERITY_META[flag.severity];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass relative overflow-hidden rounded-2xl p-5 pl-6"
              style={{
                boxShadow: `inset 0 1px 0 0 var(--surface-glass-highlight), 0 12px 28px -12px ${meta.glow}`,
              }}
            >
              {/* Severity color bar */}
              <span
                aria-hidden
                className="absolute left-0 top-0 h-full w-1.5"
                style={{ background: meta.color, boxShadow: `0 0 16px ${meta.glow}` }}
              />
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${meta.color}1A`,
                      color: meta.color,
                      border: `1px solid ${meta.color}45`,
                    }}
                  >
                    {flag.severity === "critical" || flag.severity === "high" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <ShieldAlert className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="font-mono text-[10px] uppercase tracking-wider"
                        style={{ color: meta.color }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-text">{flag.description}</p>
                    <div className="mt-2 rounded-xl border border-border-soft bg-surface/50 p-3 text-xs">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                        Mitigation
                      </div>
                      <p className="mt-1 leading-relaxed text-text-muted">{flag.mitigation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <ConfidencePill level={r.confidenceLevel} />
      </div>
    </ResultsSection>
  );
}
