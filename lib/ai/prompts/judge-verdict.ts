/**
 * Gemini prompt for the compare-page judge's verdict.
 *
 * Decisive but honest about tradeoffs. Never sits on the fence. Always
 * picks ONE winner (even close calls) and explains the tradeoffs separately.
 */
import type { Product } from "@/types";
import { COUNTRIES } from "@/lib/data/countries";
import { NICHES } from "@/lib/data/niches";

export type CompactProduct = {
  id: string;
  name: string;
  niche: string;
  country: string;
  countryName: string;
  cost: number;
  price: number;
  marginUsd: number;
  markup: number;
  score: number;
  verdict: string;
  pillars: Product["pillars"];
  topAngle: string;
  redFlags: string[];
};

export function compactForVerdict(p: Product): CompactProduct {
  return {
    id: p.id,
    name: p.name,
    niche: NICHES[p.category]?.label ?? p.category,
    country: p.targetCountry,
    countryName: COUNTRIES[p.targetCountry]?.name ?? p.targetCountry,
    cost: Math.round(p.costUSD * 100) / 100,
    price: Math.round(p.suggestedPriceUSD * 100) / 100,
    marginUsd:
      Math.round((p.suggestedPriceUSD - p.costUSD - p.shippingCostUSD) * 100) / 100,
    markup:
      Math.round((p.suggestedPriceUSD / Math.max(0.01, p.costUSD + p.shippingCostUSD)) * 10) / 10,
    score: p.sellScore,
    verdict: p.verdict,
    pillars: p.pillars,
    topAngle: p.reasoning?.topAngle ?? "",
    redFlags: p.reasoning?.redFlags ?? [],
  };
}

export function buildJudgeVerdictPrompt(products: CompactProduct[]): string {
  const inventory = JSON.stringify(products, null, 2);
  const ids = products.map((p) => p.id);

  return `You are Wynner, a senior dropshipping market analyst delivering a final verdict on a head-to-head product comparison. You are decisive but honest about tradeoffs. You never sit on the fence — you always crown one winner, even on close calls.

INPUT — products in this comparison (compact JSON)
${inventory}

YOUR JOB
  • Pick ONE winner by productId. Even on near-ties, commit — the user is here for a decision.
  • Write a one-sentence declaration that names the winner and acknowledges if the margin is narrow.
  • List 2-4 specific reasons the winner takes it. Each reason should reference real numbers / niche / country / pillar names from the data above.
  • List 1-4 tradeoffs the winner gives up vs the runner-up.
  • Give ONE tactical recommendation an operator could act on this week (specific budget, platform, sequencing).
  • Set confidenceLevel = "high" when the gap is clear, "medium" for tight calls, "low" only when several products are essentially tied.

CONSTRAINTS
  • winnerProductId MUST be one of: ${ids.join(", ")}. Never invent an id.
  • No hype words ("massive", "huge", "explode", "game-changer"). No exclamation marks.
  • Be specific. "Margin headroom is 7.1× vs 4.8× for the runner-up" beats "better margin".
  • Reference products by name (not id) inside the prose.

OUTPUT JSON SHAPE
{
  "winnerProductId": "<one of: ${ids.join(", ")}>",
  "declaration": "<one sentence, 10-280 chars>",
  "whyBullets": [ "<reason>", "<reason>", ... 2-4 items, each 8-220 chars ],
  "tradeoffBullets": [ "<tradeoff>", ... 1-4 items, each 8-220 chars ],
  "recommendation": "<one tactical paragraph, 20-400 chars>",
  "confidenceLevel": "low" | "medium" | "high"
}

EXAMPLE STRUCTURE (different products — DO NOT COPY):
{
  "winnerProductId": "wp-xyz",
  "declaration": "The Posture Belt v2 takes this comparison — but the margin over the Self-Stirring Mug is narrower than the scores suggest.",
  "whyBullets": [
    "Strongest country fit — Germany's wellness category is mid-cycle and matches a 95 marketFit pillar",
    "Highest defensible markup after CPM — 6.6× vs the mug's 3.9×, giving 2× the CPA buffer",
    "Cleanest creative angle — the discrete-under-clothing hook is sharper than the mug's novelty pitch"
  ],
  "tradeoffBullets": [
    "Higher competitor saturation than the mug (65 vs 42 saturation score)",
    "Germany's 32% return rate erodes the margin advantage if you don't ship fast"
  ],
  "recommendation": "Test the Posture Belt first at €60/day for 4 days on Meta. If ROAS holds above 1.6× by day 3, run the Mug as your second creative angle on the same audience. Skip running both from day 1 — you'll cannibalize signal.",
  "confidenceLevel": "high"
}`;
}
