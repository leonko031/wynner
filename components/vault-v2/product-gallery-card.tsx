"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useProductStore } from "@/lib/store/products";
import { COUNTRIES } from "@/lib/data/countries";
import type { Product, Verdict } from "@/types";
import { StatusPill } from "./status-pill";
import { cn } from "@/lib/utils";

const VERDICT_COLOR: Record<Verdict, string> = {
  go: "#3DD68C",
  test: "#FFAB40",
  risky: "#FF7E5F",
  skip: "#FF5C7C",
};

type Props = {
  product: Product;
  index: number;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
};

/**
 * Image-forward "Gallery" view. Full-bleed product image with a floating
 * score pill overlaid. Larger than grid cards, minimal text.
 */
export function ProductGalleryCard({
  product,
  index,
  selectMode,
  selected,
  onToggleSelect,
}: Props) {
  const accent = VERDICT_COLOR[product.verdict];
  const country = COUNTRIES[product.targetCountry];
  const isFav = useProductStore((s) => s.favorites.has(product.id));
  const toggleFavorite = useProductStore((s) => s.toggleFavorite);
  const marginUsd = product.suggestedPriceUSD - product.costUSD - product.shippingCostUSD;

  function handleClick(e: React.MouseEvent) {
    if (selectMode || e.shiftKey) {
      e.preventDefault();
      onToggleSelect();
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.4), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/product/${product.id}`}
        onClick={handleClick}
        className={cn(
          "group relative block overflow-hidden rounded-3xl border border-border-soft",
          selected && "ring-2 ring-aurora-purple/55",
        )}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-elevated">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            unoptimized
          />
          {/* Score pill overlay */}
          <span
            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-base font-semibold tabular-nums text-white backdrop-blur"
            style={{
              background: `${accent}AA`,
              boxShadow: `0 6px 16px -4px ${accent}aa`,
            }}
          >
            {product.sellScore}
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
              "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition-all",
              isFav
                ? "border-aurora-pink/55 bg-aurora-pink/15 text-aurora-pink"
                : "border-border-soft/70 bg-ink/30 text-white hover:bg-ink/50",
            )}
          >
            <Heart className="h-4 w-4" fill={isFav ? "currentColor" : "none"} />
          </button>
          {selectMode && (
            <span
              aria-hidden
              className={cn(
                "absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border-2 backdrop-blur",
                selected
                  ? "border-aurora-purple bg-aurora-purple text-white"
                  : "border-white/80 bg-ink/30 text-white",
              )}
            >
              {selected && (
                <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </span>
          )}
        </div>
        {/* Bottom strip */}
        <div className="flex items-center justify-between gap-3 bg-surface/80 px-4 py-3 backdrop-blur">
          <div className="min-w-0 flex-1">
            <div className="truncate font-serif text-base text-text">{product.name}</div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-muted">
              <span>{country?.flag} {country?.code}</span>
              <span>·</span>
              <span className="font-mono tabular-nums">${marginUsd.toFixed(2)} margin</span>
            </div>
          </div>
          <StatusPill productId={product.id} size="sm" />
        </div>
      </Link>
    </motion.div>
  );
}
