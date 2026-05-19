"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, MoreHorizontal } from "lucide-react";
import { ScoreRing } from "@/components/animated/score-ring";
import { Sparkline } from "@/components/animated/sparkline";
import { useProductStore } from "@/lib/store/products";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { Product, Verdict } from "@/types";
import { StatusPill } from "./status-pill";
import { cn } from "@/lib/utils";

const VERDICT_META: Record<Verdict, { label: string; color: string }> = {
  go: { label: "GO", color: "#3DD68C" },
  test: { label: "TEST", color: "#FFAB40" },
  risky: { label: "RISKY", color: "#FF7E5F" },
  skip: { label: "SKIP", color: "#FF5C7C" },
};

type Props = {
  product: Product;
  index: number;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
};

/**
 * Higher-density list view of a product. Single row with thumbnail, name,
 * niche, country, sparkline, score ring, verdict pill, favorite, menu.
 */
export function ProductRowV2({
  product,
  index,
  selectMode,
  selected,
  onToggleSelect,
}: Props) {
  const niche = NICHES[product.category];
  const country = COUNTRIES[product.targetCountry];
  const verdict = VERDICT_META[product.verdict];
  const isFav = useProductStore((s) => s.favorites.has(product.id));
  const toggleFavorite = useProductStore((s) => s.toggleFavorite);

  function handleClick(e: React.MouseEvent) {
    if (selectMode || e.shiftKey) {
      e.preventDefault();
      onToggleSelect();
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 6 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.015, 0.3), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/product/${product.id}`}
        onClick={handleClick}
        className={cn(
          "glass group relative flex items-center gap-3 rounded-xl p-3 transition-all hover:border-l-[3px] hover:border-l-aurora-blue hover:bg-surface",
          selected && "ring-2 ring-aurora-purple/55",
        )}
        style={{ minHeight: 76 }}
      >
        {/* Multi-select checkbox */}
        {selectMode && (
          <span
            aria-hidden
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
              selected
                ? "border-aurora-purple bg-aurora-purple text-white"
                : "border-border-strong",
            )}
          >
            {selected && (
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5"><path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </span>
        )}
        {/* Thumb */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border-soft bg-surface-elevated">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="56px"
            className="object-cover"
            unoptimized
          />
        </div>
        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-text">{product.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
            {niche && (
              <span
                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px]"
                style={{
                  background: `${niche.color}1A`,
                  color: niche.color,
                  border: `1px solid ${niche.color}33`,
                }}
              >
                {niche.label}
              </span>
            )}
            <span className="text-text-muted">{country?.flag} {country?.code}</span>
            <StatusPill productId={product.id} />
          </div>
        </div>
        {/* Sparkline */}
        <div className="hidden h-7 w-24 sm:block">
          <Sparkline data={product.demandTrend} color={verdict.color} height={28} />
        </div>
        {/* Score ring */}
        <div className="shrink-0">
          <ScoreRing value={product.sellScore} size={36} strokeWidth={3} />
        </div>
        {/* Verdict pill */}
        <span
          className="hidden shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider sm:inline-flex"
          style={{
            background: `${verdict.color}1A`,
            color: verdict.color,
            border: `1px solid ${verdict.color}45`,
          }}
        >
          {verdict.label}
        </span>
        {/* Favorite */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(product.id);
          }}
          aria-label={isFav ? "Unfavorite" : "Favorite"}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
            isFav
              ? "border-aurora-pink/55 bg-aurora-pink/15 text-aurora-pink"
              : "border-border-soft bg-surface/70 text-text-muted hover:text-text",
          )}
        >
          <Heart className="h-3.5 w-3.5" fill={isFav ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          aria-label="More"
          onClick={(e) => e.preventDefault()}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-soft bg-surface/70 text-text-muted hover:text-text md:flex"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </Link>
    </motion.div>
  );
}
