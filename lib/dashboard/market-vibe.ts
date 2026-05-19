/**
 * Naive market-vibe computation. Buckets the average sell-score of the
 * platform's top scoring products into one of four moods. Polled every 60s
 * from the dashboard; in dev all data is local so the polling is cosmetic.
 */
import type { Product } from "@/types";

export type MarketVibe = "hot" | "active" | "steady" | "quiet";

export const VIBE_META: Record<
  MarketVibe,
  { label: string; emoji: string; color: string; tooltip: string }
> = {
  hot: {
    label: "hot",
    emoji: "🔥",
    color: "#FF7E5F",
    tooltip:
      "The average sell-score of recent top products is ≥ 78. Buyers are leaning in across multiple niches today.",
  },
  active: {
    label: "active",
    emoji: "⚡",
    color: "#FFAB40",
    tooltip:
      "Average sell-score of top recent products is 70-77. A few solid winners surfaced; momentum is real but uneven.",
  },
  steady: {
    label: "steady",
    emoji: "🌤️",
    color: "#5B8DFF",
    tooltip:
      "Average sell-score of top recent products is 60-69. Quiet trading day. Good time for deliberate, narrow scans.",
  },
  quiet: {
    label: "quiet",
    emoji: "💤",
    color: "#9DA0BF",
    tooltip:
      "Average sell-score of top recent products is below 60. Most categories are off-cycle right now. Wait for movement or pick something cyclical.",
  },
};

export function computeMarketVibe(products: Product[]): MarketVibe {
  if (products.length === 0) return "steady";
  const sorted = [...products].sort((a, b) => b.sellScore - a.sellScore).slice(0, 50);
  const avg = sorted.reduce((s, p) => s + p.sellScore, 0) / sorted.length;
  if (avg >= 78) return "hot";
  if (avg >= 70) return "active";
  if (avg >= 60) return "steady";
  return "quiet";
}
