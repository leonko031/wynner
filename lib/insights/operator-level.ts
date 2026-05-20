/**
 * Operator level — turns a user's scan history into a 0-100 sophistication
 * score + tier. Pure client-side: takes the local product store and the
 * Supabase product_status map, returns a stable number.
 *
 * Composite of six components (each weighted, all clamped 0..1 internally):
 *   volume         (25%)  — scans in last 30 days
 *   diversity      (15%)  — distinct niches + countries
 *   sophistication (15%)  — % of "deep" scans (proxy: products w/ customerVoice)
 *   action         (20%)  — % marked Testing/Won in vault
 *   recency        (15%)  — scans this week vs last
 *   engagement     (10%)  — comparisons run + favorites kept
 */

import {
  tierFromLevel,
  type OperatorLevelBreakdown,
} from "@/types/insights";
import type { Product } from "@/types";
import type { ProductStatus } from "@/types/vault";

export type OperatorLevelInputs = {
  products: Product[];
  statuses: Record<string, ProductStatus>;
  favorites?: Set<string> | string[];
  comparisonsCount?: number;
};

const MS_DAY = 24 * 60 * 60 * 1000;

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function daysAgoMs(n: number): number {
  return Date.now() - n * MS_DAY;
}

export function computeOperatorLevel({
  products,
  statuses,
  favorites,
  comparisonsCount = 0,
}: OperatorLevelInputs): OperatorLevelBreakdown {
  const now = Date.now();
  const since30 = daysAgoMs(30);
  const since7 = daysAgoMs(7);
  const since14 = daysAgoMs(14);

  // --- Volume — scans in last 30 days. 1.0 at 25+ scans. ---
  const scans30 = products.filter(
    (p) => new Date(p.createdAt).getTime() >= since30,
  );
  const volume = clamp01(scans30.length / 25);

  // --- Diversity — distinct niches + countries scanned all time. 1.0 at 8+ combined. ---
  const niches = new Set(products.map((p) => p.category));
  const countries = new Set(products.map((p) => p.targetCountry));
  const diversity = clamp01((niches.size + countries.size) / 8);

  // --- Sophistication — % of deep scans (proxy: has customerVoice). ---
  const deep = products.filter((p) => Boolean(p.customerVoice)).length;
  const sophistication = products.length === 0 ? 0 : clamp01(deep / products.length);

  // --- Action — % of all scans marked Testing/Won. 1.0 at 30%. ---
  const actionable = products.filter((p) => {
    const s = statuses[p.id];
    return s === "testing" || s === "won";
  }).length;
  const action = products.length === 0 ? 0 : clamp01(actionable / products.length / 0.3);

  // --- Recency — scans this week vs prior. ---
  // 1.0 if this week >= prior week; scaled if declining.
  const thisWeek = products.filter(
    (p) => new Date(p.createdAt).getTime() >= since7,
  ).length;
  const priorWeek = products.filter((p) => {
    const t = new Date(p.createdAt).getTime();
    return t >= since14 && t < since7;
  }).length;
  let recency: number;
  if (thisWeek === 0 && priorWeek === 0) {
    recency = 0;
  } else if (priorWeek === 0) {
    recency = 1;
  } else {
    recency = clamp01(thisWeek / priorWeek);
  }

  // --- Engagement — comparisons run + favorites kept. 1.0 at 8 combined. ---
  const favCount =
    favorites instanceof Set
      ? favorites.size
      : Array.isArray(favorites)
        ? favorites.length
        : 0;
  const engagement = clamp01((comparisonsCount + favCount) / 8);

  // Composite — weighted sum × 100.
  const composite =
    volume * 0.25 +
    diversity * 0.15 +
    sophistication * 0.15 +
    action * 0.2 +
    recency * 0.15 +
    engagement * 0.1;
  const level = Math.round(composite * 100);

  // --- Delta vs last week: recompute volume + action with shifted windows. ---
  const lastWeekCutoff = now - 14 * MS_DAY;
  const lastWeekStart = now - 21 * MS_DAY;
  const lastWeekProducts = products.filter((p) => {
    const t = new Date(p.createdAt).getTime();
    return t >= lastWeekStart && t < lastWeekCutoff;
  });
  const lastWeekVolume = clamp01(lastWeekProducts.length / 25);
  // Recompute composite using only the comparable components (volume + recency)
  // as a quick differential; the AI-cached components don't shift weekly.
  const priorComposite =
    lastWeekVolume * 0.25 +
    diversity * 0.15 +
    sophistication * 0.15 +
    action * 0.2 +
    // For prior week, "recency" is what was current then; rough proxy: 1.0
    0.15 * (priorWeek > 0 ? 1 : 0.4) +
    engagement * 0.1;
  const priorLevel = Math.round(priorComposite * 100);
  const deltaWeek = level - priorLevel;

  return {
    level,
    tier: tierFromLevel(level),
    components: {
      volume: Math.round(volume * 100),
      diversity: Math.round(diversity * 100),
      sophistication: Math.round(sophistication * 100),
      action: Math.round(action * 100),
      recency: Math.round(recency * 100),
      engagement: Math.round(engagement * 100),
    },
    deltaWeek,
  };
}
