"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ImageOff } from "lucide-react";
import { Sparkline } from "@/components/animated/sparkline";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { Niche } from "@/types";

export const SCAN_PREVIEW_LAYOUT_ID = "scan-preview-image";

export type Draft = {
  name: string;
  description: string;
  image: string;
  category: Niche | "";
  costUSD: number;
  suggestedPriceUSD: number;
  shippingCostUSD: number;
  source: string;
  sourceUrl: string;
  targetCountry?: string;
};

const PLACEHOLDER_TREND = [
  10, 12, 11, 14, 16, 15, 18, 20, 19, 22, 21, 24, 26, 25, 28,
];

export function LivePreviewCard({ draft }: { draft: Draft }) {
  const niche = draft.category ? NICHES[draft.category] : null;
  const country = draft.targetCountry ? COUNTRIES[draft.targetCountry] : null;
  const markup =
    draft.costUSD + draft.shippingCostUSD > 0
      ? draft.suggestedPriceUSD / (draft.costUSD + draft.shippingCostUSD)
      : 0;

  return (
    <div className="sticky top-32 rounded-2xl border border-border-soft bg-surface p-5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
        Live preview
      </div>

      <div className="mt-4 flex items-start gap-4">
        <motion.div
          layoutId={draft.image ? SCAN_PREVIEW_LAYOUT_ID : undefined}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border-soft bg-surface-elevated"
        >
          {draft.image ? (
            <Image
              src={draft.image}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-dim">
              <ImageOff className="h-5 w-5" />
            </div>
          )}
        </motion.div>
        <div className="ml-auto flex h-16 w-16 items-center justify-center rounded-full border border-border-soft bg-surface-elevated">
          <span className="font-mono text-2xl text-text-dim">—</span>
        </div>
        <button
          type="button"
          aria-label="Favorite (preview)"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-border-soft bg-surface/80 text-text-dim"
        >
          <Heart className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="line-clamp-2 text-base font-medium leading-snug tracking-tight">
          {draft.name || "Untitled product"}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {niche ? (
            <span
              className="inline-flex items-center rounded-full px-1.5 py-0.5"
              style={{
                backgroundColor: `${niche.color}1A`,
                color: niche.color,
                border: `1px solid ${niche.color}33`,
              }}
            >
              {niche.label}
            </span>
          ) : (
            <span className="rounded-full border border-border-soft px-1.5 py-0.5 text-text-dim">
              No category
            </span>
          )}
          {country ? (
            <span className="flex items-center gap-1 text-text-muted">
              <span aria-hidden>{country.flag}</span>
              {country.code}
            </span>
          ) : (
            <span className="text-text-dim">No country</span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Mini label="Cost" value={draft.costUSD > 0 ? `$${draft.costUSD.toFixed(2)}` : "—"} />
        <Mini
          label="Price"
          value={
            draft.suggestedPriceUSD > 0
              ? `$${draft.suggestedPriceUSD.toFixed(2)}`
              : "—"
          }
        />
        <Mini label="Markup" value={markup > 0 ? `${markup.toFixed(1)}×` : "—"} />
      </div>

      <div className="mt-4 -mx-1">
        <Sparkline data={PLACEHOLDER_TREND} color="#9CA3AF" height={32} />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          30-day demand (preview)
        </span>
        <span className="inline-flex items-center rounded-full border border-border-soft px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-dim">
          Unscored
        </span>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-soft bg-surface/60 px-2 py-1.5 text-left">
      <div className="font-mono text-[9px] uppercase tracking-wider text-text-dim">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-xs tabular-nums text-text">
        {value}
      </div>
    </div>
  );
}
