import type { Country, Niche } from "@/types";
import { NICHES } from "@/lib/data/niches";

/**
 * Common context-builders used by every research prompt.
 *
 * Convention: every prompt opens with a sharp role line, follows with a
 * Context block, then the Output block specifying the exact JSON schema in
 * prose (since Gemini's responseSchema enforces shape — the prose reinforces
 * semantics and constraints).
 */

export type ProductInput = {
  name: string;
  description: string;
  category: Niche | string;
  costUSD: number;
  suggestedPriceUSD: number;
  shippingCostUSD: number;
};

export function productBlock(p: ProductInput): string {
  const margin = p.suggestedPriceUSD - p.costUSD - p.shippingCostUSD;
  const markup = p.suggestedPriceUSD / Math.max(0.01, p.costUSD + p.shippingCostUSD);
  return `Product
  • Name: ${p.name}
  • Category: ${p.category}
  • Description: ${p.description}
  • Cost: $${p.costUSD.toFixed(2)} | Shipping: $${p.shippingCostUSD.toFixed(2)} | Selling price: $${p.suggestedPriceUSD.toFixed(2)}
  • Gross margin: $${margin.toFixed(2)} (${markup.toFixed(1)}× markup)`;
}

export function countryBlock(c: Country): string {
  const niche = (n: Niche) => NICHES[n]?.label ?? n;
  return `Country profile — ${c.name} (${c.code})
  • Currency: ${c.currency}, language: ${c.language}
  • Average order value: €${c.avgAOV}
  • Card trust: ${c.cardTrust}/10 — COD preference: ${c.codPreference}/10
  • Shipping tolerance: ${c.shippingTolerance} days
  • Top ad platform: ${c.topPlatform}
  • Trending niches: ${c.trendingNiches.map(niche).join(", ")}
  • Dead niches: ${c.deadNiches.map(niche).join(", ")}
  • CPM index: ${c.cpmIndex} (US baseline = 10)
  • Return rate: ${(c.returnRate * 100).toFixed(0)}%
  • Population: ${(c.population / 1_000_000).toFixed(1)}M, e-commerce penetration: ${(c.ecommercePenetration * 100).toFixed(0)}%`;
}

export function nicheBlock(n: Niche | string): string {
  const meta = NICHES[n as Niche];
  if (!meta) return `Niche: ${n}`;
  return `Niche — ${meta.label}
  • Heat: ${meta.heat}/100
  • Average sell-score in this niche: ${meta.avgScore}/100`;
}

export const CONSTRAINTS = `Constraints
  • Be concrete. Use specific numbers, brand names, and verbatim consumer language. Avoid filler like "leverage", "synergy", "next-level", "game-changer".
  • Write like a senior analyst, not a marketer. No exclamation marks. No hype.
  • When you don't know something, set confidenceLevel to "low" and pick the most plausible answer — never refuse to answer.
  • All text fields should sound like they were written by a human who actually understands the category.`;

/**
 * User-context preamble — included verbatim near the top of every prompt
 * (the user's "Why this country?" textarea, etc.). Keeps Gemini aligned.
 */
export function userContextBlock(ctx: string | undefined): string {
  const trimmed = (ctx ?? "").trim();
  if (!trimmed) return "";
  return `\nAdditional context from the operator:\n  "${trimmed}"\n`;
}
