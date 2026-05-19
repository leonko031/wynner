"use client";

import { motion } from "framer-motion";
import type { DeepResearchReport } from "@/types/research";
import { ConfidencePill, ResultsSection } from "./section";

const PILLAR_LABELS = {
  margin: "Margin",
  marketFit: "Market fit",
  demand: "Demand",
  competition: "Competition",
  creative: "Creative",
} as const;

function pillarColor(v: number) {
  if (v >= 75) return "#3DD68C";
  if (v >= 50) return "#FFAB40";
  return "#FF7E5F";
}

export function ExecutiveSummary({ report }: { report: DeepResearchReport }) {
  const v = report.finalVerdict;
  return (
    <ResultsSection eyebrow="Executive summary" title="The TL;DR">
      <div className="glass rounded-3xl p-6 md:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Pillar bars */}
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Five-pillar score
            </div>
            <ul className="space-y-2.5">
              {(Object.keys(PILLAR_LABELS) as (keyof typeof PILLAR_LABELS)[]).map(
                (k, i) => {
                  const value = v.pillars[k];
                  const color = pillarColor(value);
                  return (
                    <li key={k}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">{PILLAR_LABELS[k]}</span>
                        <span
                          className="font-mono tabular-nums"
                          style={{ color }}
                        >
                          {value}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${value}%` }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 1.0,
                            delay: i * 0.06,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          style={{
                            background: color,
                            boxShadow: `0 0 8px ${color}66`,
                          }}
                        />
                      </div>
                    </li>
                  );
                },
              )}
            </ul>
          </div>

          {/* Verdict reasoning */}
          <div className="md:col-span-1">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Verdict reasoning
            </div>
            <p className="text-sm leading-relaxed text-text">{v.summary}</p>
          </div>

          {/* Top angle */}
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Top creative angle
            </div>
            <div
              className="rounded-2xl border border-aurora-purple/35 bg-aurora-purple/10 p-4"
              style={{ boxShadow: "0 0 28px -10px rgba(167,136,255,0.45)" }}
            >
              <p className="text-sm leading-relaxed text-text">{v.topAngle}</p>
            </div>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-6 flex items-center justify-between border-t border-border-soft pt-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Overall confidence
          </span>
          <ConfidencePill level={v.confidenceLevel} />
        </div>
      </div>
    </ResultsSection>
  );
}
