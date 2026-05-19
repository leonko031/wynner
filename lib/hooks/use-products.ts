"use client";

import { useMemo } from "react";
import { useProductStore } from "@/lib/store/products";
import type { FilterCriteria, Product } from "@/types";

export function useProducts(criteria: FilterCriteria = {}): Product[] {
  const products = useProductStore((s) => s.products);
  const favorites = useProductStore((s) => s.favorites);

  return useMemo(() => {
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
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );
        break;
      case "margin":
        sorted.sort(
          (a, b) =>
            b.suggestedPriceUSD -
            b.costUSD -
            (a.suggestedPriceUSD - a.costUSD),
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
  }, [products, favorites, criteria]);
}
