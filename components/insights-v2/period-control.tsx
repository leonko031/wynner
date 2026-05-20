"use client";

import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import {
  INSIGHTS_PERIODS,
  PERIOD_LABEL,
  periodDays,
  type InsightsPeriod,
} from "@/types/insights";
import { cn } from "@/lib/utils";

type Props = {
  period: InsightsPeriod;
  onChange: (p: InsightsPeriod) => void;
  compareToPrev: boolean;
  onCompareChange: (next: boolean) => void;
};

/**
 * Sticky strip below the hero. Affects every chart on the page.
 */
export function PeriodControl({ period, onChange, compareToPrev, onCompareChange }: Props) {
  const days = periodDays(period);
  const today = new Date();
  const start = days ? new Date(today.getTime() - days * 24 * 60 * 60 * 1000) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="sticky top-[64px] z-20 -mx-1 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-full glass px-4 py-2"
    >
      <div className="flex items-center gap-1 rounded-full bg-surface/60 p-1">
        {INSIGHTS_PERIODS.map((p) => {
          const active = p === period;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition-colors",
                active
                  ? "bg-surface text-text shadow-sm"
                  : "text-text-muted hover:text-text",
              )}
            >
              {PERIOD_LABEL[p]}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        {start && (
          <div className="hidden items-center gap-1.5 rounded-full border border-border-soft bg-surface/60 px-3 py-1 text-[11px] text-text-muted md:inline-flex">
            <Calendar className="h-3 w-3" />
            <span className="font-mono tabular-nums">
              {format(start, "MMM d")} — {format(today, "MMM d")}
            </span>
          </div>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-text-muted">
          <input
            type="checkbox"
            checked={compareToPrev}
            onChange={(e) => onCompareChange(e.target.checked)}
            className="h-3 w-3 cursor-pointer accent-aurora-blue"
          />
          Compare to previous
        </label>
      </div>
    </motion.div>
  );
}
