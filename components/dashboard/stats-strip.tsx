"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ScoreNumber } from "@/components/animated/score-number";
import { Sparkline } from "@/components/animated/sparkline";
import { useProductStore } from "@/lib/store/products";
import { NICHES_LIST } from "@/lib/data/niches";
import { cn } from "@/lib/utils";

type Stat = {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  sparkline: number[];
  color: string;
  breatheOffset: number; // seconds — offsets each tile so they breathe out of sync
};

function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 240,
        damping: 26,
        delay: index * 0.08,
      }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      {/* Breathing wrapper — gentle up/down drift out of sync per tile */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{
          duration: 6,
          delay: stat.breatheOffset,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{ y: -10 }}
        className={cn(
          "glass group relative h-full overflow-hidden rounded-2xl p-5",
          "transition-shadow duration-300 ease-out",
        )}
        style={
          hover
            ? {
                boxShadow: `
                  0 18px 50px -14px ${stat.color}66,
                  0 0 36px ${stat.color}33,
                  inset 0 1px 0 0 var(--surface-glass-highlight)`,
              }
            : undefined
        }
      >
        {/* Chromatic hover bloom */}
        <AnimatePresence>
          {hover && (
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none absolute -inset-px rounded-2xl"
              style={{
                background: `radial-gradient(ellipse 100% 100% at 50% 0%, ${stat.color}22 0%, transparent 60%)`,
              }}
            />
          )}
        </AnimatePresence>

        <div className="relative font-mono text-[10px] uppercase tracking-wider text-text-dim">
          {stat.label}
        </div>
        <div className="relative mt-3 flex items-end justify-between gap-3">
          <ScoreNumber
            value={stat.value}
            decimals={stat.decimals}
            suffix={stat.suffix}
            duration={1.6}
            className="text-3xl font-medium leading-none tracking-tight"
          />
        </div>
        <div className="relative -mx-1 mt-4">
          <Sparkline data={stat.sparkline} color={stat.color} height={28} />
        </div>
      </motion.div>
    </motion.div>
  );
}

export function StatsStrip() {
  const products = useProductStore((s) => s.products);

  const stats: Stat[] = useMemo(() => {
    const count = products.length;
    const avgScore =
      count > 0
        ? Math.round(products.reduce((s, p) => s + p.sellScore, 0) / count)
        : 0;
    const topNiche = NICHES_LIST.reduce(
      (max, n) => (n.heat > max.heat ? n : max),
      NICHES_LIST[0],
    );
    const winners = products.filter(
      (p) => p.verdict === "go" || p.verdict === "test",
    ).length;

    const aggDemand = products.slice(0, 8).flatMap((p) =>
      p.demandTrend.slice(-4),
    );
    const scoresSorted = [...products].map((p) => p.sellScore).sort();
    const heatSeries = NICHES_LIST.map((n) => n.heat).sort((a, b) => a - b);
    const winnerSeries = products.map((p, i) =>
      p.verdict === "go" || p.verdict === "test" ? 10 + (i % 4) * 2 : 4,
    );

    return [
      {
        label: "Products tracked",
        value: count,
        sparkline: aggDemand.length ? aggDemand : [4, 6, 8, 10, 12, 18, 24, 30],
        color: "#3DD68C",
        breatheOffset: 0,
      },
      {
        label: "Avg sell score",
        value: avgScore,
        sparkline: scoresSorted.length ? scoresSorted : [40, 45, 50, 55, 60],
        color: "#5B8DFF",
        breatheOffset: 1.4,
      },
      {
        label: "Top niche heat",
        value: topNiche.heat,
        suffix: ` ${topNiche.label}`,
        sparkline: heatSeries,
        color: "#A788FF",
        breatheOffset: 2.8,
      },
      {
        label: "Winners this week",
        value: winners,
        sparkline: winnerSeries,
        color: "#FF89C5",
        breatheOffset: 4.2,
      },
    ];
  }, [products]);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} stat={s} index={i} />
        ))}
      </div>
    </section>
  );
}

export function StatsStripSkeleton() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass h-28 rounded-2xl" />
        ))}
      </div>
    </section>
  );
}
