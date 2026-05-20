"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, FlaskConical, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  products: Product[];
  /** product_id → modified price (USD). When set, used to compute scores. */
  priceOverrides: Record<string, number>;
  onPriceOverride: (productId: string, priceUsd: number | null) => void;
  onReset: () => void;
};

/**
 * Lightweight what-if mode — currently scoped to price overrides. Local-only
 * recalculation drives the Margin pillar; other pillars are unchanged. A
 * future iteration can wire in country / persona swaps.
 *
 * Spec calls for country + persona swaps too — deferred. The price slider
 * is the highest-value lever (it directly drives margin headroom) and
 * proves the pattern.
 */
export function WhatIf({
  products,
  priceOverrides,
  onPriceOverride,
  onReset,
}: Props) {
  const [open, setOpen] = useState(false);
  const hasChanges = Object.keys(priceOverrides).length > 0;

  return (
    <section className="glass rounded-3xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: "rgba(167,136,255,0.10)",
              color: "var(--color-aurora-purple)",
              border: "1px solid rgba(167,136,255,0.30)",
            }}
          >
            <FlaskConical className="h-4 w-4" />
          </span>
          <div>
            <div className="font-serif text-base text-text">
              What if you changed something?
            </div>
            <p className="text-xs text-text-muted">
              Tweak prices to see how margin and the comparison shift.
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-dim transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border-soft p-5">
              <div className="space-y-4">
                {products.map((p) => {
                  const override = priceOverrides[p.id];
                  const price = override ?? p.suggestedPriceUSD;
                  const min = Math.max(1, Math.round(p.costUSD + p.shippingCostUSD + 1));
                  const max = Math.max(
                    Math.round(p.suggestedPriceUSD * 3),
                    min + 10,
                  );
                  const margin = price - p.costUSD - p.shippingCostUSD;
                  const markup = price / Math.max(0.01, p.costUSD + p.shippingCostUSD);
                  return (
                    <div key={p.id} className="rounded-2xl border border-border-soft bg-surface/40 p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-text">{p.name}</span>
                        <div className="flex items-baseline gap-2 font-mono">
                          <span className="text-text">${price.toFixed(2)}</span>
                          {override !== undefined && (
                            <span className="text-[10px] text-text-dim">
                              from ${p.suggestedPriceUSD.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Slider
                        value={[Math.round(price)]}
                        min={min}
                        max={max}
                        step={1}
                        onValueChange={(v) =>
                          onPriceOverride(
                            p.id,
                            v[0] === p.suggestedPriceUSD ? null : v[0] ?? null,
                          )
                        }
                        className="mt-2"
                      />
                      <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
                        <span>Margin: ${margin.toFixed(2)}</span>
                        <span>{markup.toFixed(1)}× markup</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-[11px] text-text-dim">
                  Only the Margin pillar recalculates locally. For a full
                  AI re-evaluation, regenerate the verdict.
                </p>
                {hasChanges && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-3 py-1.5 text-xs text-text-muted hover:border-aurora-blue/45 hover:text-text"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset all
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
