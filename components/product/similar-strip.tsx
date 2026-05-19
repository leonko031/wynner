"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useProductStore } from "@/lib/store/products";
import { NICHES } from "@/lib/data/niches";
import type { Product, Verdict } from "@/types";

const VERDICT_CLR: Record<Verdict, string> = {
  go: "#00D26A",
  test: "#F5A623",
  risky: "#F97316",
  skip: "#EF4444",
};

export function SimilarStrip({ product }: { product: Product }) {
  const products = useProductStore((s) => s.products);
  const related = useMemo(
    () =>
      products
        .filter(
          (p) => p.id !== product.id && p.category === product.category,
        )
        .sort((a, b) => b.sellScore - a.sellScore)
        .slice(0, 6),
    [products, product],
  );

  if (related.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-medium tracking-tight md:text-2xl">
          Similar in {NICHES[product.category].label}
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          {related.length} match{related.length === 1 ? "" : "es"}
        </span>
      </div>
      <div className="-mx-6 px-6">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {related.map((p) => (
            <SimilarCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SimilarCard({ product }: { product: Product }) {
  const color = VERDICT_CLR[product.verdict];
  return (
    <Link
      href={`/product/${product.id}`}
      className="group block w-[220px] shrink-0 snap-start rounded-2xl border border-border-soft bg-surface p-3 transition-colors hover:border-border-strong"
    >
      <motion.div
        layoutId={`product-image-${product.id}`}
        className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface-elevated"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="220px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          unoptimized
        />
      </motion.div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-sm leading-snug text-text">
          {product.name}
        </h3>
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums"
          style={{
            backgroundColor: `${color}26`,
            color,
            border: `1px solid ${color}40`,
          }}
        >
          {product.sellScore}
        </span>
      </div>
    </Link>
  );
}
