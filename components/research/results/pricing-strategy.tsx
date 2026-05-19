"use client";

import { motion } from "framer-motion";
import type { DeepResearchReport, PriceTier } from "@/types/research";
import { ConfidencePill, ResultsSection } from "./section";
import { cn } from "@/lib/utils";

const TIER_META: Record<PriceTier["label"], { color: string; sub: string }> = {
  entry: { color: "#5B8DFF", sub: "Lead-in tier" },
  popular: { color: "#A788FF", sub: "Push this in ads" },
  premium: { color: "#FF89C5", sub: "Higher-intent buyer" },
};

export function PricingStrategySection({ report }: { report: DeepResearchReport }) {
  const p = report.pricingStrategy;
  if (!p) return null;

  return (
    <ResultsSection
      eyebrow="Pricing strategy"
      title="How to price this"
      subtitle="A 3-tier ladder anchored to the recommended price."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {p.priceTiers.map((tier, i) => {
          const meta = TIER_META[tier.label];
          const isPopular = tier.label === "popular";
          return (
            <motion.div
              key={tier.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className={cn(
                "glass relative flex flex-col gap-4 rounded-3xl p-6 transition-transform hover:-translate-y-1",
                isPopular && "md:scale-105",
              )}
              style={{
                boxShadow: `0 0 0 1px ${meta.color}33, 0 20px 50px -20px ${meta.color}55`,
              }}
            >
              {isPopular && (
                <span
                  className="absolute -top-2 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white"
                  style={{
                    background: meta.color,
                    boxShadow: `0 0 16px ${meta.color}cc`,
                  }}
                >
                  Recommended
                </span>
              )}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                  {tier.label}
                </div>
                <div className="mt-1 text-xs text-text-muted">{meta.sub}</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-medium tabular-nums tracking-tight text-text">
                  ${tier.price}
                </span>
              </div>
              <ul className="space-y-1.5 text-sm">
                {tier.includes.map((inc, j) => (
                  <li key={j} className="flex items-start gap-2 text-text">
                    <span
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                      style={{ background: meta.color }}
                    />
                    <span className="leading-snug">{inc}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-auto text-xs italic text-text-muted">{tier.who}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[3fr_4fr]">
        <div className="glass rounded-2xl p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Anchor pricing
          </div>
          <p className="mt-2 text-sm text-text">
            Show <span className="line-through text-text-muted">${p.anchorPrice}</span> next to the recommended price of <span className="font-semibold text-text">${p.recommendedPrice}</span> — the contrast does the convincing.
          </p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Bundle suggestions
          </div>
          <ul className="mt-2 space-y-1">
            {p.bundleSuggestions.map((b, i) => (
              <li key={i} className="text-sm text-text">• {b}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass mt-4 rounded-2xl p-5">
        <p className="text-sm leading-relaxed text-text">{p.priceJustification}</p>
        <div className="mt-3 flex justify-end">
          <ConfidencePill level={p.confidenceLevel} />
        </div>
      </div>
    </ResultsSection>
  );
}
