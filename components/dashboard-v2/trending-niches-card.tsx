"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
import { ArrowRight, Flame } from "lucide-react";
import { useProductStore } from "@/lib/store/products";
import { trendingNiches } from "@/lib/dashboard/momentum";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function TrendingNichesCard() {
  const products = useProductStore((s) => s.products);
  const rows = trendingNiches(products);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass h-full rounded-3xl p-6"
    >
      <div className="flex items-baseline justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-aurora-peach" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              What&apos;s heating up
            </span>
          </div>
          <h3 className="mt-1 font-serif text-xl text-text">Trending niches</h3>
        </div>
        <Link
          href="/vault"
          className="text-xs text-text-muted underline-offset-2 hover:text-text hover:underline"
        >
          View all
        </Link>
      </div>

      <ul className="mt-5 space-y-2.5">
        {rows.map((row, i) => {
          const Icon =
            ((Lucide as unknown as Record<string, React.ElementType>)[
              row.label === "Wellness" ? "Heart" : "Sparkles"
            ] as React.ElementType) ?? Lucide.Box;
          return (
            <motion.li
              key={row.niche}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * i }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/vault?niche=${row.niche}`}
                    className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface/60"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: `${row.color}1A`,
                        color: row.color,
                        border: `1px solid ${row.color}33`,
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text">{row.label}</span>
                        <span
                          className={cn(
                            "font-mono text-[10px] tabular-nums",
                            row.deltaPct > 0
                              ? "text-go"
                              : row.deltaPct < 0
                                ? "text-skip"
                                : "text-text-dim",
                          )}
                        >
                          {row.deltaPct > 0 ? "+" : ""}
                          {row.deltaPct}%
                        </span>
                      </div>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-elevated">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${row.heat}%` }}
                          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                          style={{
                            background: row.color,
                            boxShadow: `0 0 6px ${row.color}aa`,
                          }}
                        />
                      </div>
                    </div>
                    <ArrowRight className="h-3 w-3 text-text-dim opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[220px] text-xs">
                  Heat = recent score average + base niche heat. Delta compares
                  the last 7 days vs the prior 7.
                </TooltipContent>
              </Tooltip>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}
