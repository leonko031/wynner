"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getPillarExplanation } from "@/lib/scoring/projections";
import { LiveDataBadge } from "@/components/product/live-data-badge";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

const PILLARS: { key: keyof Product["pillars"]; label: string }[] = [
  { key: "margin", label: "Margin" },
  { key: "marketFit", label: "Market fit" },
  { key: "demand", label: "Demand" },
  { key: "competition", label: "Competition" },
  { key: "creative", label: "Creative" },
];

function colorFor(v: number) {
  if (v >= 75) return "#00D26A";
  if (v >= 50) return "#F5A623";
  return "#EF4444";
}

export function PillarGrid({
  product,
  pillarOverrides,
}: {
  product: Product;
  pillarOverrides?: Product["pillars"];
}) {
  const [openKey, setOpenKey] = useState<keyof Product["pillars"] | null>(null);
  const values = pillarOverrides ?? product.pillars;

  return (
    <section>
      <h2 className="mb-4 text-xl font-medium tracking-tight md:text-2xl">
        Pillar breakdown
      </h2>
      <motion.div layout className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {PILLARS.map(({ key, label }) => {
          const v = values[key];
          const color = colorFor(v);
          const expanded = openKey === key;
          const dimmed = openKey !== null && !expanded;
          return (
            <motion.button
              layout
              key={key}
              onClick={() => setOpenKey(expanded ? null : key)}
              className={cn(
                "group glass rounded-3xl p-5 text-left transition-all",
                "hover:-translate-y-0.5",
                dimmed && "opacity-60",
                expanded && "md:col-span-2",
              )}
              aria-expanded={expanded}
            >
              <motion.div layout className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                      {label}
                    </div>
                    {key === "competition" &&
                      product.enrichmentSources?.metaAds && (
                        <LiveDataBadge
                          source="metaAds"
                          scrapedAt={product.enrichmentSources.metaAds.scrapedAt}
                          summary={`Score based on ${product.enrichmentSources.metaAds.totalActiveAds.toLocaleString()} active ads in Meta Ad Library.`}
                        />
                      )}
                    {key === "demand" &&
                      product.enrichmentSources?.googleTrends && (
                        <LiveDataBadge
                          source="googleTrends"
                          scrapedAt={
                            product.enrichmentSources.googleTrends.scrapedAt
                          }
                          summary={`Demand blended with Google Trends velocity of ${product.enrichmentSources.googleTrends.velocity >= 0 ? "+" : ""}${product.enrichmentSources.googleTrends.velocity}%.`}
                        />
                      )}
                    {key === "demand" && product.enrichmentSources?.tiktok && (
                      <LiveDataBadge
                        source="tiktok"
                        scrapedAt={product.enrichmentSources.tiktok.scrapedAt}
                        summary={`Boosted by ${(product.enrichmentSources.tiktok.totalViews / 1_000_000).toFixed(1)}M TikTok hashtag views.`}
                      />
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span
                      className="font-mono text-3xl font-medium leading-none tabular-nums"
                      style={{ color }}
                    >
                      {v}
                    </span>
                    <span className="font-mono text-xs text-text-dim">/ 100</span>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-text-dim transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </motion.div>

              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${v}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}66` }}
                  className="h-full rounded-full"
                />
              </div>

              <AnimatePresence initial={false} mode="wait">
                {expanded && (
                  <motion.p
                    key="exp"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-4 text-sm leading-relaxed text-text-muted"
                  >
                    {getPillarExplanation(product, key)}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}
