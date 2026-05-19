/**
 * Built-in "system" collections — always present, computed live from the
 * user's local product store. They never get persisted to Supabase; we
 * synthesize them at render time so they reflect the latest state of the
 * vault without database round-trips.
 */
import type { Product } from "@/types";
import type { CollectionColor } from "@/types/vault";

export type SystemCollection = {
  id: string; // e.g. "sys:all"
  name: string;
  description: string;
  color: CollectionColor;
  productIds: string[];
  /** Optional emoji/icon hint (rendered alongside the name). */
  emoji?: string;
};

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function buildSystemCollections(
  products: Product[],
  favorites: Set<string>,
  recentlyViewed: string[],
): SystemCollection[] {
  const now = Date.now();
  const goVerdicts = products.filter((p) => p.verdict === "go");
  const recents = products
    .filter((p) => now - new Date(p.createdAt).getTime() < SEVEN_DAYS)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  // "Needs attention" = scanned products that have never been viewed (no id
  // in recentlyViewed). Best-effort: assumes recentlyViewed is the source.
  const viewed = new Set(recentlyViewed);
  const needsAttention = products.filter((p) => !viewed.has(p.id));

  return [
    {
      id: "sys:all",
      name: "All products",
      description: "Every product in your vault.",
      color: "aurora_blue",
      productIds: products.map((p) => p.id),
      emoji: "🗂️",
    },
    {
      id: "sys:favorites",
      name: "Favorites",
      description: "Products you've starred.",
      color: "aurora_pink",
      productIds: products.filter((p) => favorites.has(p.id)).map((p) => p.id),
      emoji: "♥",
    },
    {
      id: "sys:go",
      name: "GO verdicts only",
      description: "Sell-score ≥ 80 — your AI-picked winners.",
      color: "aurora_mint",
      productIds: goVerdicts.map((p) => p.id),
      emoji: "✅",
    },
    {
      id: "sys:recent",
      name: "Recently added",
      description: "Last 7 days of new scans.",
      color: "aurora_purple",
      productIds: recents.map((p) => p.id),
      emoji: "🆕",
    },
    {
      id: "sys:attention",
      name: "Needs attention",
      description: "Scanned but never opened — worth a second look.",
      color: "aurora_peach",
      productIds: needsAttention.map((p) => p.id),
      emoji: "👀",
    },
  ];
}
