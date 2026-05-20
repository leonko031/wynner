"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Award,
  ChevronLeft,
  ChevronRight,
  Coins,
  Flag,
  Flame,
  Layers,
  PieChart,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ScoreNumber } from "@/components/animated/score-number";
import { Sparkline } from "@/components/animated/sparkline";
import { pctDelta } from "@/lib/insights/aggregates";
import { cn } from "@/lib/utils";

type Metric = {
  id: string;
  label: string;
  icon: LucideIcon;
  accent: string;
  value: number | string;
  /** Numeric form for the count-up — when value is a string, just used for delta calc. */
  numericValue: number;
  numericPrevValue: number;
  /** Sparkline data over the period. */
  spark: number[];
  /** Optional suffix shown after the count-up (e.g. "%"). */
  suffix?: string;
};

type Props = {
  totalScans: number;
  prevTotalScans: number;
  avgScore: number;
  prevAvgScore: number;
  winRate: number;
  prevWinRate: number;
  creditsSpent: number;
  prevCreditsSpent: number;
  highestScore: number;
  prevHighestScore: number;
  mostScannedNiche: { label: string; count: number } | null;
  mostScannedCountry: { label: string; count: number } | null;
  actionRate: number;
  prevActionRate: number;
  scanCountsByDay: number[];
  scoresByDay: number[];
};

/**
 * Row of 8 metric cards. By default shows 4 at a time — left/right arrows
 * cycle the window; "Show all" button switches to the expanded 8-card grid.
 */
export function MetricGrid(props: Props) {
  const [start, setStart] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const metrics: Metric[] = useMemo(() => {
    return [
      {
        id: "total",
        label: "Total scans",
        icon: Activity,
        accent: "#5B8DFF",
        value: props.totalScans,
        numericValue: props.totalScans,
        numericPrevValue: props.prevTotalScans,
        spark: props.scanCountsByDay,
      },
      {
        id: "avg",
        label: "Avg sell-score",
        icon: PieChart,
        accent: "#A788FF",
        value: props.avgScore,
        numericValue: props.avgScore,
        numericPrevValue: props.prevAvgScore,
        spark: props.scoresByDay,
      },
      {
        id: "win",
        label: "Win rate",
        icon: Flame,
        accent: "#3DD68C",
        value: `${Math.round(props.winRate * 100)}`,
        numericValue: Math.round(props.winRate * 100),
        numericPrevValue: Math.round(props.prevWinRate * 100),
        spark: props.scoresByDay,
        suffix: "%",
      },
      {
        id: "credits",
        label: "Credits spent",
        icon: Coins,
        accent: "#FFAB40",
        value: props.creditsSpent,
        numericValue: props.creditsSpent,
        numericPrevValue: props.prevCreditsSpent,
        spark: props.scanCountsByDay,
      },
      {
        id: "highest",
        label: "Highest score",
        icon: Award,
        accent: "#FF89C5",
        value: props.highestScore,
        numericValue: props.highestScore,
        numericPrevValue: props.prevHighestScore,
        spark: props.scoresByDay,
      },
      {
        id: "niche",
        label: "Top niche",
        icon: Layers,
        accent: "#A788FF",
        value: props.mostScannedNiche?.label ?? "—",
        numericValue: props.mostScannedNiche?.count ?? 0,
        numericPrevValue: 0,
        spark: props.scoresByDay,
      },
      {
        id: "country",
        label: "Top country",
        icon: Flag,
        accent: "#5B8DFF",
        value: props.mostScannedCountry?.label ?? "—",
        numericValue: props.mostScannedCountry?.count ?? 0,
        numericPrevValue: 0,
        spark: props.scoresByDay,
      },
      {
        id: "action",
        label: "Action rate",
        icon: Rocket,
        accent: "#FFB088",
        value: `${Math.round(props.actionRate * 100)}`,
        numericValue: Math.round(props.actionRate * 100),
        numericPrevValue: Math.round(props.prevActionRate * 100),
        spark: props.scanCountsByDay,
        suffix: "%",
      },
    ];
  }, [props]);

  const visible = showAll ? metrics : metrics.slice(start, start + 4);
  const canPrev = !showAll && start > 0;
  const canNext = !showAll && start + 4 < metrics.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-wider text-text-dim">
          Your numbers
        </h3>
        <div className="flex items-center gap-1">
          {!showAll && (
            <>
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => setStart((s) => Math.max(0, s - 4))}
                className={cn(
                  "rounded-full border border-border-soft bg-surface/60 p-1.5",
                  canPrev
                    ? "text-text hover:border-aurora-blue/55"
                    : "cursor-not-allowed text-text-dim opacity-50",
                )}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={!canNext}
                onClick={() => setStart((s) => Math.min(4, s + 4))}
                className={cn(
                  "rounded-full border border-border-soft bg-surface/60 p-1.5",
                  canNext
                    ? "text-text hover:border-aurora-blue/55"
                    : "cursor-not-allowed text-text-dim opacity-50",
                )}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="ml-1 rounded-full border border-border-soft bg-surface/60 px-3 py-1 text-xs text-text-muted hover:text-text"
          >
            {showAll ? "Cycle" : "Show all"}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4",
          showAll
            ? "grid-cols-2 md:grid-cols-4"
            : "grid-cols-2 md:grid-cols-4",
        )}
      >
        <AnimatePresence mode="popLayout">
          {visible.map((m, i) => (
            <MetricCard key={m.id} metric={m} delay={i * 0.05} />
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function MetricCard({ metric, delay }: { metric: Metric; delay: number }) {
  const Icon = metric.icon;
  const delta = pctDelta(metric.numericValue, metric.numericPrevValue);
  const showDelta =
    metric.numericPrevValue > 0 || metric.numericValue > 0;
  const positive = delta >= 0;
  const numeric = typeof metric.value === "number";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" style={{ color: metric.accent }} />
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          {metric.label}
        </span>
      </div>
      <div className="mt-3 leading-none">
        {numeric ? (
          <span className="font-mono text-3xl tabular-nums text-text">
            <ScoreNumber
              value={metric.numericValue}
              className="font-mono text-3xl"
              suffix={metric.suffix}
            />
          </span>
        ) : (
          <span className="line-clamp-1 font-serif text-xl text-text">
            {metric.value}
          </span>
        )}
      </div>
      {metric.spark.length > 1 && (
        <div className="mt-2 h-7 w-full">
          <Sparkline data={metric.spark} color={metric.accent} height={28} />
        </div>
      )}
      {showDelta && metric.numericPrevValue > 0 && (
        <div
          className={cn(
            "mt-1 font-mono text-[10px] tabular-nums",
            positive ? "text-go" : "text-skip",
          )}
        >
          {positive ? "+" : ""}
          {delta}% vs prior period
        </div>
      )}
    </motion.div>
  );
}
