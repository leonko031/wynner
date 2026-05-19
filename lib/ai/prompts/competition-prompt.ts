import type { ScoreInput } from "@/lib/scoring/types";
import { NICHES } from "@/lib/data/niches";

export const competitionSchema = {
  type: "object",
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    reasoning: { type: "string" },
  },
  required: ["score", "reasoning"],
};

export function buildCompetitionPrompt({
  product,
  country,
}: ScoreInput): string {
  const niche = NICHES[product.category];
  return `You are Wynner, a senior dropshipping market analyst tracking Meta Ad Library and TikTok Creative Center daily for 10 years. Be specific, conservative, and skeptical.

TASK
Estimate competitive density for this product in ${country.name} on a 0-100 scale, where:
- 100 = blue-ocean, no incumbents visible
- 0 = totally saturated, multiple veterans running stale creative

PRODUCT
- Name: ${product.name}
- Description: ${product.description}
- Category: ${niche.label} (heat ${niche.heat}/100)
- Suggested retail: $${product.suggestedPriceUSD.toFixed(2)}
- Source: ${product.source}

COUNTRY
- ${country.name} (${country.code})
- Top platform: ${country.topPlatform}
- CPM index (US=10): ${country.cpmIndex}

CONSIDER
1. How many incumbents are likely running ads for this category in this country today?
2. Is the creative pool fatigued (same hooks, before/afters, demo cuts) or fresh?
3. Does Amazon / Decathlon / a local big-box already own the search-driven segment?
4. Does the product have a distinctive angle, or is it commodity (e.g. selfie sticks, basic chargers)?
5. CPM index ${country.cpmIndex} — high CPM countries punish saturated categories harder.

SCORING RUBRIC
- 80-100: niche category, few competitors, fresh hook room
- 60-79: moderate competition, beat-able with one strong differentiator
- 40-59: crowded — needs sustained creative volume to break through
- 20-39: late to the party, incumbents own attention and search
- 0-19: dead-on-arrival; no creative angle left untouched

OUTPUT
Strict JSON:
{ "score": <integer 0-100>, "reasoning": "<one sentence, max 28 words, mention competitive surface>" }

Good examples:
- "Magnetic phone mounts: 100+ active competitors in FR, 3M base reviews tank trust, no room left."
- "Heated eye massager: moderate field, premium framing in CH can carve a defensible angle."

JSON only, no other text.`;
}
