"use client";

import { motion } from "framer-motion";
import { Lightbulb, ShieldAlert, ShieldCheck } from "lucide-react";
import type { DeepResearchReport } from "@/types/research";
import { ConfidencePill, ResultsSection } from "./section";

const SAT_COLORS: Record<string, string> = {
  untapped: "#3DD68C",
  emerging: "#5B8DFF",
  competitive: "#FFAB40",
  saturated: "#FF5C7C",
};

export function CompetitiveLandscape({ report }: { report: DeepResearchReport }) {
  const c = report.competitorLandscape;
  if (!c) return null;
  const satColor = SAT_COLORS[c.saturationLevel] ?? "#FFAB40";

  return (
    <ResultsSection
      eyebrow="Competitive landscape"
      title="Who else is selling this"
    >
      {/* Saturation meter */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Saturation
            </div>
            <div className="mt-1 flex items-baseline gap-3">
              <span
                className="text-3xl font-medium tabular-nums tracking-tight"
                style={{ color: satColor }}
              >
                {c.saturationScore}
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
                {c.saturationLevel}
              </span>
            </div>
          </div>
          <ConfidencePill level={c.confidenceLevel} />
        </div>
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: `${c.saturationScore}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: `linear-gradient(90deg, #3DD68C, #FFAB40, #FF5C7C)`,
              boxShadow: `0 0 8px ${satColor}aa`,
            }}
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-text-dim">
          <span>untapped</span>
          <span>emerging</span>
          <span>competitive</span>
          <span>saturated</span>
        </div>
      </div>

      {/* Archetypes */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {c.topAdvertiserArchetypes.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="glass rounded-2xl p-5"
          >
            <h3 className="text-base font-medium tracking-tight text-text">{a.name}</h3>
            <p className="mt-1 text-sm text-text-muted">{a.approach}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-go">
                  <ShieldCheck className="h-3 w-3" />
                  Strengths
                </div>
                <ul className="space-y-1">
                  {a.strengths.map((s, j) => (
                    <li key={j} className="text-xs leading-snug text-text">• {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-skip">
                  <ShieldAlert className="h-3 w-3" />
                  Weaknesses
                </div>
                <ul className="space-y-1">
                  {a.weaknesses.map((s, j) => (
                    <li key={j} className="text-xs leading-snug text-text">• {s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Market gaps callout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="glass mt-4 rounded-3xl p-6"
        style={{
          boxShadow:
            "0 0 0 1px rgba(167,136,255,0.40), 0 20px 50px -16px rgba(167,136,255,0.40)",
        }}
      >
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-aurora-purple">
          <Lightbulb className="h-3.5 w-3.5" />
          Market gaps
        </div>
        <ul className="mt-3 space-y-2">
          {c.marketGaps.map((g, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-text">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-aurora-purple" />
              <span className="leading-snug">{g}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </ResultsSection>
  );
}
