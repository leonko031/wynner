"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProductStore } from "@/lib/store/products";
import { ScoreRing } from "@/components/animated/score-ring";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

type Tab = "recent" | "favorites" | "all";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excludeIds: string[];
  onPick: (productId: string) => void;
  slotIndex: number;
};

/**
 * Product picker shown when the user clicks an empty slot. Tabs across
 * Recent / Favorites / All — search input filters the active tab.
 *
 * Note: the spec's "Smart suggestions" tab (Gemini-powered, costs ✦ 1) is
 * deferred — adding products manually is genuinely fast enough that the
 * picker doesn't need an AI tab in v1.
 */
export function ProductPicker({ open, onOpenChange, excludeIds, onPick, slotIndex }: Props) {
  const products = useProductStore((s) => s.products);
  const favorites = useProductStore((s) => s.favorites);
  const recentlyViewed = useProductStore((s) => s.recentlyViewed);

  const [tab, setTab] = useState<Tab>("recent");
  const [query, setQuery] = useState("");

  const pool = useMemo(() => {
    const exclude = new Set(excludeIds);
    let base: Product[] = [];
    if (tab === "recent") {
      // Re-order products array by recentlyViewed (most recent first), then
      // fall through to vault-newest for products never viewed.
      const recentSet = new Set(recentlyViewed);
      const recent = recentlyViewed
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p));
      const restNew = [...products]
        .filter((p) => !recentSet.has(p.id))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      base = [...recent, ...restNew];
    } else if (tab === "favorites") {
      base = products.filter((p) => favorites.has(p.id));
    } else {
      base = [...products].sort((a, b) => b.sellScore - a.sellScore);
    }
    base = base.filter((p) => !exclude.has(p.id));
    const q = query.trim().toLowerCase();
    if (q) {
      base = base.filter((p) =>
        `${p.name} ${p.description} ${p.category} ${p.targetCountry}`
          .toLowerCase()
          .includes(q),
      );
    }
    return base.slice(0, 60);
  }, [tab, query, products, favorites, recentlyViewed, excludeIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-3xl rounded-3xl border-0 p-0">
        {/* Header */}
        <div className="border-b border-border-soft px-5 py-4">
          <DialogTitle className="font-serif text-xl text-text">
            Pick a product for slot {slotIndex + 1}
          </DialogTitle>
          <p className="mt-1 text-xs text-text-muted">
            Choose any product in your vault. The comparison updates instantly.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-dim" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, niche, country…"
                className="h-9 rounded-full pl-9 text-sm"
                autoFocus
              />
            </div>
            <div className="flex items-center rounded-full border border-border-soft bg-surface/70 p-0.5">
              {(["recent", "favorites", "all"] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs transition-colors",
                    tab === t
                      ? "bg-aurora-purple/15 text-text"
                      : "text-text-muted hover:text-text",
                  )}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {pool.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="font-serif text-base text-text">No matches</div>
              <p className="text-xs text-text-muted">
                Try a different search, or switch tab.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pool.map((p) => (
                <PickerCard key={p.id} product={p} onPick={() => onPick(p.id)} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PickerCard({ product, onPick }: { product: Product; onPick: () => void }) {
  const niche = NICHES[product.category];
  const country = COUNTRIES[product.targetCountry];
  return (
    <motion.button
      type="button"
      onClick={onPick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="group glass flex items-center gap-3 rounded-2xl p-3 text-left transition-all hover:border-aurora-purple/45"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border-soft bg-surface-elevated">
        <Image src={product.image} alt="" fill sizes="56px" className="object-cover" unoptimized />
      </div>
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
        </div>
      </div>
      <ScoreRing value={product.sellScore} size={36} strokeWidth={3} />
      <X className="invisible" />
    </motion.button>
  );
}
