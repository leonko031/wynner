"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Heart } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { ScoreRing } from "@/components/animated/score-ring";
import { Sparkline } from "@/components/animated/sparkline";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import { useProductStore } from "@/lib/store/products";
import { whyItsHere } from "@/lib/dashboard/daily-picks";
import type { Product, Verdict } from "@/types";
import { cn } from "@/lib/utils";

const VERDICT_COLOR: Record<Verdict, string> = {
  go: "#3DD68C",
  test: "#FFAB40",
  risky: "#FF7E5F",
  skip: "#FF5C7C",
};

type Props = { product: Product; index: number };

/**
 * Large product card with subtle tilt-follow parallax + a score ring + a
 * sparkline + a one-line "why" reason. Used inside the horizontal scroll
 * carousel.
 */
export function TopPickCard({ product, index }: Props) {
  const niche = NICHES[product.category];
  const country = COUNTRIES[product.targetCountry];
  const isFav = useProductStore((s) => s.favorites.has(product.id));
  const toggleFavorite = useProductStore((s) => s.toggleFavorite);
  const accent = VERDICT_COLOR[product.verdict];

  // Tilt-follow — kept lightweight: only triggers when cursor is over THIS card.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-50, 50], [4, -4]), { stiffness: 240, damping: 18 });
  const ry = useSpring(useTransform(x, [-50, 50], [-4, 4]), { stiffness: 240, damping: 18 });

  function handleMove(e: ReactPointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - (r.left + r.width / 2));
    y.set(e.clientY - (r.top + r.height / 2));
  }
  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="shrink-0 snap-start"
      style={{ width: 280 }}
    >
      <motion.div
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        whileHover={{ y: -6 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="glass relative flex h-[360px] flex-col gap-3 rounded-3xl p-4"
        // Verdict-tinted halo on the card
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{
            boxShadow: `inset 0 1px 0 0 var(--surface-glass-highlight), 0 18px 36px -18px ${accent}55`,
          }}
        />

        {/* Image + floating overlays */}
        <Link
          href={`/product/${product.id}`}
          className="relative block aspect-[5/4] overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="280px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
          {/* Top-left: score ring */}
          <div className="absolute left-3 top-3">
            <div className="rounded-full bg-ink/40 p-0.5 backdrop-blur">
              <ScoreRing value={product.sellScore} size={56} strokeWidth={5} />
            </div>
          </div>
          {/* Top-right: favorite */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(product.id);
            }}
            aria-label={isFav ? "Unfavorite" : "Favorite"}
            className={cn(
              "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur transition-all",
              isFav
                ? "border-skip/55 bg-skip/15 text-skip"
                : "border-border-soft/70 bg-ink/30 text-white hover:bg-ink/50",
            )}
          >
            <Heart className="h-3.5 w-3.5" fill={isFav ? "currentColor" : "none"} />
          </button>
        </Link>

        {/* Name + meta row */}
        <div>
          <Link
            href={`/product/${product.id}`}
            className="line-clamp-2 font-serif text-base leading-tight text-text hover:underline"
          >
            {product.name}
          </Link>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
            <span
              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px]"
              style={{
                background: `${niche?.color ?? "#5B8DFF"}1A`,
                color: niche?.color,
                border: `1px solid ${niche?.color ?? "#5B8DFF"}33`,
              }}
            >
              {niche?.label ?? product.category}
            </span>
            <span className="text-text-muted">
              {country?.flag} {country?.code}
            </span>
          </div>
        </div>

        {/* Sparkline */}
        <div className="h-12">
          <Sparkline data={product.demandTrend} color={accent} height={48} />
        </div>

        {/* Why it's here */}
        <p className="mt-auto line-clamp-2 text-[11px] leading-snug text-text-muted">
          {whyItsHere(product)}
        </p>
      </motion.div>
    </motion.div>
  );
}
