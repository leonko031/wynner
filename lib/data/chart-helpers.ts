import type { Niche, Product, Verdict } from "@/types";
import { VERDICTS } from "@/types";
import { NICHES } from "./niches";

export type NicheBarDatum = {
  niche: Niche;
  label: string;
  color: string;
  avgScore: number;
  count: number;
};

export function getNicheBarData(products: Product[]): NicheBarDatum[] {
  const buckets = new Map<Niche, Product[]>();
  for (const p of products) {
    const arr = buckets.get(p.category) ?? [];
    arr.push(p);
    buckets.set(p.category, arr);
  }
  const rows: NicheBarDatum[] = Array.from(buckets.entries()).map(
    ([niche, ps]) => {
      const meta = NICHES[niche];
      const avg = ps.reduce((sum, p) => sum + p.sellScore, 0) / ps.length;
      return {
        niche,
        label: meta.label,
        color: meta.color,
        avgScore: Math.round(avg),
        count: ps.length,
      };
    },
  );
  return rows.sort((a, b) => b.avgScore - a.avgScore).slice(0, 5);
}

export type VerdictDatum = {
  verdict: Verdict;
  label: string;
  color: string;
  value: number;
};

const VERDICT_COLOR: Record<Verdict, string> = {
  go: "#00D26A",
  test: "#F5A623",
  risky: "#F97316",
  skip: "#EF4444",
};

const VERDICT_LABEL: Record<Verdict, string> = {
  go: "Go",
  test: "Test",
  risky: "Risky",
  skip: "Skip",
};

export function getVerdictDistribution(products: Product[]): VerdictDatum[] {
  const counts: Record<Verdict, number> = {
    go: 0,
    test: 0,
    risky: 0,
    skip: 0,
  };
  for (const p of products) counts[p.verdict]++;
  return VERDICTS.map((v) => ({
    verdict: v,
    label: VERDICT_LABEL[v],
    color: VERDICT_COLOR[v],
    value: counts[v],
  }));
}

export type ScansOverTimeDatum = {
  date: string; // YYYY-MM-DD
  label: string; // Mon, Tue…
  scans: number;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getScansOverTime(
  products: Product[],
  days = 7,
  now: Date = new Date(),
): ScansOverTimeDatum[] {
  // For seed data we synthesize: bucket products by id-hash so the chart looks
  // plausibly varied without ever depending on a real timestamp.
  const out: ScansOverTimeDatum[] = [];
  const totalScans = products.length;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const seed = (d.getDate() * 31 + d.getMonth()) % 100;
    const base = Math.max(2, Math.round(totalScans / days));
    const jitter = (seed % 6) - 2;
    out.push({
      date: d.toISOString().slice(0, 10),
      label: DAY_LABELS[d.getDay()],
      scans: Math.max(1, base + jitter),
    });
  }
  return out;
}

export function getDemandSparkline(
  product: Product | undefined,
): { i: number; v: number }[] {
  if (!product) return [];
  return product.demandTrend.map((v, i) => ({ i, v }));
}
