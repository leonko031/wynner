"use client";

import { motion } from "framer-motion";
import type { DeepResearchReport, Verdict } from "@/types/research";
import { ConfidencePill, ResultsSection } from "./section";

const VERDICT_META: Record<Verdict, { label: string; color: string }> = {
  go: { label: "GO LIVE", color: "#3DD68C" },
  test: { label: "TEST IT", color: "#FFAB40" },
  risky: { label: "PROCEED WITH CARE", color: "#FF7E5F" },
  skip: { label: "SKIP", color: "#FF5C7C" },
};

export function FinalVerdictSection({ report }: { report: DeepResearchReport }) {
  const v = report.finalVerdict;
  const verdict = VERDICT_META[v.verdict];

  return (
    <ResultsSection eyebrow="Final verdict" title="The decision">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55 }}
        className="glass-strong rounded-3xl p-8 md:p-10"
        style={{
          boxShadow: `0 0 0 1px ${verdict.color}40, 0 32px 80px -20px ${verdict.color}45, 0 0 60px ${verdict.color}26`,
        }}
      >
        <div className="flex flex-wrap items-baseline gap-4">
          <span
            className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold tracking-wider"
            style={{
              backgroundColor: `${verdict.color}26`,
              color: verdict.color,
              border: `1px solid ${verdict.color}50`,
              boxShadow: `0 0 24px ${verdict.color}55`,
            }}
          >
            {verdict.label}
          </span>
          <span className="font-mono text-3xl font-medium tabular-nums tracking-tight text-text">
            {v.sellScore}
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-text-dim">
            / 100
          </span>
        </div>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-text md:text-lg">
          {v.summary}
        </p>

        {v.comparableProducts.length > 0 && (
          <div className="mt-8">
            <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Comparable past winners
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              {v.comparableProducts.map((c, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border-soft bg-surface/50 p-4"
                >
                  <div className="text-sm font-medium text-text">{c.name}</div>
                  <p className="mt-1 text-xs leading-snug text-text-muted">{c.why}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <ConfidencePill level={v.confidenceLevel} />
        </div>
      </motion.div>
    </ResultsSection>
  );
}
