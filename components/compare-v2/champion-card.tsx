"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, ExternalLink, RefreshCw, X } from "lucide-react";
import { ScoreNumber } from "@/components/animated/score-number";
import { ScoreRing } from "@/components/animated/score-ring";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { Product, Verdict } from "@/types";
import { cn } from "@/lib/utils";

const VERDICT_META: Record<Verdict, { label: string; color: string }> = {
  go: { label: "GO LIVE", color: "#3DD68C" },
  test: { label: "TEST IT", color: "#FFAB40" },
  risky: { label: "PROCEED WITH CARE", color: "#FF7E5F" },
  skip: { label: "SKIP", color: "#FF5C7C" },
};

type Props = {
  product: Product;
  index: number;
  /** When true, this card displays the winner crown + larger scale + glow. */
  isWinner: boolean;
  /** Hide the winner crown until the verdict's spring-bounce timing. */
  showCrown: boolean;
  /** Whether to dim this card (non-winning in close call). */
  dim?: boolean;
  /** Per-slot custom score override — used by the tie-breaker / what-if pipes. */
  scoreOverride?: number | null;
  onRemove: () => void;
};

/**
 * Champion card — taller / richer than vault cards. Big image, count-up
 * score in a large aurora ring, verdict badge. Winner gets a floating
 * crown + scale-up + green pulse.
 */
export function ChampionCard({
  product,
  index,
  isWinner,
  showCrown,
  dim,
  scoreOverride,
  onRemove,
}: Props) {
  const niche = NICHES[product.category];
  const country = COUNTRIES[product.targetCountry];
  const verdict = VERDICT_META[product.verdict];
  const displayScore = scoreOverride ?? product.sellScore;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{
        opacity: dim ? 0.65 : 1,
        y: 0,
        scale: isWinner ? 1.04 : 1,
      }}
      exit={{ opacity: 0, scale: 0.95, y: 18 }}
      transition={{
        duration: 0.5,
        delay: 0.08 * index,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "glass-strong relative flex h-[480px] flex-col gap-4 rounded-3xl p-5",
        "snap-start",
      )}
      style={{
        boxShadow: isWinner
          ? "0 0 0 1px rgba(61,214,140,0.55), 0 32px 80px -22px rgba(61,214,140,0.55), 0 0 60px rgba(61,214,140,0.20)"
          : `0 0 0 1px ${verdict.color}26, 0 20px 50px -22px ${verdict.color}45, inset 0 1px 0 0 var(--surface-glass-highlight)`,
      }}
    >
      {/* Winner crown */}
      {isWinner && showCrown && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.4, rotate: -25 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.1 }}
          className="absolute -top-4 -right-3 z-10"
        >
          <Crown
            className="h-8 w-8 text-go drop-shadow-[0_0_14px_rgba(61,214,140,0.85)]"
            fill="currentColor"
          />
        </motion.div>
      )}

      {/* Remove (top-left) */}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove from comparison"
        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border-soft bg-surface/70 text-text-muted backdrop-blur hover:border-skip/55 hover:text-skip"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Image */}
      <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover"
          priority={index < 2}
          unoptimized
        />
      </div>

      {/* Name + niche/country */}
      <div>
        <h3
          className="line-clamp-2 font-serif text-lg leading-snug tracking-tight text-text"
          title={product.name}
        >
          {product.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
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
          <span className="text-text-muted">
            {country?.flag} {country?.name}
          </span>
        </div>
      </div>

      {/* Score ring + verdict */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <ScoreRing value={displayScore} size={80} strokeWidth={6} scanning={isWinner} />
          {/* Layer a count-up over the ring's static number — we use it
              instead of the ring's static text by absolute positioning. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <ScoreNumber
              value={displayScore}
              duration={1.2}
              className="font-mono text-2xl font-medium tabular-nums leading-none text-text"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider"
            style={{
              background: `${verdict.color}26`,
              color: verdict.color,
              border: `1px solid ${verdict.color}40`,
              boxShadow: `0 0 14px ${verdict.color}55`,
            }}
          >
            {verdict.label}
          </span>
          {scoreOverride !== null && scoreOverride !== undefined && scoreOverride !== product.sellScore && (
            <span className="font-mono text-[10px] text-text-dim">
              Original: {product.sellScore}
            </span>
          )}
        </div>
      </div>

      {/* Bottom action row */}
      <div className="mt-auto flex items-center gap-1.5">
        <Link
          href={`/product/${product.id}`}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-border-soft bg-surface/70 px-3 text-[11px] text-text-muted hover:border-aurora-purple/45 hover:text-text"
        >
          View detail
          <ExternalLink className="h-3 w-3" />
        </Link>
        <Link
          href={`/product/${product.id}#rescore`}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-border-soft bg-surface/70 px-3 text-[11px] text-text-muted hover:border-aurora-purple/45 hover:text-text"
        >
          <RefreshCw className="h-3 w-3" />
          Re-score
        </Link>
      </div>
    </motion.article>
  );
}
