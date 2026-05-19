/**
 * Daily top picks ranking.
 *
 * Stable within a calendar day per user (so the morning's picks don't
 * jitter on reload) but rotates daily so it feels fresh. Achieved by
 * mixing the product's sell score with a hash of (user.id + today + product.id).
 *
 * If the user has preferred niches/countries on their profile, picks from
 * those buckets first. Falls back to platform-wide top scores otherwise.
 */
import type { Niche, Product } from "@/types";

function hash(s: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type PicksFilters = {
  preferredNiches: Niche[];
  preferredCountry: string | null;
  userKey: string;
};

export function pickDailyTop(products: Product[], filters: PicksFilters, count = 8): Product[] {
  const seed = `${filters.userKey}|${todayISO()}`;
  // Score = real sellScore plus a small per-day per-product noise (-5..+5)
  // so the order rotates daily within a similar tier.
  const noise = (id: string): number => {
    const h = hash(`${seed}|${id}`);
    return ((h % 1000) / 1000) * 10 - 5;
  };

  // Bucket by preference fit
  const matches = products.filter((p) => {
    const nicheMatch =
      filters.preferredNiches.length === 0 || filters.preferredNiches.includes(p.category);
    const countryMatch = !filters.preferredCountry || p.targetCountry === filters.preferredCountry;
    return nicheMatch && countryMatch;
  });

  const pool = matches.length >= count ? matches : products;
  const ranked = [...pool]
    .map((p) => ({ p, s: p.sellScore + noise(p.id) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);

  return ranked.slice(0, count);
}

/**
 * Pre-computed (deterministic) 1-line "why it's here" tagline. We don't
 * round-trip to Gemini for this — it would cost real money + latency.
 * The line is a function of the product's verdict + top pillar.
 */
export function whyItsHere(product: Product): string {
  const pillars = product.pillars;
  const topPillar = (Object.keys(pillars) as (keyof typeof pillars)[]).reduce(
    (best, k) => (pillars[k] > pillars[best] ? k : best),
    "margin" as keyof typeof pillars,
  );
  const pillarText: Record<keyof typeof pillars, string> = {
    margin: "Healthy margin headroom",
    marketFit: "Strong country fit",
    demand: "Demand signal climbing",
    competition: "Surprisingly uncrowded",
    creative: "Creative angle writes itself",
  };
  switch (product.verdict) {
    case "go":
      return `${pillarText[topPillar]} — primed to ship`;
    case "test":
      return `${pillarText[topPillar]} — worth a small test`;
    case "risky":
      return `${pillarText[topPillar]} — fix the red flags first`;
    case "skip":
      return `Surfacing for context — better picks exist`;
  }
}
