"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, AlertTriangle, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreNumber } from "@/components/animated/score-number";
import { PulseDot } from "@/components/animated/pulse-dot";
import { useTopProducts, useSubtleTilt } from "@/lib/hooks";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { Verdict } from "@/types";
import { cn } from "@/lib/utils";

const VERDICT_META: Record<
  Verdict,
  { label: string; color: string; halo: string; Icon: React.ElementType }
> = {
  go: { label: "GO LIVE", color: "#3DD68C", halo: "halo-go", Icon: Sparkles },
  test: { label: "TEST IT", color: "#FFAB40", halo: "halo-test", Icon: Zap },
  risky: {
    label: "PROCEED WITH CARE",
    color: "#FF7E5F",
    halo: "halo-risky",
    Icon: AlertTriangle,
  },
  skip: { label: "SKIP", color: "#FF5C7C", halo: "halo-skip", Icon: Ban },
};

export function HeroWinner() {
  const [pick] = useTopProducts(1);
  const reduce = useReducedMotion();
  const imageTilt = useSubtleTilt(6);

  if (!pick) return <HeroWinnerSkeleton />;

  const meta = VERDICT_META[pick.verdict];
  const country = COUNTRIES[pick.targetCountry];
  const niche = NICHES[pick.category];
  const { Icon } = meta;

  return (
    <section
      data-tour="hero"
      className="mx-auto w-full max-w-6xl px-6 pt-14 pb-16"
    >
      {/* eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex items-center gap-2"
      >
        <PulseDot color={meta.color} size={6} />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-dim">
          Today&apos;s top pick
        </span>
      </motion.div>

      <motion.article
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: reduce ? 0 : 0.7,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cn(
          "glass-strong relative overflow-hidden rounded-3xl p-7 md:p-9",
          meta.halo,
        )}
      >
        {/* Soft inner verdict bloom — bleeds through the glass */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-3xl"
          style={{
            background: `radial-gradient(ellipse 80% 70% at 50% -10%, ${meta.color}1F 0%, transparent 60%)`,
          }}
        />

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-[5fr_6fr] md:gap-10">
          {/* LEFT — tilting image with halo */}
          <motion.div
            style={imageTilt.style}
            onPointerMove={imageTilt.onMove}
            onPointerLeave={imageTilt.onLeave}
            className="relative"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-4 rounded-[2rem] opacity-80 blur-2xl"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${meta.color}55 0%, transparent 65%)`,
              }}
            />
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border-strong bg-white/30">
              <Image
                src={pick.image}
                alt={pick.name}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
                priority
                unoptimized
              />
              {/* Inner top highlight */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
                }}
              />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xl leading-none" aria-hidden>
                {country?.flag}
              </span>
              <span className="text-sm text-text-muted">{country?.name}</span>
              <span className="mx-1 text-text-dim">·</span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
                style={{
                  backgroundColor: `${niche.color}22`,
                  color: niche.color,
                  border: `1px solid ${niche.color}55`,
                }}
              >
                {niche.label}
              </span>
            </div>
          </motion.div>

          {/* RIGHT — score + verdict + name + CTAs */}
          <div className="flex flex-col items-start justify-center gap-5">
            <div className="flex items-baseline gap-3">
              <ScoreNumber
                value={pick.sellScore}
                duration={1.6}
                className="text-[112px] font-medium leading-none tracking-tight md:text-[128px]"
              />
              <span className="font-mono text-2xl text-text-dim">/ 100</span>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 22,
                delay: reduce ? 0 : 0.45,
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wider"
              style={{
                backgroundColor: `${meta.color}26`,
                color: meta.color,
                border: `1px solid ${meta.color}55`,
                boxShadow: `0 0 24px ${meta.color}44`,
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </motion.div>

            <h1 className="max-w-md text-2xl font-medium leading-snug tracking-tight md:text-3xl">
              {pick.name}
            </h1>

            <p className="max-w-md text-sm leading-relaxed text-text-muted">
              {pick.reasoning.topAngle}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href={`/product/${pick.id}`}>
                  Open dossier
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="rounded-full text-text-muted hover:bg-surface hover:text-text"
              >
                <Link href={`/scan?similar=${pick.id}`}>Scan similar</Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.article>
    </section>
  );
}

export function HeroWinnerSkeleton() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-14 pb-16">
      <div className="mb-8 h-3 w-32 rounded-full bg-surface" />
      <div className="glass-strong h-[520px] rounded-3xl" />
    </section>
  );
}
