/**
 * Pure client-side aggregations for the Insights page. Takes the local
 * product store + period filter, returns the slices each section needs.
 *
 * No AI here — that's separate. These are just deterministic rollups.
 */

import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import { periodDays, type InsightsPeriod } from "@/types/insights";
import type { Product, Niche, Verdict } from "@/types";
import type { ProductStatus } from "@/types/vault";

const MS_DAY = 24 * 60 * 60 * 1000;

export type DayBucket = {
  /** YYYY-MM-DD */
  date: string;
  count: number;
  avgScore: number;
  /** counts of each verdict that day */
  verdicts: Record<Verdict, number>;
};

export type Bucket = {
  key: string;
  label: string;
  count: number;
  avgScore: number;
  /** Best (highest scored) product in this bucket — useful for tooltips. */
  topName?: string;
};

export type NicheCountryCell = {
  niche: Niche;
  country: string;
  count: number;
  avgScore: number;
  verdicts: Record<Verdict, number>;
};

export type PeriodFilteredAggregates = {
  /** Products in the selected period (with period === "all", all products). */
  inPeriod: Product[];
  /** Products in the previous period of the same length, for comparison. */
  inPrevPeriod: Product[];
  totalScans: number;
  avgScore: number;
  winRate: number; // 0-1 — GO+TEST verdicts
  highestScore: number;
  creditsSpentEstimate: number; // very rough — count × 1
  byNiche: Bucket[];
  byCountry: Bucket[];
  byVerdict: { verdict: Verdict; count: number }[];
  byDay: DayBucket[];
  byHour: { hour: number; count: number }[];
  byScoreBucket: { bucket: string; min: number; max: number; count: number }[];
  matrix: NicheCountryCell[];
};

export function filterByPeriod(
  products: Product[],
  period: InsightsPeriod,
): Product[] {
  const days = periodDays(period);
  if (days === null) return products;
  const cutoff = Date.now() - days * MS_DAY;
  return products.filter((p) => new Date(p.createdAt).getTime() >= cutoff);
}

function filterByPrevPeriod(
  products: Product[],
  period: InsightsPeriod,
): Product[] {
  const days = periodDays(period);
  if (days === null) return [];
  const now = Date.now();
  const start = now - days * 2 * MS_DAY;
  const end = now - days * MS_DAY;
  return products.filter((p) => {
    const t = new Date(p.createdAt).getTime();
    return t >= start && t < end;
  });
}

export function buildAggregates(
  products: Product[],
  period: InsightsPeriod,
): PeriodFilteredAggregates {
  const inPeriod = filterByPeriod(products, period);
  const inPrevPeriod = filterByPrevPeriod(products, period);

  const totalScans = inPeriod.length;
  const avgScore =
    totalScans === 0
      ? 0
      : Math.round(
          inPeriod.reduce((s, p) => s + p.sellScore, 0) / totalScans,
        );
  const winRate =
    totalScans === 0
      ? 0
      : inPeriod.filter((p) => p.verdict === "go" || p.verdict === "test")
          .length / totalScans;
  const highestScore = inPeriod.reduce((m, p) => Math.max(m, p.sellScore), 0);
  // Rough heuristic: 1 credit per scan (the actual cost varies w/ power-ups).
  const creditsSpentEstimate = totalScans;

  // -------- byNiche --------
  const nicheGroups = new Map<Niche, Product[]>();
  for (const p of inPeriod) {
    const arr = nicheGroups.get(p.category) ?? [];
    arr.push(p);
    nicheGroups.set(p.category, arr);
  }
  const byNiche: Bucket[] = Array.from(nicheGroups.entries())
    .map(([k, arr]) => {
      const top = [...arr].sort((a, b) => b.sellScore - a.sellScore)[0];
      return {
        key: k,
        label: NICHES[k]?.label ?? k,
        count: arr.length,
        avgScore: Math.round(
          arr.reduce((s, p) => s + p.sellScore, 0) / arr.length,
        ),
        topName: top?.name,
      };
    })
    .sort((a, b) => b.count - a.count);

  // -------- byCountry --------
  const countryGroups = new Map<string, Product[]>();
  for (const p of inPeriod) {
    const arr = countryGroups.get(p.targetCountry) ?? [];
    arr.push(p);
    countryGroups.set(p.targetCountry, arr);
  }
  const byCountry: Bucket[] = Array.from(countryGroups.entries())
    .map(([k, arr]) => {
      const top = [...arr].sort((a, b) => b.sellScore - a.sellScore)[0];
      const meta = COUNTRIES[k];
      return {
        key: k,
        label: meta ? `${meta.flag} ${meta.name}` : k,
        count: arr.length,
        avgScore: Math.round(
          arr.reduce((s, p) => s + p.sellScore, 0) / arr.length,
        ),
        topName: top?.name,
      };
    })
    .sort((a, b) => b.count - a.count);

  // -------- byVerdict --------
  const verdictMap: Record<Verdict, number> = { go: 0, test: 0, risky: 0, skip: 0 };
  for (const p of inPeriod) verdictMap[p.verdict]++;
  const byVerdict = (Object.entries(verdictMap) as [Verdict, number][]).map(
    ([verdict, count]) => ({ verdict, count }),
  );

  // -------- byDay --------
  // Span the full period (so empty days show up in the heatmap).
  const days = periodDays(period);
  let spanDays: number;
  if (days === null) {
    // For "all time", grow to fit the earliest scan but cap at 365.
    const earliest = products.reduce((m, p) => {
      const t = new Date(p.createdAt).getTime();
      return Math.min(m, t);
    }, Date.now());
    spanDays = Math.min(
      365,
      Math.max(7, Math.ceil((Date.now() - earliest) / MS_DAY) + 1),
    );
  } else {
    spanDays = days;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMap = new Map<string, DayBucket>();
  for (let i = spanDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    dayMap.set(k, {
      date: k,
      count: 0,
      avgScore: 0,
      verdicts: { go: 0, test: 0, risky: 0, skip: 0 },
    });
  }
  // Track sums to compute avg at the end.
  const sumMap = new Map<string, number>();
  for (const p of inPeriod) {
    const k = p.createdAt.slice(0, 10);
    const cell = dayMap.get(k);
    if (cell) {
      cell.count += 1;
      cell.verdicts[p.verdict] += 1;
      sumMap.set(k, (sumMap.get(k) ?? 0) + p.sellScore);
    }
  }
  for (const [k, cell] of dayMap) {
    if (cell.count > 0) {
      cell.avgScore = Math.round((sumMap.get(k) ?? 0) / cell.count);
    }
  }
  const byDay = Array.from(dayMap.values());

  // -------- byHour --------
  const hourArr: number[] = new Array(24).fill(0);
  for (const p of inPeriod) {
    const h = new Date(p.createdAt).getHours();
    if (Number.isInteger(h) && h >= 0 && h < 24) hourArr[h] += 1;
  }
  const byHour = hourArr.map((count, hour) => ({ hour, count }));

  // -------- byScoreBucket (10 buckets, 0-10, 11-20, ...) --------
  const buckets: { bucket: string; min: number; max: number; count: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const min = i * 10;
    const max = i === 9 ? 100 : i * 10 + 9;
    const count = inPeriod.filter(
      (p) => p.sellScore >= min && p.sellScore <= max,
    ).length;
    buckets.push({ bucket: `${min}-${max}`, min, max, count });
  }

  // -------- matrix (niche × country) --------
  const matrixMap = new Map<string, NicheCountryCell>();
  for (const p of inPeriod) {
    const key = `${p.category}::${p.targetCountry}`;
    let cell = matrixMap.get(key);
    if (!cell) {
      cell = {
        niche: p.category,
        country: p.targetCountry,
        count: 0,
        avgScore: 0,
        verdicts: { go: 0, test: 0, risky: 0, skip: 0 },
      };
      matrixMap.set(key, cell);
    }
    cell.count += 1;
    cell.verdicts[p.verdict] += 1;
    cell.avgScore += p.sellScore;
  }
  const matrix = Array.from(matrixMap.values()).map((cell) => ({
    ...cell,
    avgScore: Math.round(cell.avgScore / cell.count),
  }));

  return {
    inPeriod,
    inPrevPeriod,
    totalScans,
    avgScore,
    winRate,
    highestScore,
    creditsSpentEstimate,
    byNiche,
    byCountry,
    byVerdict,
    byDay,
    byHour,
    byScoreBucket: buckets,
    matrix,
  };
}

/* -------------------------------------------------------------------------- */
/* Period-pair deltas — for the metric grid's "+/-% vs last period" badges.   */
/* -------------------------------------------------------------------------- */

export function pctDelta(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return Math.round(((current - previous) / previous) * 100);
}

/* -------------------------------------------------------------------------- */
/* Action rate from vault statuses                                             */
/* -------------------------------------------------------------------------- */

export function actionRate(
  products: Product[],
  statuses: Record<string, ProductStatus>,
): number {
  if (products.length === 0) return 0;
  const actionable = products.filter((p) => {
    const s = statuses[p.id];
    return s === "testing" || s === "won";
  }).length;
  return actionable / products.length;
}
