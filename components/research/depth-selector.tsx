"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FlaskConical, Sparkles, Zap } from "lucide-react";
import { useCreditsStore } from "@/lib/store/credits";
import { SparkIcon } from "@/components/credits/spark-icon";
import { RESEARCH_MODE_META, type ResearchMode } from "@/types/research";
import { cn } from "@/lib/utils";

type Props = {
  onSelect: (mode: ResearchMode) => void;
};

type CardSpec = {
  mode: ResearchMode;
  icon: React.ElementType;
  accent: string;
  bullets: string[];
  ribbon?: "popular" | "pdf";
};

const CARDS: CardSpec[] = [
  {
    mode: "quick",
    icon: Zap,
    accent: "#5B8DFF",
    bullets: [
      "🔍 Live web research (4–6 searches)",
      "📊 2 hook angles with full scripts",
      "👤 1 persona sketch",
      "📚 ~10 cited sources",
      "Sell score, verdict, top angle",
    ],
  },
  {
    mode: "standard",
    icon: Sparkles,
    accent: "#A788FF",
    bullets: [
      "🔍 Deep web research (15–20 searches)",
      "📊 5 fully-detailed hook angles + A/B variants",
      "👤 3 buyer personas with real language patterns",
      "🏷️ Real competitor analysis",
      "💰 Pricing strategy with tiered ladder",
      "📚 ~30 cited sources",
    ],
    ribbon: "popular",
  },
  {
    mode: "deep",
    icon: FlaskConical,
    accent: "#FF89C5",
    bullets: [
      "🔍 Comprehensive web research (30–40 searches)",
      "📊 8 hook angles across all awareness levels",
      "👤 3 detailed personas with real customer quotes",
      "🏷️ Full competitor landscape with archetypes",
      "💰 Pricing tier strategy",
      "📅 14-day launch playbook",
      "⚠️ Risk analysis with mitigations",
      "📄 Branded PDF report",
      "📚 ~80 cited sources",
    ],
    ribbon: "pdf",
  },
];

export function DepthSelector({ onSelect }: Props) {
  const balance = useCreditsStore((s) => s.balance);

  return (
    <div>
      <header className="mb-10 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-balance text-4xl font-medium tracking-tight md:text-5xl"
        >
          How deep do you want to go?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mx-auto mt-3 max-w-xl text-sm text-text-muted md:text-base"
        >
          Pick your depth. Every scan uses real-time web research with cited
          sources — pick how thorough.
        </motion.p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:items-stretch">
        {CARDS.map((card, i) => {
          const meta = RESEARCH_MODE_META[card.mode];
          const canAfford = balance >= meta.creditCost;
          const highlight = card.mode === "standard";
          const Icon = card.icon;
          return (
            <motion.button
              key={card.mode}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: highlight ? -10 : -6 }}
              onClick={() => onSelect(card.mode)}
              disabled={!canAfford}
              className={cn(
                "glass relative flex flex-col items-start gap-4 rounded-3xl p-6 text-left transition-all",
                "disabled:cursor-not-allowed",
                highlight && "md:scale-[1.04]",
                !canAfford && "opacity-70",
                card.mode === "deep" &&
                  "before:absolute before:inset-0 before:-z-10 before:rounded-3xl before:bg-[linear-gradient(135deg,rgba(255,137,197,0.10),rgba(167,136,255,0.08))] before:opacity-0 hover:before:opacity-100 before:transition-opacity",
              )}
              style={
                highlight
                  ? {
                      boxShadow: `0 0 0 1px ${card.accent}55, 0 28px 64px -18px ${card.accent}55, 0 0 48px ${card.accent}22`,
                    }
                  : {
                      boxShadow: `0 0 0 1px ${card.accent}1f, 0 16px 36px -16px ${card.accent}30`,
                    }
              }
            >
              {card.ribbon === "popular" && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white shadow-[0_8px_24px_-4px_rgba(167,136,255,0.65)]"
                    style={{
                      background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                    }}
                  >
                    <SparkIcon size={10} color="#ffffff" />
                    Most popular
                  </span>
                </motion.span>
              )}
              {card.ribbon === "pdf" && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="absolute -top-3 right-4"
                >
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white animate-pulse-glow"
                    style={{
                      background: card.accent,
                      boxShadow: `0 0 18px ${card.accent}cc`,
                    }}
                  >
                    Includes PDF
                  </span>
                </motion.span>
              )}

              <div className="flex w-full items-center justify-between gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${card.accent}1A`,
                    color: card.accent,
                    border: `1px solid ${card.accent}33`,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[11px] tabular-nums"
                  style={{
                    background: `${card.accent}1A`,
                    color: card.accent,
                    border: `1px solid ${card.accent}45`,
                  }}
                >
                  <SparkIcon size={11} color={card.accent} />
                  {meta.creditCost}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-medium tracking-tight text-text">{meta.label}</h3>
                <p className="mt-1 text-sm italic text-text-muted">
                  {card.mode === "quick" && "A taste of the magic"}
                  {card.mode === "standard" && "The serious operator's choice"}
                  {card.mode === "deep" && "The full intelligence dossier"}
                </p>
              </div>

              <ul className="space-y-1.5 text-sm">
                {card.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-text">
                    <span
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                      style={{ background: card.accent }}
                    />
                    <span className="leading-snug">{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex w-full items-center justify-between border-t border-border-soft/70 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                  ~{meta.estimatedSeconds}s
                </span>
                {canAfford ? (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium"
                    style={{ color: card.accent }}
                  >
                    Start {meta.label.toLowerCase()}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                    Top up to unlock
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 text-center text-xs text-text-muted">
        Need more credits?{" "}
        <Link href="/pricing#topups" className="text-text underline-offset-2 hover:underline">
          Top up
        </Link>
        .
      </div>
    </div>
  );
}
