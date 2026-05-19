"use client";

import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import type {
  FilterCriteria,
  Niche,
  Product,
  SortKey,
} from "@/types";
import { verdictFromScore } from "@/types";
import { SEED_PRODUCTS } from "@/lib/data/seed";

type ProductState = {
  products: Product[];
  favorites: Set<string>;
  recentlyViewed: string[];

  hydrate: (initial?: Product[]) => void;
  addProduct: (p: Product) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  toggleFavorite: (id: string) => void;
  markViewed: (id: string) => void;

  getById: (id: string) => Product | undefined;
  getTopByScore: (n: number) => Product[];
  getByNiche: (niche: Niche) => Product[];
  getByCountry: (country: string) => Product[];
  filterAndSort: (criteria: FilterCriteria) => Product[];
};

const RECENT_LIMIT = 12;

function applyFilter(
  products: Product[],
  favorites: Set<string>,
  criteria: FilterCriteria,
): Product[] {
  const {
    niche,
    verdict,
    country,
    search,
    sortBy = "score",
    favoritesOnly,
  } = criteria;

  let out = products;
  if (niche) out = out.filter((p) => p.category === niche);
  if (verdict) out = out.filter((p) => p.verdict === verdict);
  if (country) out = out.filter((p) => p.targetCountry === country);
  if (favoritesOnly) out = out.filter((p) => favorites.has(p.id));
  if (search) {
    const q = search.toLowerCase();
    out = out.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }

  const sorted = [...out];
  switch (sortBy) {
    case "newest":
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
    case "margin":
      sorted.sort(
        (a, b) =>
          b.suggestedPriceUSD - b.costUSD - (a.suggestedPriceUSD - a.costUSD),
      );
      break;
    case "demand":
      sorted.sort((a, b) => b.pillars.demand - a.pillars.demand);
      break;
    case "score":
    default:
      sorted.sort((a, b) => b.sellScore - a.sellScore);
      break;
  }
  return sorted;
}

// Custom storage that serializes Set<string> as an array.
type PersistedShape = {
  products: Product[];
  favorites: string[];
  recentlyViewed: string[];
};

const persistStorage: PersistStorage<PersistedShape> = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(name);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StorageValue<PersistedShape>;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
  },
};

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      favorites: new Set<string>(),
      recentlyViewed: [],

      hydrate: (initial = SEED_PRODUCTS) => {
        if (get().products.length === 0) {
          set({ products: initial });
        }
      },

      addProduct: (p) =>
        set((s) => ({ products: [p, ...s.products] })),

      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) => {
            if (p.id !== id) return p;
            const merged: Product = {
              ...p,
              ...patch,
              updatedAt: new Date().toISOString(),
            };
            if (patch.sellScore !== undefined) {
              merged.verdict = verdictFromScore(patch.sellScore);
            }
            return merged;
          }),
        })),

      removeProduct: (id) =>
        set((s) => {
          const favorites = new Set(s.favorites);
          favorites.delete(id);
          return {
            products: s.products.filter((p) => p.id !== id),
            favorites,
            recentlyViewed: s.recentlyViewed.filter((rid) => rid !== id),
          };
        }),

      toggleFavorite: (id) =>
        set((s) => {
          const favorites = new Set(s.favorites);
          if (favorites.has(id)) favorites.delete(id);
          else favorites.add(id);
          return {
            favorites,
            products: s.products.map((p) =>
              p.id === id ? { ...p, isFavorite: favorites.has(id) } : p,
            ),
          };
        }),

      markViewed: (id) =>
        set((s) => {
          const next = [id, ...s.recentlyViewed.filter((rid) => rid !== id)];
          return { recentlyViewed: next.slice(0, RECENT_LIMIT) };
        }),

      getById: (id) => get().products.find((p) => p.id === id),

      getTopByScore: (n) =>
        [...get().products]
          .sort((a, b) => b.sellScore - a.sellScore)
          .slice(0, n),

      getByNiche: (niche) =>
        get().products.filter((p) => p.category === niche),

      getByCountry: (country) =>
        get().products.filter((p) => p.targetCountry === country),

      filterAndSort: (criteria) =>
        applyFilter(get().products, get().favorites, criteria),
    }),
    {
      name: "wynner.products.v1",
      storage: persistStorage,
      partialize: (state) =>
        ({
          products: state.products,
          favorites: Array.from(state.favorites),
          recentlyViewed: state.recentlyViewed,
        }) satisfies PersistedShape,
      merge: (persistedUnknown, currentState) => {
        const persisted = (persistedUnknown ?? {}) as Partial<PersistedShape>;
        return {
          ...currentState,
          products: persisted.products ?? currentState.products,
          favorites: new Set(persisted.favorites ?? []),
          recentlyViewed:
            persisted.recentlyViewed ?? currentState.recentlyViewed,
        };
      },
    },
  ),
);

export type { SortKey };
