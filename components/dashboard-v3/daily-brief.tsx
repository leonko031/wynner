"use client";

import { motion, useReducedMotion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AiOrb } from "@/components/research/ai-orb";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SectionHeader } from "./editorial-primitives";
import type { BriefingChip, DailyBriefing } from "@/types/briefing";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import { cn } from "@/lib/utils";

const REFRESH_COST = 1;

type Props = {
  briefing: DailyBriefing | null;
  loading: boolean;
  cached: boolean;
  fellBack: boolean;
  generatedAt: string | null;
  isAdmin: boolean;
  canAfford: boolean;
  onRegenerate: () => Promise<void> | void;
  marketVibe: "hot" | "active" | "steady" | "quiet";
  signals: Signal[];
  /** Pass-through for the section <header id> so keyboard shortcuts target it. */
  sectionId: string;
};

export type Signal = {
  id: string;
  ts: string;
  message: string;
  accent: string;
};

/**
 * Daily brief section: 66/33 split.
 *
 *   Left  — the article with editorial drop cap, two paragraphs, an italic
 *           tactical recommendation, and three magazine-style chips.
 *   Right — the living sidebar: AI orb, live signal feed, market pulse chip.
 */
export function DailyBrief({
  briefing,
  loading,
  cached,
  fellBack,
  generatedAt,
  isAdmin,
  canAfford,
  onRegenerate,
  marketVibe,
  signals,
  sectionId,
}: Props) {
  const subHeadline = briefing?.subHeadline ?? "Generated for you in the last 24 hours";

  return (
    <section className="pt-24 md:pt-32">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-12">
        <SectionHeader
          id={sectionId}
          kicker="TODAY'S BRIEFING"
          headline="What Wynner is watching"
          subHeadline={subHeadline}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <BriefingArticle
            briefing={briefing}
            loading={loading}
            cached={cached}
            fellBack={fellBack}
            generatedAt={generatedAt}
            isAdmin={isAdmin}
            canAfford={canAfford}
            onRegenerate={onRegenerate}
          />
          <LivingSidebar marketVibe={marketVibe} signals={signals} />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* The article                                                                 */
/* -------------------------------------------------------------------------- */

function BriefingArticle({
  briefing,
  loading,
  cached,
  fellBack,
  generatedAt,
  isAdmin,
  canAfford,
  onRegenerate,
}: Omit<Props, "marketVibe" | "signals" | "sectionId">) {
  const [confirming, setConfirming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function handleConfirm() {
    setConfirming(false);
    setRefreshing(true);
    try {
      await onRegenerate();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 180, damping: 24, delay: 0.45 }}
      className="glass relative rounded-[28px] p-8 md:p-12"
    >
      {loading || !briefing ? (
        <BriefingLoading />
      ) : (
        <>
          {/* Paragraph 1 — with drop cap */}
          <p className="font-sans text-base leading-[1.7] text-text md:text-[17px]">
            <DropCap letter={briefing.paragraphs[0]?.[0] ?? "T"} />
            {briefing.paragraphs[0]?.slice(1)}
          </p>

          {/* Paragraph 2 */}
          <p className="mt-6 text-base leading-[1.7] text-text-muted md:text-[17px]">
            {briefing.paragraphs[1]}
          </p>

          {/* Dividing rule */}
          <div className="mt-8 flex items-center gap-3">
            <div className="h-px w-12 bg-border-strong" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
              The recommendation
            </span>
          </div>

          {/* Paragraph 3 — tactical, italic, larger */}
          <p className="mt-4 font-serif text-2xl italic leading-[1.3] text-text md:text-[28px]">
            {briefing.paragraphs[2]}
          </p>

          {/* Chips */}
          <div className="mt-8 flex flex-wrap gap-2">
            {briefing.chips.map((chip, i) => (
              <BriefingChipPill key={`${chip.label}-${i}`} chip={chip} index={i} />
            ))}
          </div>

          {/* Byline */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-4 text-[11px] text-text-dim">
            <span>
              Written by Wynner ·{" "}
              {generatedAt ? new Date(generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "today"}
              {cached && <span className="ml-2">· cached</span>}
              {fellBack && <span className="ml-2 text-aurora-peach">· fallback</span>}
            </span>
            <div className="flex items-center gap-2">
              {confirming ? (
                <ConfirmBar
                  isAdmin={isAdmin}
                  cost={REFRESH_COST}
                  onCancel={() => setConfirming(false)}
                  onConfirm={() => void handleConfirm()}
                />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAdmin && !canAfford) {
                          toast.error("Not enough credits", {
                            description: "Top up to regenerate your briefing.",
                          });
                          return;
                        }
                        setConfirming(true);
                      }}
                      disabled={refreshing}
                      aria-label="Regenerate briefing"
                      className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-3 text-[11px] text-text-muted transition-all hover:border-aurora-purple/45 hover:text-text disabled:opacity-50"
                    >
                      <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
                      Refresh
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {isAdmin
                      ? "Free for admins"
                      : `Costs ✦ ${REFRESH_COST}`}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </>
      )}
    </motion.article>
  );
}

function DropCap({ letter }: { letter: string }) {
  return (
    <span
      aria-hidden
      className="float-left mr-3 select-none font-serif text-[88px] leading-[0.85]"
      style={{
        background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        marginTop: "0.1em",
        textShadow: "0 0 28px rgba(167,136,255,0.25)",
      }}
    >
      {letter}
    </span>
  );
}

function BriefingLoading() {
  return (
    <div className="min-h-[280px]">
      <div className="flex items-center gap-3">
        <AiOrb size={64} intensity={0.9} />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
          Wynner is composing today&apos;s briefing…
        </span>
      </div>
      <div className="mt-8 space-y-3">
        <div className="h-4 w-11/12 rounded-full shimmer-bg bg-surface-elevated" />
        <div className="h-4 w-4/5 rounded-full shimmer-bg bg-surface-elevated" />
        <div className="h-4 w-3/4 rounded-full shimmer-bg bg-surface-elevated" />
      </div>
    </div>
  );
}

function BriefingChipPill({ chip, index }: { chip: BriefingChip; index: number }) {
  const href = hrefForChip(chip);
  const inner = (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 * index, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-border-soft bg-surface/70 px-4 text-xs text-text backdrop-blur-md transition-colors hover:border-aurora-purple/45"
    >
      {chip.emoji && <span aria-hidden>{chip.emoji}</span>}
      <span className="font-medium">{chip.label}</span>
      <span aria-hidden className="text-text-dim">↗</span>
    </motion.span>
  );
  if (!href) {
    return inner;
  }
  return (
    <Link href={href} className="focus-visible:outline-none">
      {inner}
    </Link>
  );
}

function hrefForChip(chip: BriefingChip): string | null {
  switch (chip.action) {
    case "filter_niche":
      // Vault is gone — niche filters now seed a new scan in that niche.
      return chip.value ? `/scan?niche=${encodeURIComponent(chip.value)}` : null;
    case "filter_country":
      return chip.value ? `/scan?country=${encodeURIComponent(chip.value)}` : null;
    case "open_scan":
      return "/scan";
    case "info":
    default:
      return null;
  }
}

function ConfirmBar({
  isAdmin,
  cost,
  onCancel,
  onConfirm,
}: {
  isAdmin: boolean;
  cost: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-2 py-1">
      <button
        type="button"
        onClick={onConfirm}
        className="rounded-full bg-aurora-purple px-2.5 py-0.5 text-[10px] font-medium text-white hover:brightness-110"
      >
        {isAdmin ? "Regenerate" : `Spend ✦ ${cost}`}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full px-2 py-0.5 text-[10px] text-text-muted hover:text-text"
      >
        Cancel
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The living sidebar                                                          */
/* -------------------------------------------------------------------------- */

function LivingSidebar({
  marketVibe,
  signals,
}: {
  marketVibe: Props["marketVibe"];
  signals: Signal[];
}) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 180, damping: 24, delay: 0.55 }}
      className="glass flex flex-col gap-8 rounded-[28px] p-6 md:p-8"
    >
      {/* Orb */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <AiOrb size={140} intensity={0.55} />
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <PulsingDot />
          <span className="font-mono uppercase tracking-[0.15em]">Wynner is observing</span>
        </div>
      </div>

      <div className="h-px bg-border-soft" />

      {/* Signal feed */}
      <SignalFeed signals={signals} />

      <div className="h-px bg-border-soft" />

      {/* Market pulse chip */}
      <MarketPulseChip vibe={marketVibe} />
    </motion.aside>
  );
}

function PulsingDot() {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className="block h-1.5 w-1.5 rounded-full bg-go"
      animate={reduce ? undefined : { opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function SignalFeed({ signals }: { signals: Signal[] }) {
  const reduce = useReducedMotion();
  const visible = signals.slice(0, 5);

  return (
    <div>
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
        Live signal feed
      </div>
      <ul className="space-y-3">
        {visible.length === 0 ? (
          <li className="text-xs text-text-dim">Listening for new signals…</li>
        ) : (
          visible.map((s) => (
            <motion.li
              key={s.id}
              initial={reduce ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-[40px_1fr] gap-3 text-[12px]"
            >
              <span className="pt-0.5 font-mono tabular-nums text-text-dim">
                {s.ts}
              </span>
              <div className="flex items-start gap-2">
                <span
                  className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: s.accent }}
                />
                <span className="text-text">{s.message}</span>
              </div>
            </motion.li>
          ))
        )}
      </ul>
    </div>
  );
}

function MarketPulseChip({ vibe }: { vibe: Props["marketVibe"] }) {
  const reduce = useReducedMotion();
  const pos = { hot: 92, active: 70, steady: 50, quiet: 22 }[vibe];
  const emoji = { hot: "🔥", active: "📈", steady: "🌤️", quiet: "🌙" }[vibe];
  const label = {
    hot: "hot",
    active: "active",
    steady: "steady",
    quiet: "quiet",
  }[vibe];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="w-full text-left">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
            Market temperature
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, #88E5C8, #5B8DFF, #A788FF, #FF89C5, #FFB088)",
              }}
            />
            <motion.span
              className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-text shadow-[0_2px_10px_rgba(0,0,0,0.25)] dark:border-[#0A0B1F]"
              style={{ left: `${pos}%` }}
              animate={reduce ? undefined : { x: [0, 4, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <div className="mt-2 text-xs text-text-muted">
            <span aria-hidden>{emoji}</span>{" "}
            <span className="font-medium text-text">Market temp: {label}</span>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[220px] text-xs">
        <p className="text-text">
          Derived from the platform&apos;s top-product score average over the
          last 24 hours.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

/* -------------------------------------------------------------------------- */
/* Helper: convert a signal accent label to a hex color.                      */
/* -------------------------------------------------------------------------- */
export function accentForNiche(niche?: string): string {
  if (!niche) return "#A788FF";
  return NICHES[niche as keyof typeof NICHES]?.color ?? "#A788FF";
}
export function accentForCountry(country?: string): string {
  if (!country) return "#5B8DFF";
  return COUNTRIES[country] ? "#5B8DFF" : "#5B8DFF";
}
