"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { ScoreRing } from "@/components/animated/score-ring";
import { Sparkline } from "@/components/animated/sparkline";
import { useProductStore } from "@/lib/store/products";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { Product, Verdict } from "@/types";
import { cn } from "@/lib/utils";

const VERDICT_META: Record<
  Verdict,
  { label: string; color: string; halo: string }
> = {
  go: { label: "GO", color: "#3DD68C", halo: "halo-go" },
  test: { label: "TEST", color: "#FFAB40", halo: "halo-test" },
  risky: { label: "RISKY", color: "#FF7E5F", halo: "halo-risky" },
  skip: { label: "SKIP", color: "#FF5C7C", halo: "halo-skip" },
};

type ProductCardProps = {
  product: Product;
  index?: number;
};

/**
 * Glass product card with aggressive reveal-on-interact:
 * at rest → image, name, score ring only.
 * on hover → card lifts + tilts, sparkline draws in, three reveal-tags fade in
 * (margin, country, niche). Verdict halo blooms gently through the glass.
 */
export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const toggleFavorite = useProductStore((s) => s.toggleFavorite);
  const isFav = useProductStore((s) => s.favorites.has(product.id));
  const [hovering, setHovering] = useState(false);

  const verdict = VERDICT_META[product.verdict];
  const niche = NICHES[product.category];
  const country = COUNTRIES[product.targetCountry];
  const markup = product.suggestedPriceUSD / (product.costUSD + product.shippingCostUSD);

  const onCardClick = () => router.push(`/product/${product.id}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 26,
        delay: reduce ? 0 : Math.min(index, 12) * 0.06,
      }}
      whileHover={reduce ? undefined : { y: -8 }}
      onPointerLeave={() => setHovering(false)}
      onPointerEnter={() => setHovering(true)}
      role="button"
      tabIndex={0}
      onClick={onCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCardClick();
        }
      }}
      className={cn(
        "glass group relative cursor-pointer rounded-3xl p-5",
        "transition-shadow duration-300 ease-out",
        hovering && verdict.halo,
        "focus-visible:outline-none",
      )}
    >
      {/* Soft inner verdict bloom — only on hover */}
      <AnimatePresence>
        {hovering && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-none absolute -inset-px rounded-3xl"
            style={{
              background: `radial-gradient(ellipse 70% 100% at 50% 100%, ${verdict.color}1F 0%, transparent 65%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Favorite */}
      <button
        type="button"
        aria-label={isFav ? "Remove from vault" : "Save to vault"}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(product.id);
        }}
        className={cn(
          "absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-all",
          isFav
            ? "border-skip/50 bg-skip/15 text-skip shadow-[0_0_18px_rgba(255,92,124,0.45)]"
            : "border-border-soft bg-white/40 text-text-muted opacity-0 backdrop-blur-md group-hover:opacity-100 hover:border-border-strong hover:text-text",
        )}
      >
        <motion.span
          animate={isFav ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18 }}
          className="flex"
        >
          <Heart
            className="h-3.5 w-3.5"
            fill={isFav ? "currentColor" : "none"}
          />
        </motion.span>
      </button>

      {/* Top — image (with shared layoutId) + score ring */}
      <div className="relative flex items-start gap-4">
        <motion.div
          layoutId={`product-image-${product.id}`}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border-soft bg-white/40"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="80px"
            className="object-cover"
            unoptimized
            loading="lazy"
          />
          {/* inner top highlight */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
            }}
          />
        </motion.div>
        <div className="ml-auto">
          <ScoreRing value={product.sellScore} size={64} strokeWidth={5} />
        </div>
      </div>

      {/* Name */}
      <h3 className="relative mt-4 line-clamp-2 text-base font-medium leading-snug tracking-tight text-text">
        {product.name}
      </h3>

      {/* Reveal-on-hover: tags row */}
      <div className="relative mt-3 h-6">
        <AnimatePresence>
          {hovering && (
            <motion.div
              key="tags"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{
                type: "spring",
                stiffness: 340,
                damping: 26,
              }}
              className="absolute inset-0 flex items-center gap-1.5 text-[11px]"
            >
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: `${niche.color}22`,
                  color: niche.color,
                  border: `1px solid ${niche.color}55`,
                }}
              >
                {niche.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-white/40 px-2 py-0.5 text-text-muted backdrop-blur-sm">
                <span aria-hidden>{country?.flag}</span>
                {country?.code}
              </span>
              <span className="inline-flex items-center rounded-full border border-border-soft bg-white/40 px-2 py-0.5 font-mono text-text-muted backdrop-blur-sm">
                {markup.toFixed(1)}×
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reveal-on-hover: sparkline + verdict */}
      <div className="relative mt-3 h-10 -mx-1">
        <AnimatePresence>
          {hovering && (
            <motion.div
              key="spark"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute inset-0"
            >
              <Sparkline
                data={product.demandTrend}
                color={verdict.color}
                height={36}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative mt-1 flex items-center justify-end">
        <AnimatePresence>
          {hovering && (
            <motion.span
              key="verdict"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider"
              style={{
                backgroundColor: `${verdict.color}26`,
                color: verdict.color,
                border: `1px solid ${verdict.color}55`,
                boxShadow: `0 0 18px ${verdict.color}44`,
              }}
            >
              {verdict.label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return <div className="glass h-[268px] rounded-3xl" />;
}
