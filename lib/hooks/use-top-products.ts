"use client";

import { useMemo } from "react";
import { useProductStore } from "@/lib/store/products";
import type { Product } from "@/types";

export function useTopProducts(n: number): Product[] {
  const products = useProductStore((s) => s.products);
  return useMemo(
    () =>
      [...products].sort((a, b) => b.sellScore - a.sellScore).slice(0, n),
    [products, n],
  );
}
