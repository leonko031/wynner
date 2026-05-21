"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Brain,
  ChevronDown,
  Copy,
  Heart,
  Layers,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Citations } from "./citations";
import type {
  AwarenessLevel,
  DeepResearchReport,
  EmotionalDriver,
  HookAngle,
} from "@/types/research";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Visual tokens                                                              */
/* -------------------------------------------------------------------------- */

const DRIVER_META: Record<
  EmotionalDriver,
  { label: string; color: string; icon: typeof Sparkles }
> = {
  curiosity: { label: "Curiosity", color: "#5B8DFF", icon: Brain },
  fear: { label: "Fear", color: "#FF7E5F", icon: TrendingUp },
  aspiration: { label: "Aspiration", color: "#A788FF", icon: Sparkles },
  belonging: { label: "Belonging", color: "#FF89C5", icon: Heart },
  fomo: { label: "FOMO", color: "#FFAB40", icon: Zap },
  transformation: { label: "Transformation", color: "#88E5C8", icon: Target },
  validation: { label: "Validation", color: "#A788FF", icon: Heart },
  convenience: { label: "Convenience", color: "#5B8DFF", icon: Layers },
};

const AWARENESS_LABEL: Record<AwarenessLevel, string> = {
  unaware: "Unaware",
  "problem-aware": "Problem-aware",
  "solution-aware": "Solution-aware",
  "product-aware": "Product-aware",
  "most-aware": "Most-aware",
};

/* -------------------------------------------------------------------------- */
/* Section wrapper                                                            */
/* -------------------------------------------------------------------------- */

export function HookAnglesSection({ report }: { report: DeepResearchReport }) {
  const angles = [...report.hookAngles].sort((a, b) => a.rank - b.rank);

  if (angles.length === 0) {
    // Older reports won't have hookAngles populated; render nothing.
    return null;
  }

  const [featured, ...rest] = angles;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <header className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
          The angles
        </div>
        <h2 className="mt-2 font-serif text-3xl text-text md:text-4xl">
          {angles.length} ways to sell this
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Ranked by predicted impact. Every hook is grounded in real customer
          signals from {report.sources.length} sources.
        </p>
      </header>

      {/* Rank 1 — featured */}
      <AngleCard angle={featured} report={report} featured />

      {/* Remaining angles in a 2-column grid */}
      {rest.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {rest.map((angle) => (
            <AngleCard key={angle.id} angle={angle} report={report} />
          ))}
        </div>
      )}
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/* Individual angle card                                                      */
/* -------------------------------------------------------------------------- */

function AngleCard({
  angle,
  report,
  featured,
}: {
  angle: HookAngle;
  report: DeepResearchReport;
  featured?: boolean;
}) {
  const reduce = useReducedMotion();
  const driver = DRIVER_META[angle.emotionalDriver];
  const accent = driver.color;
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(featured ? ["script"] : []),
  );

  const toggle = (key: string) => {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  function copy(text: string, label: string) {
    if (typeof navigator === "undefined") return;
    void navigator.clipboard?.writeText(text);
    toast.success(`${label} copied`);
  }

  const confidenceDots =
    angle.confidence === "high" ? 3 : angle.confidence === "medium" ? 2 : 1;

  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "glass relative overflow-hidden rounded-3xl p-6 transition-all md:p-8",
        featured && "md:p-10",
      )}
      style={{
        borderColor: `${accent}33`,
        boxShadow: featured
          ? `0 0 0 1px ${accent}33, 0 30px 60px -20px ${accent}55, inset 0 1px 0 0 var(--surface-glass-highlight)`
          : `0 0 0 1px ${accent}22, 0 14px 28px -18px ${accent}44, inset 0 1px 0 0 var(--surface-glass-highlight)`,
      }}
    >
      {/* Top strip — rank + meta */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full text-white",
              featured ? "h-10 w-10" : "h-8 w-8",
            )}
            style={{ backgroundColor: accent }}
          >
            <span className={cn("font-serif", featured ? "text-base" : "text-sm")}>
              #{angle.rank}
            </span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full border border-border-soft bg-surface/70 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
              {AWARENESS_LABEL[angle.awarenessLevel]}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
              style={{ backgroundColor: `${accent}1A`, color: accent }}
            >
              <driver.icon className="h-3 w-3" />
              {driver.label}
            </span>
          </div>
        </div>
        <div
          className="flex items-center gap-1"
          title={`Confidence: ${angle.confidence}`}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor:
                  i < confidenceDots ? accent : "var(--border-soft)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Primary hook — the headline */}
      <div className="group relative mt-5">
        <p
          className={cn(
            "font-serif italic leading-tight text-text",
            featured ? "text-2xl md:text-3xl" : "text-xl md:text-2xl",
          )}
        >
          “{angle.primaryHook}”
        </p>
        <button
          type="button"
          onClick={() => copy(angle.primaryHook, "Hook")}
          aria-label="Copy hook"
          className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border border-border-soft bg-surface/70 text-text-muted opacity-0 transition-opacity hover:text-text group-hover:opacity-100"
        >
          <Copy className="h-3 w-3" />
        </button>
      </div>

      {/* Grounded-in signals — quick visual proof */}
      {angle.groundedInSignals.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-text-muted">
          {angle.groundedInSignals.slice(0, 3).map((sig, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-surface/70 px-2 py-0.5"
            >
              <span className="h-1 w-1 rounded-full" style={{ backgroundColor: accent }} />
              {sig}
            </span>
          ))}
        </div>
      )}

      {/* Expandable sections */}
      <div className="mt-5 space-y-1.5">
        {angle.hookVariants.length > 0 && (
          <Disclosure
            label="Hook variants"
            count={angle.hookVariants.length}
            isOpen={expanded.has("variants")}
            onToggle={() => toggle("variants")}
          >
            <ul className="space-y-2">
              {angle.hookVariants.map((v, i) => (
                <li key={i} className="group relative rounded-xl bg-surface/60 p-3">
                  <p className="pr-9 font-serif italic text-text">“{v}”</p>
                  <button
                    type="button"
                    onClick={() => copy(v, "Variant")}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border-soft bg-surface text-text-muted opacity-0 group-hover:opacity-100 hover:text-text"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </Disclosure>
        )}

        <Disclosure
          label="The full script"
          isOpen={expanded.has("script")}
          onToggle={() => toggle("script")}
        >
          <ScriptList script={angle.scriptStructure} />
        </Disclosure>

        {(angle.firstFrameDescription || angle.visualHookIdeas.length > 0) && (
          <Disclosure
            label="Visual direction"
            isOpen={expanded.has("visuals")}
            onToggle={() => toggle("visuals")}
          >
            <div className="space-y-3">
              <div className="rounded-xl border border-border-soft bg-surface/60 p-3 text-sm text-text">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  First frame
                </span>
                {angle.firstFrameDescription}
              </div>
              {angle.visualHookIdeas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {angle.visualHookIdeas.map((idea, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-border-soft bg-surface/60 px-3 py-1 text-xs text-text"
                    >
                      {idea}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Disclosure>
        )}

        <Disclosure
          label="Platform fit"
          isOpen={expanded.has("platforms")}
          onToggle={() => toggle("platforms")}
        >
          <div className="space-y-2.5">
            {(["meta", "tiktok", "youtube", "googleAds"] as const).map((p) => {
              const entry = angle.platformFit[p];
              const label = p === "googleAds" ? "Google Ads" : p === "tiktok" ? "TikTok" : p[0].toUpperCase() + p.slice(1);
              return (
                <div key={p}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">{label}</span>
                    <span className="font-mono tabular-nums text-text">
                      {entry.score}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface/60">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${entry.score}%`,
                        backgroundColor: accent,
                      }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-text-dim">
                    {entry.reasoning}
                  </div>
                </div>
              );
            })}
          </div>
        </Disclosure>

        {angle.captionVariations.length > 0 && (
          <Disclosure
            label="Caption variations"
            count={angle.captionVariations.length}
            isOpen={expanded.has("captions")}
            onToggle={() => toggle("captions")}
          >
            <ul className="space-y-2">
              {angle.captionVariations.map((c, i) => (
                <li key={i} className="group relative rounded-xl bg-surface/60 p-3">
                  <p className="pr-9 text-sm text-text">{c}</p>
                  <button
                    type="button"
                    onClick={() => copy(c, "Caption")}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border-soft bg-surface text-text-muted opacity-0 group-hover:opacity-100 hover:text-text"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </Disclosure>
        )}

        {angle.ctaVariations.length > 0 && (
          <Disclosure
            label="CTA variations"
            isOpen={expanded.has("ctas")}
            onToggle={() => toggle("ctas")}
          >
            <div className="flex flex-wrap gap-1.5">
              {angle.ctaVariations.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => copy(c, "CTA")}
                  className="rounded-full border border-border-soft bg-surface/60 px-3 py-1 text-xs text-text hover:border-aurora-purple/45"
                >
                  {c}
                </button>
              ))}
            </div>
          </Disclosure>
        )}

        <Disclosure
          label="Why this works"
          isOpen={expanded.has("why")}
          onToggle={() => toggle("why")}
        >
          <p className="text-sm leading-relaxed text-text">
            {angle.whyThisWorks}
            <Citations sources={angle.sources} all={report.sources} className="ml-0.5" />
          </p>
        </Disclosure>
      </div>

      {/* Bottom action row */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-5">
        <span
          className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-full border border-dashed border-border-soft px-3 text-xs text-text-dim"
          title="Coming soon — AI-generated ad scripts + creative briefs"
        >
          <Sparkles className="h-3 w-3" />
          Generate ads (soon)
        </span>
      </div>
    </motion.article>
  );
}

/* -------------------------------------------------------------------------- */
/* Small primitives                                                           */
/* -------------------------------------------------------------------------- */

function Disclosure({
  label,
  count,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border-soft">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-colors hover:bg-surface/60"
      >
        <span className="flex items-center gap-2 text-text">
          <span>{label}</span>
          {count !== undefined && (
            <span className="font-mono text-[10px] text-text-muted">{count}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-text-muted transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen && <div className="border-t border-border-soft px-4 py-4">{children}</div>}
    </div>
  );
}

function ScriptList({ script }: { script: HookAngle["scriptStructure"] }) {
  const beats: { label: string; value?: string }[] = [
    { label: "Opening", value: script.opening },
    { label: "Problem", value: script.problem },
    { label: "Agitation", value: script.agitation },
    { label: "Solution", value: script.solution },
    { label: "Proof", value: script.proof },
    { label: "CTA", value: script.cta },
  ];
  return (
    <ol className="space-y-3">
      {beats
        .filter((b) => Boolean(b.value))
        .map((b) => (
          <li key={b.label}>
            <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
              {b.label}
            </div>
            <div className="mt-0.5 text-sm leading-relaxed text-text">{b.value}</div>
          </li>
        ))}
    </ol>
  );
}
