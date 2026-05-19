"use client";

import { useMemo } from "react";
import { useProductStore } from "@/lib/store/products";
import { COUNTRIES, COUNTRY_CODES } from "@/lib/data/countries";
import type { Country, Product } from "@/types";

export type CountryStatRow = {
  country: Country;
  count: number;
  avgScore: number;
  topProduct?: Product;
};

export function useCountryStats(): CountryStatRow[] {
  const products = useProductStore((s) => s.products);

  return useMemo(() => {
    const rows: CountryStatRow[] = COUNTRY_CODES.map((code) => {
      const items = products.filter((p) => p.targetCountry === code);
      const count = items.length;
      const avgScore =
        count > 0
          ? Math.round(items.reduce((s, p) => s + p.sellScore, 0) / count)
          : 0;
      const topProduct = items
        .slice()
        .sort((a, b) => b.sellScore - a.sellScore)[0];
      return { country: COUNTRIES[code], count, avgScore, topProduct };
    });
    return rows.sort((a, b) => b.count - a.count);
  }, [products]);
}
