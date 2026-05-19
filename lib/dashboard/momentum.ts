/**
 * Personal momentum stats — derived from the user's products + credits
 * transactions (both local). These power the 4-card momentum row.
 */
import type { Niche, Product } from "@/types";
import { NICHES } from "@/lib/data/niches";
import type { CreditTransaction } from "@/types/credits";

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Detect which products the user actually created (not seed data). */
export function userProducts(all: Product[]): Product[] {
  return all.filter((p) => !p.id.startsWith("seed-"));
}

/* -------------------------------------------------------------------------- */
/* Streak                                                                      */
/* -------------------------------------------------------------------------- */

export function lastSevenDayKeys(): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

/** Map of day → did the user scan that day. Based on user-created products. */
export function dailyScanMap(products: Product[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of products) {
    const k = dayKey(new Date(p.createdAt));
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

/** Streak — consecutive days ending today (or yesterday) with at least one scan. */
export function streakDays(products: Product[]): number {
  const map = dailyScanMap(products);
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    if (map.has(k) && (map.get(k) ?? 0) > 0) {
      streak++;
    } else if (i === 0) {
      // Today not scanned — streak might still be alive from yesterday.
      continue;
    } else {
      break;
    }
  }
  return streak;
}

/* -------------------------------------------------------------------------- */
/* This week                                                                   */
/* -------------------------------------------------------------------------- */

export function scansThisWeek(products: Product[]): number {
  const cutoff = Date.now() - 7 * DAY_MS;
  return products.filter((p) => new Date(p.createdAt).getTime() >= cutoff).length;
}

export function scansLastWeek(products: Product[]): number {
  const now = Date.now();
  return products.filter((p) => {
    const t = new Date(p.createdAt).getTime();
    return t >= now - 14 * DAY_MS && t < now - 7 * DAY_MS;
  }).length;
}

export function weeklyTrendDeltaPct(products: Product[]): number | null {
  const last = scansLastWeek(products);
  if (last === 0) return null;
  return Math.round(((scansThisWeek(products) - last) / last) * 100);
}

/** Array of 7 numbers — scans per day for the last 7 days (oldest → newest). */
export function dailyScanSeries(products: Product[]): number[] {
  const map = dailyScanMap(products);
  return lastSevenDayKeys().map((k) => map.get(k) ?? 0);
}

/* -------------------------------------------------------------------------- */
/* Win rate (30d)                                                              */
/* -------------------------------------------------------------------------- */

export type VerdictBreakdown = {
  go: number;
  test: number;
  risky: number;
  skip: number;
  total: number;
  winRatePct: number;
};

export function verdictBreakdown30d(products: Product[]): VerdictBreakdown {
  const cutoff = Date.now() - 30 * DAY_MS;
  const recent = products.filter((p) => new Date(p.createdAt).getTime() >= cutoff);
  const counts = { go: 0, test: 0, risky: 0, skip: 0 } as Record<string, number>;
  for (const p of recent) counts[p.verdict] = (counts[p.verdict] ?? 0) + 1;
  const total = recent.length;
  const wins = counts.go + counts.test;
  return {
    go: counts.go ?? 0,
    test: counts.test ?? 0,
    risky: counts.risky ?? 0,
    skip: counts.skip ?? 0,
    total,
    winRatePct: total === 0 ? 0 : Math.round((wins / total) * 100),
  };
}

/* -------------------------------------------------------------------------- */
/* Best niche                                                                  */
/* -------------------------------------------------------------------------- */

export type BestNiche = {
  niche: Niche;
  label: string;
  color: string;
  avgScore: number;
  count: number;
  trend: number[]; // last N scores, oldest → newest
} | null;

export function bestNiche(products: Product[]): BestNiche {
  if (products.length === 0) return null;
  const byNiche = new Map<Niche, Product[]>();
  for (const p of products) {
    const arr = byNiche.get(p.category) ?? [];
    arr.push(p);
    byNiche.set(p.category, arr);
  }
  let best: { niche: Niche; avg: number; items: Product[] } | null = null;
  for (const [niche, items] of byNiche) {
    if (items.length < 1) continue;
    const avg = items.reduce((s, p) => s + p.sellScore, 0) / items.length;
    if (!best || avg > best.avg) best = { niche, avg, items };
  }
  if (!best) return null;
  const meta = NICHES[best.niche];
  const trend = [...best.items]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-12)
    .map((p) => p.sellScore);
  return {
    niche: best.niche,
    label: meta?.label ?? best.niche,
    color: meta?.color ?? "#5B8DFF",
    avgScore: Math.round(best.avg),
    count: best.items.length,
    trend,
  };
}

/* -------------------------------------------------------------------------- */
/* Trending niches (platform-wide, derived from product scores)                */
/* -------------------------------------------------------------------------- */

export type TrendingRow = {
  niche: Niche;
  label: string;
  color: string;
  heat: number; // 0-100
  deltaPct: number; // mock — compares last 7d vs prior 7d avg
};

export function trendingNiches(all: Product[]): TrendingRow[] {
  const sevenDay = Date.now() - 7 * DAY_MS;
  const fourteenDay = Date.now() - 14 * DAY_MS;
  const grouped = new Map<Niche, { recent: number[]; prior: number[] }>();
  for (const p of all) {
    const t = new Date(p.createdAt).getTime();
    if (!grouped.has(p.category)) grouped.set(p.category, { recent: [], prior: [] });
    const slot = grouped.get(p.category)!;
    if (t >= sevenDay) slot.recent.push(p.sellScore);
    else if (t >= fourteenDay) slot.prior.push(p.sellScore);
  }

  const rows: TrendingRow[] = [];
  for (const [niche, scores] of grouped) {
    const meta = NICHES[niche];
    const recentAvg = scores.recent.length
      ? scores.recent.reduce((s, n) => s + n, 0) / scores.recent.length
      : meta?.avgScore ?? 60;
    const priorAvg = scores.prior.length
      ? scores.prior.reduce((s, n) => s + n, 0) / scores.prior.length
      : recentAvg;
    rows.push({
      niche,
      label: meta?.label ?? niche,
      color: meta?.color ?? "#5B8DFF",
      heat: Math.min(100, Math.round((recentAvg + (meta?.heat ?? 60)) / 2)),
      deltaPct: Math.round(((recentAvg - priorAvg) / Math.max(1, priorAvg)) * 100),
    });
  }
  rows.sort((a, b) => b.heat - a.heat);
  return rows.slice(0, 5);
}

/* -------------------------------------------------------------------------- */
/* Country opportunity (for the map)                                           */
/* -------------------------------------------------------------------------- */

export type CountryOpportunity = {
  code: string;
  name: string;
  flag: string;
  avgScore: number;
  scanCount: number;
  opportunity: number; // 0-100 — high score + low scan count = high opportunity
};

export function countryOpportunity(all: Product[], yourScans: Product[]) {
  const grouped = new Map<string, { scores: number[]; mine: number }>();
  for (const p of all) {
    if (!grouped.has(p.targetCountry))
      grouped.set(p.targetCountry, { scores: [], mine: 0 });
    grouped.get(p.targetCountry)!.scores.push(p.sellScore);
  }
  const mineSet = new Map<string, number>();
  for (const p of yourScans) {
    mineSet.set(p.targetCountry, (mineSet.get(p.targetCountry) ?? 0) + 1);
  }
  const out: CountryOpportunity[] = [];
  for (const [code, slot] of grouped) {
    const avg = slot.scores.reduce((s, n) => s + n, 0) / slot.scores.length;
    const mine = mineSet.get(code) ?? 0;
    // Opportunity = high score, low personal coverage. Bell-ish weighting.
    const coverage = Math.min(1, mine / 5);
    const opportunity = Math.round(avg * (1 - 0.3 * coverage));
    out.push({
      code,
      name: code, // resolved by component using COUNTRIES
      flag: "",
      avgScore: Math.round(avg),
      scanCount: mine,
      opportunity,
    });
  }
  out.sort((a, b) => b.opportunity - a.opportunity);
  return out;
}

/* -------------------------------------------------------------------------- */
/* Activity feed                                                               */
/* -------------------------------------------------------------------------- */

export type ActivityEvent = {
  id: string;
  type: "scan" | "favorite" | "compare" | "regenerate" | "credit_grant" | "credit_spend";
  text: string;
  productId?: string;
  href?: string;
  cta?: string;
  timestamp: string; // ISO
};

/**
 * Compose a unified activity feed from product creates + favorites + credit
 * transactions. Newest first.
 */
export function buildActivityFeed(
  products: Product[],
  favorites: Set<string>,
  transactions: CreditTransaction[],
): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  // Scans (user-created products)
  for (const p of products) {
    events.push({
      id: `scan-${p.id}`,
      type: "scan",
      text: `Scored ${p.name} — ${p.sellScore} ${p.verdict.toUpperCase()}`,
      productId: p.id,
      href: `/product/${p.id}`,
      cta: "View",
      timestamp: p.createdAt,
    });
    // Re-scores — surfaced when updatedAt > createdAt by > 1 min.
    if (new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime() > 60_000) {
      events.push({
        id: `rescore-${p.id}-${p.updatedAt}`,
        type: "regenerate",
        text: `Re-scored ${p.name}`,
        productId: p.id,
        href: `/product/${p.id}`,
        cta: "View",
        timestamp: p.updatedAt,
      });
    }
  }

  // Favorites — fake timestamps clustered near product createdAt since we
  // don't track favorite-time. Reasonable for an activity feed.
  for (const p of products) {
    if (favorites.has(p.id)) {
      events.push({
        id: `fav-${p.id}`,
        type: "favorite",
        text: `Favorited ${p.name}`,
        productId: p.id,
        href: `/product/${p.id}`,
        cta: "View",
        timestamp: p.updatedAt,
      });
    }
  }

  // Credit transactions
  for (const t of transactions) {
    if (t.amount === 0) continue;
    events.push({
      id: `tx-${t.id}`,
      type: t.amount > 0 ? "credit_grant" : "credit_spend",
      text: t.description,
      timestamp: t.createdAt,
    });
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return events;
}
