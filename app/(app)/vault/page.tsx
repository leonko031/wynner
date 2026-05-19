"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/dashboard/product-card";
import { ProductRow } from "@/components/vault/product-row";
import {
  DEFAULT_FILTERS,
  FilterBar,
  type FilterBarHandle,
  type VaultFilters,
} from "@/components/vault/filter-bar";
import { ActiveFilterChips } from "@/components/vault/active-filter-chips";
import { VaultEmptyState } from "@/components/vault/empty-state";
import { useProductStore } from "@/lib/store/products";
import { usePreferences } from "@/lib/store/preferences";
import {
  NICHE_KEYS,
  VERDICTS,
  type Niche,
  type Product,
  type Verdict,
} from "@/types";

const PAGE_SIZE = 24;

function sortProducts(list: Product[], sortBy: VaultFilters["sortBy"]): Product[] {
  const out = [...list];
  switch (sortBy) {
    case "newest":
      out.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
    case "margin":
      out.sort(
        (a, b) =>
          b.suggestedPriceUSD -
          b.costUSD -
          (a.suggestedPriceUSD - a.costUSD),
      );
      break;
    case "demand":
      out.sort((a, b) => b.pillars.demand - a.pillars.demand);
      break;
    case "score":
    default:
      out.sort((a, b) => b.sellScore - a.sellScore);
  }
  return out;
}

export default function VaultPage() {
  const products = useProductStore((s) => s.products);
  const favorites = useProductStore((s) => s.favorites);
  const layout = usePreferences((s) => s.vaultLayout);
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<VaultFilters>(DEFAULT_FILTERS);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const filterRef = useRef<FilterBarHandle | null>(null);

  // Apply URL params from command palette deep-links (verdict, niche, favoritesOnly).
  useEffect(() => {
    const t = window.setTimeout(() => {
      const verdictParam = searchParams.get("verdict");
      const nicheParam = searchParams.get("niche");
      const favOnly = searchParams.get("favoritesOnly") === "1";
      const patch: Partial<VaultFilters> = {};
      if (verdictParam && (VERDICTS as readonly string[]).includes(verdictParam)) {
        patch.verdict = verdictParam as Verdict;
      }
      if (nicheParam && (NICHE_KEYS as readonly string[]).includes(nicheParam)) {
        patch.niches = [nicheParam as Niche];
      }
      if (Object.keys(patch).length > 0) {
        setFilters((f) => ({ ...f, ...patch }));
      }
      setFavoritesOnly(favOnly);
    }, 0);
    return () => window.clearTimeout(t);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    let out = products.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (p.sellScore < filters.scoreRange[0] || p.sellScore > filters.scoreRange[1])
        return false;
      if (
        filters.countries.length > 0 &&
        !filters.countries.includes(p.targetCountry)
      )
        return false;
      if (filters.niches.length > 0 && !filters.niches.includes(p.category))
        return false;
      if (filters.verdict !== "all" && p.verdict !== filters.verdict) return false;
      if (favoritesOnly && !favorites.has(p.id)) return false;
      return true;
    });
    if (filters.sortBy === "newest") {
      // newest also surfaces favorites first for ergonomic vault use
      out = out.sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite));
    }
    return sortProducts(out, filters.sortBy);
  }, [products, filters, favoritesOnly, favorites]);

  const visible = filtered.slice(0, pageCount * PAGE_SIZE);
  const hasMore = filtered.length > visible.length;

  function update(next: VaultFilters) {
    setFilters(next);
    setPageCount(1);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
            Vault
          </h1>
          <p className="mt-1 text-sm text-text-muted">Your saved products</p>
        </div>
        <span className="inline-flex h-7 items-center rounded-full border border-border-soft bg-surface px-3 font-mono text-xs tabular-nums text-text-muted">
          {filtered.length} / {products.length} products
        </span>
      </header>

      <FilterBar ref={filterRef} value={filters} onChange={update} />
      <ActiveFilterChips value={filters} onChange={update} />

      {visible.length === 0 ? (
        <VaultEmptyState onClear={() => update(DEFAULT_FILTERS)} />
      ) : (
        <motion.div
          layout
          className={
            layout === "grid"
              ? "mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "mt-8 flex flex-col gap-2"
          }
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {layout === "grid"
              ? visible.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ProductCard product={p} index={i} />
                  </motion.div>
                ))
              : visible.map((p, i) => (
                  <ProductRow key={p.id} product={p} index={i} />
                ))}
          </AnimatePresence>
        </motion.div>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            className="rounded-full border-border-soft bg-surface/60"
            onClick={() => setPageCount((c) => c + 1)}
          >
            Load {Math.min(PAGE_SIZE, filtered.length - visible.length)} more
          </Button>
        </div>
      )}
    </main>
  );
}
