"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Download, Sparkles, Upload } from "lucide-react";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProductStore } from "@/lib/store/products";
import { useCollectionsStore } from "@/lib/store/collections";
import type { Product } from "@/types";

type Props = {
  onSmartSort: () => void;
  onImport: () => void;
};

/**
 * Glass header at the top of /vault — stats summary on the left, primary
 * actions on the right, with a slow aurora breathing background.
 */
export function VaultHeader({ onSmartSort, onImport }: Props) {
  const products = useProductStore((s) => s.products);
  const favorites = useProductStore((s) => s.favorites);
  const collections = useCollectionsStore((s) => s.collections);

  const stats = useMemo(() => computeStats(products), [products]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Slow breathing aurora background */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-3xl"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 20% 50%, rgba(91,141,255,0.22), transparent 70%), radial-gradient(ellipse 50% 60% at 80% 50%, rgba(167,136,255,0.20), transparent 70%)",
        }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="glass-strong rounded-3xl p-6 md:p-8"
        style={{
          boxShadow:
            "0 0 0 1px rgba(167,136,255,0.25), 0 24px 48px -20px rgba(91,141,255,0.30)",
        }}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[3fr_2fr]">
          {/* LEFT — title + stats */}
          <div>
            <h1 className="font-serif text-3xl tracking-tight text-text md:text-4xl">
              Your vault
            </h1>
            <p className="mt-1 text-sm text-text-muted md:text-base">
              {stats.total} product{stats.total === 1 ? "" : "s"} scored · {favorites.size} favorited ·{" "}
              {collections.length} collection{collections.length === 1 ? "" : "s"}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatPill
                value={stats.total}
                label="total"
                color="#5B8DFF"
                tooltip="Every product in your vault — yours plus the platform's curated seed."
              />
              <StatPill
                value={stats.go}
                label="GO"
                color="#3DD68C"
                tooltip="High-conviction picks (sell score ≥ 80)."
              />
              <StatPill
                value={stats.test}
                label="TEST"
                color="#FFAB40"
                tooltip="Worth testing on a small budget (60-79)."
              />
              <StatPill
                value={stats.avgScore || "—"}
                label="avg score"
                color="#A788FF"
                mono
                tooltip={
                  stats.total === 0
                    ? "No products yet."
                    : `Mean sell score across all ${stats.total} products in your vault.`
                }
              />
            </div>
          </div>

          {/* RIGHT — actions */}
          <div className="flex flex-col gap-2.5 md:items-stretch">
            <Link
              href="/scan"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium text-white shadow-[0_12px_32px_-8px_rgba(91,141,255,0.55)] transition-all hover:brightness-110"
              style={{
                background:
                  "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              }}
            >
              <Sparkles className="h-4 w-4" />
              New scan
            </Link>
            <button
              type="button"
              onClick={onSmartSort}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-aurora-purple/45 bg-aurora-purple/10 text-sm text-aurora-purple hover:bg-aurora-purple/20"
            >
              <Sparkles className="h-4 w-4" />
              Smart sort
            </button>
            <button
              type="button"
              onClick={onImport}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border-soft bg-surface/70 text-sm text-text-muted hover:border-border-strong hover:text-text"
            >
              <Upload className="h-4 w-4" />
              Import products
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */

function computeStats(products: Product[]) {
  if (products.length === 0) {
    return { total: 0, go: 0, test: 0, avgScore: 0 };
  }
  let go = 0;
  let test = 0;
  let scoreSum = 0;
  for (const p of products) {
    if (p.verdict === "go") go++;
    else if (p.verdict === "test") test++;
    scoreSum += p.sellScore;
  }
  return {
    total: products.length,
    go,
    test,
    avgScore: Math.round(scoreSum / products.length),
  };
}

function StatPill({
  value,
  label,
  color,
  tooltip,
  mono,
}: {
  value: number | string;
  label: string;
  color: string;
  tooltip: string;
  mono?: boolean;
}) {
  void Download; // ensure tree-shaker keeps it referenced for the import sheet later
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
          style={{
            background: `${color}15`,
            color,
            border: `1px solid ${color}40`,
          }}
        >
          <span className={mono ? "font-mono font-semibold tabular-nums" : "font-medium"}>{value}</span>
          <span className="uppercase tracking-wider text-[10px] opacity-90">{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[220px] text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
