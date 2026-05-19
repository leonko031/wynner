"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo } from "react";
import * as Lucide from "lucide-react";
import { Flame, TrendingUp } from "lucide-react";
import { useUser } from "@/lib/auth/use-user";
import { useProductStore } from "@/lib/store/products";
import {
  bestNiche,
  dailyScanMap,
  dailyScanSeries,
  lastSevenDayKeys,
  scansThisWeek,
  streakDays,
  userProducts,
  verdictBreakdown30d,
  weeklyTrendDeltaPct,
} from "@/lib/dashboard/momentum";
import { cn } from "@/lib/utils";

export function MomentumRow() {
  // Stable selector + memoized filter (see greeting-bar.tsx for the
  // rationale on why selectors must return stable refs).
  const allProducts = useProductStore((s) => s.products);
  const products = useMemo(() => userProducts(allProducts), [allProducts]);
  const { user } = useUser();
  void user; // for future personalization

  const streak = streakDays(products);
  const scanMap = dailyScanMap(products);
  const last7Days = lastSevenDayKeys();
  const week = scansThisWeek(products);
  const deltaPct = weeklyTrendDeltaPct(products);
  const series = dailyScanSeries(products);
  const winRate = verdictBreakdown30d(products);
  const best = bestNiche(products);

  return (
    <motion.section
      id="dashboard-momentum"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="mb-4">
        <h2 className="font-serif text-2xl tracking-tight text-text md:text-3xl">
          Your momentum
        </h2>
        <p className="mt-1 text-sm text-text-muted">How you&apos;re trending this week.</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* CARD 1 — Streak */}
        <MomentumCard
          href="/credits"
          accent="#FF7E5F"
          glow={streak >= 3}
        >
          <div className="flex items-center gap-2">
            <Flame
              className={cn(
                "h-4 w-4",
                streak > 0 ? "text-aurora-peach" : "text-text-dim",
              )}
            />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Streak
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-4xl font-medium tabular-nums text-text">
              {streak}
            </span>
            <span className="text-sm text-text-muted">day{streak === 1 ? "" : "s"}</span>
            {streak > 0 && <span className="text-base">🔥</span>}
          </div>
          {/* Day dots */}
          <div className="mt-3 flex items-center gap-1.5">
            {last7Days.map((k, i) => {
              const on = (scanMap.get(k) ?? 0) > 0;
              return (
                <span
                  key={k}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    on
                      ? "bg-aurora-peach shadow-[0_0_8px_rgba(255,176,136,0.7)]"
                      : "bg-border-strong",
                  )}
                  title={`${k}: ${scanMap.get(k) ?? 0} scans`}
                  aria-hidden
                  style={{ opacity: 0.4 + (i / last7Days.length) * 0.6 }}
                />
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-text-muted">
            {streak === 0
              ? "Start a streak — scan today"
              : streak >= 7
                ? "🎉 Weekly bonus claimed"
                : `${7 - streak} more for +5 credits`}
          </p>
        </MomentumCard>

        {/* CARD 2 — This week */}
        <MomentumCard href="/vault" accent="#5B8DFF">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-aurora-blue" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              This week
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-4xl font-medium tabular-nums text-text">
              {week}
            </span>
            <span className="text-sm text-text-muted">scan{week === 1 ? "" : "s"}</span>
          </div>
          {/* Mini line chart */}
          <div className="mt-3 h-8">
            <MiniBars series={series} color="#5B8DFF" />
          </div>
          <p className="mt-2 text-[11px] text-text-muted">
            {deltaPct === null
              ? "No prior week to compare yet"
              : deltaPct === 0
                ? "Flat vs last week"
                : `${deltaPct > 0 ? "+" : ""}${deltaPct}% vs last week`}
          </p>
        </MomentumCard>

        {/* CARD 3 — Win rate */}
        <MomentumCard href="/vault?verdict=go,test" accent="#3DD68C">
          <div className="flex items-center gap-2">
            <Lucide.Target className="h-4 w-4 text-go" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Win rate
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-4xl font-medium tabular-nums text-text">
              {winRate.winRatePct}
            </span>
            <span className="text-sm text-text-muted">% GO/TEST</span>
          </div>
          <div className="mt-3">
            <VerdictBar breakdown={winRate} />
          </div>
          <p className="mt-2 text-[11px] text-text-muted">
            Last 30 days · {winRate.total} scan{winRate.total === 1 ? "" : "s"}
          </p>
        </MomentumCard>

        {/* CARD 4 — Best niche */}
        <MomentumCard href={best ? `/vault?niche=${best.niche}` : "/vault"} accent={best?.color ?? "#A788FF"}>
          <div className="flex items-center gap-2">
            <Lucide.Award className="h-4 w-4" style={{ color: best?.color ?? "#A788FF" }} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Best niche
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl text-text">
              {best?.label ?? "—"}
            </span>
          </div>
          <div className="mt-3 h-8">
            {best && <MiniBars series={best.trend} color={best.color} />}
          </div>
          <p className="mt-2 text-[11px] text-text-muted">
            {best
              ? `Avg ${best.avgScore} · ${best.count} scan${best.count === 1 ? "" : "s"}`
              : "Run a scan to surface your strongest category"}
          </p>
        </MomentumCard>
      </div>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function MomentumCard({
  href,
  accent,
  glow,
  children,
}: {
  href: string;
  accent: string;
  glow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.22 }}>
      <Link
        href={href}
        className="glass block rounded-2xl p-5 transition-all"
        style={{
          boxShadow: glow
            ? `0 0 0 1px ${accent}55, 0 16px 36px -12px ${accent}55, inset 0 1px 0 0 var(--surface-glass-highlight)`
            : `0 0 0 1px ${accent}24, 0 14px 28px -14px ${accent}40, inset 0 1px 0 0 var(--surface-glass-highlight)`,
        }}
      >
        {children}
      </Link>
    </motion.div>
  );
}

function MiniBars({ series, color }: { series: number[]; color: string }) {
  const max = Math.max(1, ...series);
  return (
    <div className="flex h-full items-end gap-1">
      {series.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.max(8, (v / max) * 100)}%`,
            background: color,
            opacity: 0.35 + (v / max) * 0.65,
          }}
        />
      ))}
    </div>
  );
}

function VerdictBar({
  breakdown,
}: {
  breakdown: { go: number; test: number; risky: number; skip: number; total: number };
}) {
  const total = Math.max(1, breakdown.total);
  const seg = [
    { v: breakdown.go, c: "#3DD68C" },
    { v: breakdown.test, c: "#FFAB40" },
    { v: breakdown.risky, c: "#FF7E5F" },
    { v: breakdown.skip, c: "#FF5C7C" },
  ];
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
      {seg.map((s, i) =>
        s.v > 0 ? (
          <span
            key={i}
            style={{
              width: `${(s.v / total) * 100}%`,
              background: s.c,
              opacity: 0.95,
            }}
          />
        ) : null,
      )}
    </div>
  );
}
