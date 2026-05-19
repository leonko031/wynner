"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { ScoreRing } from "@/components/animated/score-ring";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { Product, Verdict } from "@/types";
import { cn } from "@/lib/utils";

const VERDICT_META: Record<Verdict, { label: string; color: string }> = {
  go: { label: "GO LIVE", color: "#00D26A" },
  test: { label: "TEST IT", color: "#F5A623" },
  risky: { label: "RISKY", color: "#F97316" },
  skip: { label: "SKIP", color: "#EF4444" },
};

type EmptyProps = {
  index: number;
  onAdd: () => void;
  onDrop: (productId: string) => void;
};

export function EmptySlot({ index, onAdd, onDrop }: EmptyProps) {
  return (
    <div
      onClick={onAdd}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("application/x-wynner-product-id")) {
          e.preventDefault();
        }
      }}
      onDrop={(e) => {
        const pid = e.dataTransfer.getData("application/x-wynner-product-id");
        if (pid) {
          e.preventDefault();
          onDrop(pid);
        }
      }}
      className="group glass-flat flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border-strong p-6 text-text-dim transition-all hover:-translate-y-1 hover:border-aurora-blue/40 hover:text-text"
      role="button"
      aria-label={`Add product to slot ${index + 1}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border-soft bg-surface">
        <Plus className="h-5 w-5" />
      </div>
      <div className="mt-3 text-sm">Slot {index + 1}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wider">Click or drop a product</div>
    </div>
  );
}

type FilledProps = {
  product: Product;
  highlighted?: boolean;
  onRemove: () => void;
};

export function FilledSlot({ product, highlighted, onRemove }: FilledProps) {
  const verdict = VERDICT_META[product.verdict];
  const niche = NICHES[product.category];
  const country = COUNTRIES[product.targetCountry];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: highlighted === false ? 0.55 : 1,
        y: 0,
      }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass relative flex flex-col gap-3 rounded-3xl p-4 transition-all",
        highlighted && "halo-go ring-2 ring-go/50",
      )}
    >
      <button
        type="button"
        aria-label="Remove from comparison"
        onClick={onRemove}
        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border-soft bg-surface/80 text-text-muted hover:text-text"
      >
        <X className="h-3 w-3" />
      </button>
      <div className="relative aspect-square overflow-hidden rounded-xl border border-border-soft bg-surface-elevated">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <ScoreRing value={product.sellScore} size={64} strokeWidth={5} />
        <div className="min-w-0 flex-1 text-right">
          <h3 className="truncate text-sm font-medium text-text">{product.name}</h3>
          <div className="mt-1 flex items-center justify-end gap-1.5 text-[11px]">
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
            <span className="text-text-muted">
              {country?.flag} {country?.code}
            </span>
          </div>
        </div>
      </div>
      <span
        className="self-start inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider"
        style={{
          backgroundColor: `${verdict.color}26`,
          color: verdict.color,
          border: `1px solid ${verdict.color}40`,
        }}
      >
        {verdict.label}
      </span>
    </motion.div>
  );
}
