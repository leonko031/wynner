"use client";

import { useEffect } from "react";
import { useProductStore } from "@/lib/store/products";

export function StoreHydration() {
  useEffect(() => {
    useProductStore.getState().hydrate();
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[wynner] hydrated:",
        useProductStore.getState().products.length,
        "products",
      );
    }
  }, []);

  return null;
}
