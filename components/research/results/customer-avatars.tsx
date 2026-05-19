"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Quote } from "lucide-react";
import { useState } from "react";
import type { DeepResearchReport, Persona } from "@/types/research";
import { ConfidencePill, ResultsSection } from "./section";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = ["#5B8DFF", "#A788FF", "#FF89C5", "#FFB088", "#88E5C8"];

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initial(name: string): string {
  return (name.trim()[0] ?? "?").toUpperCase();
}

export function CustomerAvatars({ report }: { report: DeepResearchReport }) {
  const personas = report.personas;
  if (personas.length === 0) return null;
  return (
    <ResultsSection
      eyebrow="Customer avatars"
      title="Meet your customers"
      subtitle="Real archetypes — not focus-group caricatures."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {personas.map((p, i) => (
          <PersonaCard key={p.id} persona={p} index={i} />
        ))}
      </div>
    </ResultsSection>
  );
}

function PersonaCard({ persona, index }: { persona: Persona; index: number }) {
  const color = colorFor(persona.name);
  const [showDay, setShowDay] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ rotateY: 4, y: -4 }}
      className="glass flex flex-col gap-4 rounded-3xl p-5"
      style={{
        boxShadow: `inset 0 1px 0 0 var(--surface-glass-highlight), 0 24px 60px -20px ${color}40`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Avatar */}
      <div className="flex items-start gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-medium text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.25)]"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}AA, ${color}55)`,
          }}
          aria-hidden
        >
          {initial(persona.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-medium tracking-tight text-text">{persona.name}</h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
            <span>{persona.age}</span>
            <span aria-hidden>·</span>
            <span>{persona.occupation}</span>
          </div>
          <div className="mt-1.5 inline-flex items-center rounded-full border border-border-soft bg-surface/70 px-2 py-0.5 text-[11px] text-text-muted">
            {persona.location}
          </div>
        </div>
      </div>

      {/* A day in their life */}
      <div>
        <button
          type="button"
          onClick={() => setShowDay((v) => !v)}
          aria-expanded={showDay}
          className="flex w-full items-center justify-between rounded-xl border border-border-soft bg-surface/40 px-3 py-2 text-left text-xs hover:bg-surface/60"
        >
          <span className="font-mono uppercase tracking-wider text-text-dim">
            A day in their life
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-text-dim transition-transform",
              showDay && "rotate-180",
            )}
          />
        </button>
        <AnimatePresence initial={false}>
          {showDay && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mt-2 overflow-hidden text-xs leading-relaxed text-text-muted"
            >
              {persona.dayInTheLife}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Pain points + outcomes */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Pain points
          </div>
          <ul className="space-y-1">
            {persona.painPoints.slice(0, 5).map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-skip" />
                <span className="leading-snug">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Desired outcomes
          </div>
          <ul className="space-y-1">
            {persona.desiredOutcomes.slice(0, 4).map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-go" />
                <span className="leading-snug">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Language patterns */}
      <div>
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-dim">
          How they actually talk
        </div>
        <ul className="space-y-1.5">
          {persona.languagePatterns.slice(0, 4).map((q, i) => (
            <li key={i} className="flex items-start gap-2 text-xs italic leading-snug text-text-muted">
              <Quote className="mt-0.5 h-3 w-3 shrink-0 text-text-dim" />
              <span>&ldquo;{q}&rdquo;</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex items-center justify-between">
        <ConfidencePill level={persona.confidenceLevel} />
      </div>
    </motion.article>
  );
}
