"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { ScoreRing } from "@/components/animated/score-ring";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { Product, Verdict } from "@/types";
import {
  getConfidence,
  type Confidence,
} from "@/lib/scoring/projections";
import { cn } from "@/lib/utils";

const VERDICT_META: Record<Verdict, { label: string; color: string }> = {
  go: { label: "GO LIVE", color: "#00D26A" },
  test: { label: "TEST IT", color: "#F5A623" },
  risky: { label: "PROCEED WITH CARE", color: "#F97316" },
  skip: { label: "SKIP", color: "#EF4444" },
};

const CONFIDENCE_COPY: Record<Confidence, string> = {
  high: "Confidence: high",
  medium: "Confidence: medium",
  low: "Confidence: low",
};

const SOURCE_LABEL: Record<Product["source"], string> = {
  aliexpress: "AliExpress",
  temu: "Temu",
  amazon: "Amazon",
  manual: "Manual",
};

export function ProductHero({ product }: { product: Product }) {
  const [activeImg, setActiveImg] = useState(product.image);
  const verdict = VERDICT_META[product.verdict];
  const niche = NICHES[product.category];
  const country = COUNTRIES[product.targetCountry];
  const confidence = getConfidence(product.sellScore);
  const markup = product.suggestedPriceUSD / (product.costUSD + product.shippingCostUSD);
  const marginAbs = product.suggestedPriceUSD - product.costUSD - product.shippingCostUSD;
  const thumbs = [product.image, ...(product.secondaryImages ?? [])].slice(0, 4);

  return (
    <section className="grid grid-cols-1 gap-8 md:grid-cols-[5fr_4fr_3fr] md:gap-10">
      {/* LEFT — image */}
      <div className="flex flex-col gap-3">
        <motion.div
          layoutId={`product-image-${product.id}`}
          className="glass relative aspect-square w-full overflow-hidden rounded-3xl"
          style={{
            boxShadow: `0 0 0 1px ${verdict.color}33, 0 30px 60px -20px ${verdict.color}55, 0 0 60px ${verdict.color}26`,
          }}
        >
          <Image
            src={activeImg}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover"
            priority
            unoptimized
          />
        </motion.div>
        <div className="grid grid-cols-4 gap-2">
          {thumbs.map((src, i) => {
            const active = activeImg === src;
            return (
              <button
                key={`${src}-${i}`}
                onClick={() => setActiveImg(src)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-md border bg-surface-elevated transition-all",
                  active
                    ? "border-text/40"
                    : "border-border-soft hover:border-border-strong",
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="100px"
                  className="object-cover"
                  unoptimized
                />
              </button>
            );
          })}
          {/* pad to 4 slots if fewer images */}
          {Array.from({ length: Math.max(0, 4 - thumbs.length) }).map((_, i) => (
            <div
              key={`pad-${i}`}
              className="aspect-square rounded-md border border-border-soft/40 bg-surface/30"
            />
          ))}
        </div>
      </div>

      {/* CENTER */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5"
            style={{
              backgroundColor: `${niche.color}1A`,
              color: niche.color,
              border: `1px solid ${niche.color}33`,
            }}
          >
            {niche.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface/60 px-2 py-0.5 text-text-muted">
            <span aria-hidden>{country?.flag}</span>
            {country?.name}
          </span>
          <span className="inline-flex items-center rounded-full border border-border-soft bg-surface/60 px-2 py-0.5 font-mono text-text-dim">
            {SOURCE_LABEL[product.source]}
          </span>
        </div>

        <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
          {product.name}
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-text-muted">
          {product.description}
        </p>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <StatPill label="Cost" value={`$${product.costUSD.toFixed(2)}`} />
          <StatPill
            label="Price"
            value={`$${product.suggestedPriceUSD.toFixed(2)}`}
          />
          <StatPill
            label="Margin"
            value={`${markup.toFixed(1)}× / $${marginAbs.toFixed(2)}`}
          />
        </div>
      </div>

      {/* RIGHT — score ring */}
      <div className="glass flex flex-col items-center justify-center gap-4 rounded-3xl p-5">
        <ScoreRing
          value={product.sellScore}
          size={200}
          strokeWidth={10}
          label="Sell score"
          scanning
        />
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wider"
          style={{
            backgroundColor: `${verdict.color}26`,
            color: verdict.color,
            border: `1px solid ${verdict.color}40`,
          }}
        >
          {verdict.label}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          {CONFIDENCE_COPY[confidence]}
        </span>
      </div>
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-soft bg-surface/60 p-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm tabular-nums text-text">
        {value}
      </div>
    </div>
  );
}
