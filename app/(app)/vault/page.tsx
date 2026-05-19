"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useProductStore } from "@/lib/store/products";
import { useProductStatusStore } from "@/lib/store/product-status";
import {
  useCollectionsStore,
  collectionsWithProducts,
} from "@/lib/store/collections";
import {
  DEFAULT_VAULT_FILTERS,
  type ProductStatus,
  type VaultV2Filters,
} from "@/types/vault";
import { filtersFromUrl, filtersToUrl, hasActiveFilters } from "@/lib/vault/url-state";
import { buildSystemCollections } from "@/lib/vault/system-collections";
import type { Product } from "@/types";
import { VaultDataLoader } from "@/components/vault-v2/vault-data-loader";
import { VaultHeader } from "@/components/vault-v2/vault-header";
import {
  SmartSearchBar,
  type SmartSearchResult,
} from "@/components/vault-v2/smart-search-bar";
import { FilterBar } from "@/components/vault-v2/filter-bar";
import { CollectionsRail } from "@/components/vault-v2/collections-rail";
import { ProductGrid } from "@/components/vault-v2/product-grid";
import { BulkActionsBar } from "@/components/vault-v2/bulk-actions-bar";
import { AskWynnerSidebar } from "@/components/vault-v2/ask-wynner-sidebar";
import { VaultEmptyState } from "@/components/vault-v2/vault-empty-state";
import { VaultAdminDiagnostics } from "@/components/vault-v2/admin-diagnostics";
import { ImportProductsSheet } from "@/components/vault-v2/import-products-sheet";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Re-rank a product list based on the filter sort key. */
function sortProducts(list: Product[], sortBy: VaultV2Filters["sortBy"]): Product[] {
  const out = [...list];
  switch (sortBy) {
    case "score-desc":
      out.sort((a, b) => b.sellScore - a.sellScore);
      break;
    case "score-asc":
      out.sort((a, b) => a.sellScore - b.sellScore);
      break;
    case "newest":
      out.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
    case "lastViewed":
      // Best-effort fall-back: we don't track per-product view timestamps yet.
      out.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      break;
    case "margin-desc":
      out.sort(
        (a, b) =>
          b.suggestedPriceUSD - b.costUSD - b.shippingCostUSD -
          (a.suggestedPriceUSD - a.costUSD - a.shippingCostUSD),
      );
      break;
    case "alphabetical":
      out.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "random": {
      const seed = Date.now() & 0xffff;
      out.sort((a, b) => hash(`${seed}|${a.id}`) - hash(`${seed}|${b.id}`));
      break;
    }
  }
  return out;
}

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

/* Wrap in Suspense so useSearchParams works under the App Router. */
export default function VaultPage() {
  return (
    <Suspense fallback={<div className="h-screen" />}>
      <VaultPageInner />
    </Suspense>
  );
}

function VaultPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const products = useProductStore((s) => s.products);
  const favorites = useProductStore((s) => s.favorites);
  const recentlyViewed = useProductStore((s) => s.recentlyViewed);
  const statuses = useProductStatusStore((s) => s.statuses);
  // Pull stable refs from the store and assemble the derived shape in a
  // useMemo. Returning a fresh array from the selector ("snapshot churn")
  // triggers an infinite re-render loop.
  const rawCollections = useCollectionsStore((s) => s.collections);
  const memberships = useCollectionsStore((s) => s.memberships);
  const collections = useMemo(
    () => collectionsWithProducts(rawCollections, memberships),
    [rawCollections, memberships],
  );

  // Snapshot "now" once on mount + refresh every minute. We can't call
  // Date.now() inside useMemo (React 19 strict purity), so we lift it into
  // state with a lazy initializer (allowed) and tick it from useEffect.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  // Hydrate filters from URL on mount, deferred so React 19 strict mode
  // doesn't flag the setState as in-effect-body.
  const [filters, setFilters] = useState<VaultV2Filters>(DEFAULT_VAULT_FILTERS);
  const filtersInitialized = useRef(false);
  useEffect(() => {
    if (filtersInitialized.current) return;
    filtersInitialized.current = true;
    const t = window.setTimeout(() => {
      setFilters(filtersFromUrl(new URLSearchParams(searchParams.toString())));
    }, 0);
    return () => window.clearTimeout(t);
  }, [searchParams]);

  // Push filter changes back to the URL.
  const updateFilters = useCallback(
    (patch: Partial<VaultV2Filters>) => {
      setFilters((cur) => {
        const next: VaultV2Filters = { ...cur, ...patch };
        const params = filtersToUrl(next);
        const qs = params.toString();
        router.replace(qs ? `/vault?${qs}` : "/vault", { scroll: false });
        return next;
      });
    },
    [router],
  );

  // Semantic-search result (overrides ordering when set).
  const [semantic, setSemantic] = useState<SmartSearchResult | null>(null);

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect = useCallback((id: string) => {
    setSelectMode(true);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  // Import sheet state
  const [importOpen, setImportOpen] = useState(false);

  /* ---------------------- Filtering pipeline ----------------------------- */

  const visible = useMemo(() => {
    // 1. Restrict to selected collection (system OR user/smart).
    let pool = products;
    if (filters.collectionId) {
      const system = buildSystemCollections(products, favorites, recentlyViewed);
      const sysCol = system.find((c) => c.id === filters.collectionId);
      if (sysCol) {
        const set = new Set(sysCol.productIds);
        pool = pool.filter((p) => set.has(p.id));
      } else {
        const col = collections.find((c) => c.id === filters.collectionId);
        if (col) {
          const set = new Set(col.productIds);
          pool = pool.filter((p) => set.has(p.id));
        }
      }
    }

    // 2. Text search (local) — skipped in semantic mode.
    const q = filters.search.trim().toLowerCase();
    if (q && !semantic) {
      pool = pool.filter((p) => {
        const hay = `${p.name} ${p.description} ${p.category} ${p.targetCountry}`.toLowerCase();
        return hay.includes(q);
      });
    }

    // 3. Verdicts
    if (filters.verdicts.length > 0) {
      pool = pool.filter((p) => filters.verdicts.includes(p.verdict));
    }

    // 4. Score range
    pool = pool.filter(
      (p) => p.sellScore >= filters.scoreRange[0] && p.sellScore <= filters.scoreRange[1],
    );

    // 5. Countries
    if (filters.countries.length > 0) {
      pool = pool.filter((p) => filters.countries.includes(p.targetCountry));
    }

    // 6. Niches
    if (filters.niches.length > 0) {
      pool = pool.filter((p) => filters.niches.includes(p.category));
    }

    // 7. Statuses (default "active" if unset).
    if (filters.statuses.length > 0) {
      pool = pool.filter((p) => {
        const s = (statuses[p.id] ?? "active") as ProductStatus;
        return filters.statuses.includes(s);
      });
    }

    // 8. Date range — use the `now` snapshot from state (React 19 purity).
    const nowDate = new Date(now);
    const monthStartMs = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).getTime();
    const weekStartMs = new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate() - nowDate.getDay(),
    ).getTime();
    if (filters.dateRange !== "all") {
      pool = pool.filter((p) => {
        const t = new Date(p.createdAt).getTime();
        if (filters.dateRange === "recent") return now - t < 7 * DAY_MS;
        if (filters.dateRange === "week") return t >= weekStartMs;
        if (filters.dateRange === "month") return t >= monthStartMs;
        return true;
      });
    }

    // 9. Favorites
    if (filters.favoritesOnly) pool = pool.filter((p) => favorites.has(p.id));

    // 10. Semantic ordering takes priority over sort.
    if (semantic) {
      const ranks = semantic.ranks;
      const filtered = pool.filter((p) => ranks.has(p.id));
      return filtered.sort(
        (a, b) => (ranks.get(b.id) ?? 0) - (ranks.get(a.id) ?? 0),
      );
    }

    return sortProducts(pool, filters.sortBy);
  }, [
    products,
    filters,
    favorites,
    recentlyViewed,
    collections,
    statuses,
    semantic,
    now,
  ]);

  /* ---------------------- Keyboard shortcuts ----------------------------- */

  useEffect(() => {
    function isTypingTarget(t: EventTarget | null): boolean {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return true;
      return t.isContentEditable;
    }
    function handler(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        if (selectMode) {
          e.preventDefault();
          clearSelection();
          return;
        }
        if (hasActiveFilters(filters) || semantic) {
          e.preventDefault();
          updateFilters(DEFAULT_VAULT_FILTERS);
          setSemantic(null);
          return;
        }
        return;
      }
      if (isTypingTarget(e.target)) return;

      const lower = e.key.toLowerCase();
      if (lower === "g") {
        e.preventDefault();
        updateFilters({ view: "grid" });
      } else if (lower === "l") {
        e.preventDefault();
        updateFilters({ view: "list" });
      } else if (lower === "y") {
        e.preventDefault();
        updateFilters({ view: "gallery" });
      } else if (lower === "n") {
        // Click "New collection" via aria-label.
        const btn = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
          (b) => b.textContent?.trim() === "New collection",
        );
        if (btn) {
          e.preventDefault();
          btn.click();
        }
      } else if (e.key === "/") {
        const search = document.querySelector<HTMLInputElement>(
          'input[aria-label="Search vault"]',
        );
        if (search) {
          e.preventDefault();
          search.focus();
        }
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filters, selectMode, semantic, clearSelection, updateFilters]);

  // First-visit-this-session welcome toast.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.sessionStorage.getItem("wynner.vault.welcomed");
    if (seen) return;
    window.sessionStorage.setItem("wynner.vault.welcomed", "1");
    const t = window.setTimeout(() => {
      toast("Your vault, your way", {
        description: "Try G/L/Y for views, / to search, N for a new collection.",
      });
    }, 1200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <VaultDataLoader />

      <motion.main
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8 pb-24 md:py-10"
      >
        <VaultHeader
          onSmartSort={() => {
            // Auto-organize lives inside CollectionsRail — click its button.
            const btn = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
              (b) => /Auto-organize/i.test(b.textContent ?? ""),
            );
            btn?.click();
          }}
          onImport={() => setImportOpen(true)}
        />

        <VaultAdminDiagnostics />

        <SmartSearchBar
          query={filters.search}
          onQueryChange={(q) => {
            setSemantic(null); // text changes drop any semantic results
            updateFilters({ search: q });
          }}
          onSemanticResult={setSemantic}
        />

        {semantic?.interpretation && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-aurora-purple/35 bg-aurora-purple/10 px-4 py-2.5 text-sm text-text"
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-aurora-purple">
              Wynner says
            </span>
            <p className="mt-0.5 leading-snug text-text-muted">{semantic.interpretation}</p>
          </motion.div>
        )}

        <CollectionsRail
          selectedCollectionId={filters.collectionId}
          onSelect={(id) => updateFilters({ collectionId: id })}
        />

        <FilterBar
          filters={filters}
          onChange={updateFilters}
          visibleCount={visible.length}
          totalCount={products.length}
        />

        {products.length === 0 ? (
          <VaultEmptyState kind="vault" />
        ) : visible.length === 0 ? (
          hasActiveFilters(filters) || filters.search ? (
            <VaultEmptyState
              kind="no-results"
              onClear={() => {
                updateFilters(DEFAULT_VAULT_FILTERS);
                setSemantic(null);
              }}
            />
          ) : filters.collectionId ? (
            <VaultEmptyState
              kind="empty-collection"
              collectionName={
                collections.find((c) => c.id === filters.collectionId)?.name ??
                "This collection"
              }
            />
          ) : null
        ) : (
          <ProductGrid
            products={visible}
            view={filters.view}
            density={filters.density}
            selectMode={selectMode}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            reasons={semantic?.reasons}
          />
        )}
      </motion.main>

      <BulkActionsBar selectedIds={[...selectedIds]} onClear={clearSelection} />
      <AskWynnerSidebar />
      <ImportProductsSheet open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
