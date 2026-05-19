"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useProductStore } from "@/lib/store/products";
import { ScoreRing } from "@/components/animated/score-ring";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";

export function ProductHero({ id }: { id: string }) {
  const product = useProductStore((s) => s.products.find((p) => p.id === id));
  const markViewed = useProductStore((s) => s.markViewed);

  useEffect(() => {
    if (product) markViewed(product.id);
  }, [product, markViewed]);

  if (!product) {
    return (
      <div className="rounded-2xl border border-border-soft bg-surface/40 p-10 text-center text-sm text-text-muted">
        Product not found.
      </div>
    );
  }

  const country = COUNTRIES[product.targetCountry];
  const niche = NICHES[product.category];

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[5fr_7fr]">
      <motion.div
        layoutId={`product-image-${product.id}`}
        className="relative aspect-square overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 40vw"
          className="object-cover"
          unoptimized
          priority
        />
      </motion.div>
      <div className="flex flex-col justify-center gap-5">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none" aria-hidden>
            {country?.flag}
          </span>
          <span className="text-sm text-text-muted">{country?.name}</span>
          <span className="mx-1 text-text-dim">·</span>
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px]"
            style={{
              backgroundColor: `${niche.color}1A`,
              color: niche.color,
              border: `1px solid ${niche.color}33`,
            }}
          >
            {niche.label}
          </span>
        </div>
        <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
          {product.name}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          {product.description}
        </p>
        <div className="mt-2 flex items-center gap-6">
          <ScoreRing value={product.sellScore} size={96} strokeWidth={6} />
          <div className="space-y-1">
            <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Top angle
            </div>
            <p className="max-w-md text-sm text-text">
              {product.reasoning.topAngle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
