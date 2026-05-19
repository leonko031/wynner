"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageSquare } from "lucide-react";
import { useState } from "react";
import type {
  AdAngle,
  AwarenessLevel,
  DeepResearchReport,
  Persona,
} from "@/types/research";
import { ConfidencePill, ResultsSection } from "./section";
import { cn } from "@/lib/utils";

const AWARENESS_META: Record<AwarenessLevel, { label: string; color: string }> = {
  unaware: { label: "Unaware", color: "#5B8DFF" },
  "problem-aware": { label: "Problem-aware", color: "#A788FF" },
  "solution-aware": { label: "Solution-aware", color: "#FF89C5" },
  "product-aware": { label: "Product-aware", color: "#FFAB40" },
  "most-aware": { label: "Most aware", color: "#3DD68C" },
};

function platformIcon(name: "meta" | "tiktok" | "googleAds"): string {
  if (name === "meta") return "M";
  if (name === "tiktok") return "T";
  return "G";
}

export function SixAngles({ report }: { report: DeepResearchReport }) {
  const angles = report.adAngles;
  if (angles.length === 0) return null;
  const byId = new Map<string, Persona>(report.personas.map((p) => [p.id, p]));

  return (
    <ResultsSection
      eyebrow="Creative angles"
      title="Six ways to sell this"
      subtitle="Ladder across awareness levels. Click any to expand the script."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {angles.map((a, i) => (
          <AngleCard key={a.id} angle={a} index={i} persona={byId.get(a.targetPersonaId)} />
        ))}
      </div>
    </ResultsSection>
  );
}

function AngleCard({
  angle,
  index,
  persona,
}: {
  angle: AdAngle;
  index: number;
  persona?: Persona;
}) {
  const [open, setOpen] = useState(false);
  const meta = AWARENESS_META[angle.awarenessLevel];

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      className="glass flex flex-col gap-3 rounded-3xl p-5"
      style={{
        boxShadow: `0 0 0 1px ${meta.color}24, 0 16px 36px -18px ${meta.color}40`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
          style={{
            color: meta.color,
            background: `${meta.color}1A`,
            border: `1px solid ${meta.color}40`,
          }}
        >
          {meta.label}
        </span>
        <ConfidencePill level={angle.confidenceLevel} />
      </div>

      <h3 className="text-xl font-medium tracking-tight text-text">{angle.angle}</h3>

      {/* Hook quote */}
      <div className="relative rounded-2xl border border-border-soft bg-surface/40 p-4">
        <MessageSquare className="absolute right-3 top-3 h-4 w-4 text-text-dim" />
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          The hook
        </div>
        <p className="mt-1 text-base italic leading-snug text-text">&ldquo;{angle.hook}&rdquo;</p>
      </div>

      {/* Platform fit */}
      <div className="flex items-center gap-3">
        {(["meta", "tiktok", "googleAds"] as const).map((p) => {
          const score = angle.platformFit[p];
          const color =
            score >= 70 ? "#3DD68C" : score >= 40 ? "#FFAB40" : "#FF7E5F";
          return (
            <div key={p} className="flex flex-1 items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md font-mono text-[11px] font-medium"
                style={{
                  background: `${color}1A`,
                  color,
                  border: `1px solid ${color}45`,
                }}
              >
                {platformIcon(p)}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-elevated">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${score}%`, background: color }}
                />
              </div>
              <span className="font-mono text-[10px] tabular-nums text-text-dim">
                {score}
              </span>
            </div>
          );
        })}
      </div>

      {/* Target persona pill */}
      {persona && (
        <div className="text-xs text-text-muted">
          For{" "}
          <span className="inline-flex items-center rounded-full border border-border-soft bg-surface/70 px-2 py-0.5 text-text">
            {persona.name}
          </span>
        </div>
      )}

      {/* Script structure */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-auto flex items-center justify-between rounded-xl border border-border-soft bg-surface/40 px-3 py-2 text-left text-xs hover:bg-surface/60"
      >
        <span className="font-mono uppercase tracking-wider text-text-dim">
          Script structure
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-text-dim transition-transform", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden text-xs leading-relaxed"
          >
            <div className="space-y-2">
              <ScriptRow label="Opening" text={angle.scriptStructure.opening} />
              <ScriptRow label="Middle" text={angle.scriptStructure.middle} />
              <ScriptRow label="Close" text={angle.scriptStructure.close} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function ScriptRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-border-soft/60 bg-surface/40 p-2">
      <span className="font-mono text-[9px] uppercase tracking-wider text-text-dim min-w-[52px]">
        {label}
      </span>
      <span className="text-text leading-snug">{text}</span>
    </div>
  );
}
