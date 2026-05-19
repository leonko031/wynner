"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, MoreHorizontal } from "lucide-react";
import { ScoreRing } from "@/components/animated/score-ring";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProductStore } from "@/lib/store/products";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { Product, Verdict } from "@/types";
import { cn } from "@/lib/utils";

const VERDICT_META: Record<
  Verdict,
  { label: string; color: string }
> = {
  go: { label: "GO", color: "#00D26A" },
  test: { label: "TEST", color: "#F5A623" },
  risky: { label: "RISKY", color: "#F97316" },
  skip: { label: "SKIP", color: "#EF4444" },
};

type Props = { product: Product; index?: number };

export function ProductRow({ product, index = 0 }: Props) {
  const router = useRouter();
  const toggleFavorite = useProductStore((s) => s.toggleFavorite);
  const removeProduct = useProductStore((s) => s.removeProduct);
  const isFav = useProductStore((s) => s.favorites.has(product.id));

  const verdict = VERDICT_META[product.verdict];
  const niche = NICHES[product.category];
  const country = COUNTRIES[product.targetCountry];

  const pillars = product.pillars;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index, 12) * 0.02,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ x: 2 }}
      onClick={() => router.push(`/product/${product.id}`)}
      className={cn(
        "glass group relative cursor-pointer rounded-2xl px-3 py-3",
        // Mobile: 3-col stacked. Desktop: 7-col rich layout.
        "grid grid-cols-[48px_1fr_auto] items-center gap-3 md:grid-cols-[56px_1fr_56px_180px_120px_56px_36px] md:gap-4 md:px-4",
        "transition-all hover:-translate-y-0.5",
      )}
    >
      <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-border-soft bg-surface-elevated">
        <Image
          src={product.image}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-text">
          {product.name}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-muted">
          <span
            className="inline-flex items-center rounded-full px-1.5 py-px"
            style={{
              backgroundColor: `${niche.color}1A`,
              color: niche.color,
              border: `1px solid ${niche.color}33`,
            }}
          >
            {niche.label}
          </span>
          <span>{country?.flag} {country?.code}</span>
          <span className="text-text-dim">·</span>
          <span className="font-mono tabular-nums">
            ${product.suggestedPriceUSD.toFixed(0)} · {(product.suggestedPriceUSD / (product.costUSD + product.shippingCostUSD)).toFixed(1)}×
          </span>
        </div>
      </div>

      {/* Mobile compact tail: score + fav stacked, hides the rich columns */}
      <div className="flex items-center gap-2 md:hidden">
        <span
          className="font-mono text-base font-medium tabular-nums"
          style={{ color: verdict.color }}
        >
          {product.sellScore}
        </span>
        <button
          type="button"
          aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
            isFav
              ? "border-skip/50 bg-skip/10 text-skip"
              : "border-border-soft bg-surface text-text-muted hover:border-border-strong hover:text-text",
          )}
        >
          <Heart className="h-3.5 w-3.5" fill={isFav ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="hidden md:block">
        <ScoreRing value={product.sellScore} size={52} strokeWidth={4} />
      </div>

      {/* Pillars mini-bars — desktop only */}
      <div className="hidden space-y-1 md:block">
        {(["margin", "marketFit", "demand", "competition", "creative"] as const).map(
          (k) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className="w-14 text-[9px] uppercase tracking-wider text-text-dim">
                {k === "marketFit" ? "Fit" : k}
              </span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-elevated">
                <div
                  className="h-full"
                  style={{
                    width: `${pillars[k]}%`,
                    backgroundColor:
                      pillars[k] >= 75
                        ? "#00D26A"
                        : pillars[k] >= 50
                          ? "#F5A623"
                          : "#EF4444",
                  }}
                />
              </div>
              <span className="w-6 text-right font-mono text-[9px] tabular-nums text-text-muted">
                {pillars[k]}
              </span>
            </div>
          ),
        )}
      </div>

      <span
        className="hidden md:inline-flex justify-self-start items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider"
        style={{
          backgroundColor: `${verdict.color}26`,
          color: verdict.color,
          border: `1px solid ${verdict.color}55`,
        }}
      >
        {verdict.label}
      </span>

      <button
        type="button"
        aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(product.id);
        }}
        className={cn(
          "hidden md:flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
          isFav
            ? "border-skip/50 bg-skip/10 text-skip"
            : "border-border-soft bg-surface text-text-muted hover:border-border-strong hover:text-text",
        )}
      >
        <Heart className="h-3.5 w-3.5" fill={isFav ? "currentColor" : "none"} />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Row actions"
            onClick={(e) => e.stopPropagation()}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-full border border-border-soft bg-surface text-text-muted hover:text-text"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/product/${product.id}`);
            }}
          >
            Open
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/compare?products=${product.id}`);
            }}
          >
            Compare
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/scan?similar=${product.id}`);
            }}
          >
            Scan similar
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-skip focus:text-skip"
            onClick={(e) => {
              e.stopPropagation();
              removeProduct(product.id);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
