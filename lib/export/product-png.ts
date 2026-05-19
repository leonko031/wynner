"use client";

import { toPng } from "html-to-image";
import type { Product } from "@/types";

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function exportNodeAsPng(
  node: HTMLElement,
  filename: string,
): Promise<void> {
  // pixelRatio=2 → crisp on retina + decent for social previews.
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#0A0A0B",
    // Allow cross-origin images (Unsplash) to be rasterized.
    fetchRequestInit: { mode: "cors" },
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function exportProductPng(
  node: HTMLElement,
  product: Product,
): Promise<void> {
  await exportNodeAsPng(node, `wynner-${slug(product.name)}.png`);
}
