"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import * as Lucide from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Sparkline } from "@/components/animated/sparkline";
import { SectionHeader, StaggerGrid, StaggerItem } from "./editorial-primitives";
import { ScoreNumber } from "@/components/animated/score-number";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import { cn } from "@/lib/utils";

type Props = {
  /** The big featured number. */
  featured: {
    value: number;
    label: string;
    /** Trend series (oldest → newest), used by the vertical bar chart. */
    trend: number[];
    deltaPct: number | null;
    drillUrl: string;
  };
  streak: {
    days: number;
    /** True for each day in the last 7 (oldest → today). */
    last7: boolean[];
    encouragement: string;
  };
  winRate: {
    pct: number;
    total: number;
    drillUrl: string;
  };
  topNiche: {
    label: string;
    icon: string;
    color: string;
    avgScore: number;
    trend: number[];
    drillUrl: string;
  } | null;
  bestCountry: {
    flag: string;
    name: string;
    avgScore: number;
    wins: number;
    drillUrl: string;
  } | null;
  sectionId: string;
};

export function OperatorPulse({
  featured,
  streak,
  winRate,
  topNiche,
  bestCountry,
  sectionId,
}: Props) {
  return (
    <section className="pt-32 md:pt-40">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-12">
        <SectionHeader
          id={sectionId}
          kicker="YOUR OPERATION"
          headline="How you're moving"
          subHeadline="The last 30 days, by the numbers"
        />

        <StaggerGrid className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* CELL 1 — Big number (cols 1-7) */}
          <StaggerItem className="md:col-span-7">
            <BigNumberCell featured={featured} />
          </StaggerItem>

          {/* CELL 2 — Streak (cols 8-12) */}
          <StaggerItem className="md:col-span-5">
            <StreakCell streak={streak} />
          </StaggerItem>

          {/* CELL 3 — Win rate (cols 1-4) */}
          <StaggerItem className="md:col-span-4">
            <WinRateCell winRate={winRate} />
          </StaggerItem>

          {/* CELL 4 — Top niche (cols 5-8) */}
          <StaggerItem className="md:col-span-4">
            <TopNicheCell topNiche={topNiche} />
          </StaggerItem>

          {/* CELL 5 — Best country (cols 9-12) */}
          <StaggerItem className="md:col-span-4">
            <BestCountryCell bestCountry={bestCountry} />
          </StaggerItem>
        </StaggerGrid>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function PulseCell({
  href,
  drillLabel = "Drill in",
  children,
  className,
}: {
  href: string;
  drillLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className={cn(
        "glass group relative h-full overflow-hidden rounded-[28px] p-8 md:p-10",
        className,
      )}
    >
      <Link
        href={href}
        aria-label={drillLabel}
        className="absolute inset-0 z-0"
      />
      <div className="relative z-10 h-full">{children}</div>
      <div className="pointer-events-none absolute bottom-4 right-5 flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-text-dim opacity-0 transition-opacity group-hover:opacity-100">
        {drillLabel} <ArrowUpRight className="h-3 w-3" />
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */

function BigNumberCell({ featured }: { featured: Props["featured"] }) {
  const positive = featured.deltaPct !== null && featured.deltaPct >= 0;
  const chartData = featured.trend.map((v, i) => ({ i, v }));
  return (
    <PulseCell href={featured.drillUrl} drillLabel="See history">
      <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[1fr_120px]">
        <div className="flex flex-col justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
              {featured.label}
            </div>
            <div className="mt-2 font-serif leading-[0.85] text-text">
              <ScoreNumber
                value={featured.value}
                className="font-serif text-[96px] md:text-[120px] lg:text-[144px]"
              />
            </div>
          </div>
          {featured.deltaPct !== null && (
            <div
              className={cn(
                "mt-6 inline-flex items-center gap-1.5 text-sm",
                positive ? "text-go" : "text-skip",
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              <span className="font-mono tabular-nums">
                {positive ? "+" : ""}
                {featured.deltaPct}% vs last period
              </span>
            </div>
          )}
        </div>

        {/* Vertical bar chart */}
        <div className="h-48 lg:h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="pulse-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A788FF" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#5B8DFF" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <Bar dataKey="v" radius={[4, 4, 0, 0]} animationDuration={900}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill="url(#pulse-bar)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PulseCell>
  );
}

/* -------------------------------------------------------------------------- */

function StreakCell({ streak }: { streak: Props["streak"] }) {
  return (
    <PulseCell href="/insights" drillLabel="See insights">
      <div className="flex h-full flex-col justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
            Streak
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl md:text-6xl" aria-hidden>🔥</span>
            <span className="font-serif text-[88px] leading-[0.85] text-text">
              <ScoreNumber value={streak.days} className="font-serif" />
            </span>
          </div>
          <div className="mt-2 text-sm text-text-muted">day scanning streak</div>
        </div>
        <div>
          <div className="mt-6 flex items-center gap-1.5">
            {streak.last7.map((on, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full",
                  on ? "bg-aurora-purple" : "bg-border-soft",
                )}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-text-muted">{streak.encouragement}</p>
        </div>
      </div>
    </PulseCell>
  );
}

/* -------------------------------------------------------------------------- */

function WinRateCell({ winRate }: { winRate: Props["winRate"] }) {
  const reduce = useReducedMotion();
  const size = 200;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, winRate.pct));
  const dash = (pct / 100) * c;

  return (
    <PulseCell href="/insights">
      <div className="flex h-full flex-col items-center justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="rgba(167,136,255,0.15)"
              strokeWidth={stroke}
              fill="none"
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="url(#wr-grad)"
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              whileInView={{ strokeDashoffset: c - dash }}
              viewport={{ once: true }}
              transition={{ duration: reduce ? 0.2 : 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
            <defs>
              <linearGradient id="wr-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#5B8DFF" />
                <stop offset="50%" stopColor="#A788FF" />
                <stop offset="100%" stopColor="#FF89C5" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-4xl font-medium tabular-nums text-text">
              <ScoreNumber value={pct} className="font-mono" suffix="%" />
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-dim">
              {winRate.total} scans
            </span>
          </div>
        </div>
        <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
          Verdict-positive rate
        </div>
      </div>
    </PulseCell>
  );
}

/* -------------------------------------------------------------------------- */

function TopNicheCell({ topNiche }: { topNiche: Props["topNiche"] }) {
  if (!topNiche) {
    return (
      <PulseCell href="/insights">
        <EmptyCell label="Top niche" hint="Score 3+ products to see your niche." />
      </PulseCell>
    );
  }
  const Icon = (Lucide[topNiche.icon as keyof typeof Lucide] ??
    Lucide.Sparkles) as React.ComponentType<React.SVGProps<SVGSVGElement>>;
  return (
    <PulseCell href={topNiche.drillUrl}>
      <div className="flex h-full flex-col justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
            Top niche
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                background: `${topNiche.color}25`,
              }}
            >
              <div
                aria-hidden
                className="absolute inset-0 rounded-2xl blur-md opacity-50"
                style={{ background: `${topNiche.color}60` }}
              />
              <Icon className="relative h-6 w-6" style={{ color: topNiche.color }} />
            </div>
            <div>
              <div className="font-serif text-2xl leading-tight text-text">
                {topNiche.label}
              </div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-text-dim">
                avg{" "}
                <span className="text-text">
                  <ScoreNumber value={topNiche.avgScore} className="font-mono" />
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 h-10">
          {topNiche.trend.length > 1 && (
            <Sparkline data={topNiche.trend} color={topNiche.color} height={40} />
          )}
        </div>
      </div>
    </PulseCell>
  );
}

/* -------------------------------------------------------------------------- */

function BestCountryCell({ bestCountry }: { bestCountry: Props["bestCountry"] }) {
  if (!bestCountry) {
    return (
      <PulseCell href="/insights">
        <EmptyCell
          label="Best country"
          hint="Score 3+ products to see your best market."
        />
      </PulseCell>
    );
  }
  return (
    <PulseCell href={bestCountry.drillUrl}>
      <div className="flex h-full flex-col justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
            Best country
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-5xl md:text-6xl" aria-hidden>
              {bestCountry.flag}
            </span>
            <span className="font-serif text-2xl leading-tight text-text">
              {bestCountry.name}
            </span>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between text-xs">
          <span className="text-text-muted">
            avg{" "}
            <span className="font-mono text-text">
              <ScoreNumber value={bestCountry.avgScore} className="font-mono" />
            </span>
          </span>
          <span className="text-text-muted">
            <span className="font-mono text-text">
              <ScoreNumber value={bestCountry.wins} className="font-mono" />
            </span>{" "}
            wins
          </span>
        </div>
      </div>
    </PulseCell>
  );
}

/* -------------------------------------------------------------------------- */

function EmptyCell({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
        {label}
      </div>
      <div className="mt-2 font-serif text-3xl text-text-dim">—</div>
      <p className="mt-3 text-xs text-text-muted">{hint}</p>
    </div>
  );
}

/* Re-export utility used by the page to assemble props.
 * Returns the lucide icon name for a niche or "Sparkles" as fallback. */
export function nicheIconName(niche?: string): string {
  if (!niche) return "Sparkles";
  return NICHES[niche as keyof typeof NICHES]?.icon ?? "Sparkles";
}
export function countryName(code?: string): string {
  if (!code) return "—";
  return COUNTRIES[code]?.name ?? code;
}
