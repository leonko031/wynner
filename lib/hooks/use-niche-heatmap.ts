"use client";

import { useMemo } from "react";
import { useProductStore } from "@/lib/store/products";
import { NICHES } from "@/lib/data/niches";
import type { Niche, NicheMetadata } from "@/types";

export type NicheHeatRow = NicheMetadata & {
  count: number;
  avgScoreLive: number; // recalculated from actual products
  topScore: number;
};

export function useNicheHeatmap(): NicheHeatRow[] {
  const products = useProductStore((s) => s.products);

  return useMemo(() => {
    const rows: NicheHeatRow[] = (Object.keys(NICHES) as Niche[]).map(
      (n) => {
        const meta = NICHES[n];
        const items = products.filter((p) => p.category === n);
        const count = items.length;
        const avgScoreLive =
          count > 0
            ? Math.round(
                items.reduce((sum, p) => sum + p.sellScore, 0) / count,
              )
            : meta.avgScore;
        const topScore = items.reduce(
          (max, p) => Math.max(max, p.sellScore),
          0,
        );
        return { ...meta, count, avgScoreLive, topScore };
      },
    );
    return rows.sort((a, b) => b.heat - a.heat);
  }, [products]);
}
