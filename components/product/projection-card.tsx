"use client";

import { useMemo } from "react";
import { RevealOnScroll } from "@/components/animated/reveal-on-scroll";
import { ScoreNumber } from "@/components/animated/score-number";
import { getProjection } from "@/lib/scoring/projections";
import { COUNTRIES } from "@/lib/data/countries";
import type { Product } from "@/types";

export function ProjectionCard({ product }: { product: Product }) {
  const country = COUNTRIES[product.targetCountry];
  const p = useMemo(() => getProjection(product, country), [product, country]);

  return (
    <RevealOnScroll>
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-medium tracking-tight md:text-2xl">
            Projected performance
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Country-modeled · {country.flag} {country.code}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Tile
            label="Starting budget"
            value={p.budgetPerDayEUR}
            prefix="€"
            suffix=" / day"
          />
          <Tile
            label="Break-even ROAS"
            value={p.breakEvenROAS}
            decimals={1}
            suffix="×"
          />
          <Tile
            label="Expected CPA"
            valueText={`€${p.cpaMinEUR}–€${p.cpaMaxEUR}`}
          />
        </div>
        <p className="mt-3 text-xs text-text-dim">
          Based on country CPM index, margin, and competitor density. Not a
          guarantee — treat as a sanity check, not a forecast.
        </p>
      </section>
    </RevealOnScroll>
  );
}

function Tile({
  label,
  value,
  valueText,
  prefix,
  suffix,
  decimals = 0,
}: {
  label: string;
  value?: number;
  valueText?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface p-5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-1 font-mono text-3xl font-medium tabular-nums">
        {prefix && <span className="text-text-muted">{prefix}</span>}
        {value !== undefined ? (
          <ScoreNumber
            value={value}
            duration={1.4}
            decimals={decimals}
            className="text-3xl font-medium"
          />
        ) : (
          <span>{valueText}</span>
        )}
        {suffix && <span className="text-text-muted">{suffix}</span>}
      </div>
    </div>
  );
}
