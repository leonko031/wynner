import type { PillarKey, ScoreInput } from "@/lib/scoring/types";
import { NICHES } from "@/lib/data/niches";

export const reasoningSchema = {
  type: "object",
  properties: {
    whyTest: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
    },
    redFlags: {
      type: "array",
      items: { type: "string" },
      minItems: 0,
      maxItems: 4,
    },
    topAngle: { type: "string" },
  },
  required: ["whyTest", "redFlags", "topAngle"],
};

export function buildReasoningPrompt(
  input: ScoreInput,
  pillars: Record<PillarKey, number>,
  sellScore: number,
): string {
  const { product, country } = input;
  const niche = NICHES[product.category];
  return `You are Wynner, a senior dropshipping analyst writing a tight punch-card summary for an operator who tests 5+ products a week. Be specific. Use real numbers. No hype words. No "amazing", "huge", "massive", "incredible", "game-changing".

DATA
- Product: ${product.name} — ${product.description}
- Niche: ${niche.label} (heat ${niche.heat}/100)
- Target: ${country.name} (AOV €${country.avgAOV}, CPM idx ${country.cpmIndex}, top platform ${country.topPlatform})
- Pricing: cost $${product.costUSD.toFixed(2)}, ship $${product.shippingCostUSD.toFixed(2)}, sell $${product.suggestedPriceUSD.toFixed(2)}
- Markup: ${(product.suggestedPriceUSD / (product.costUSD + product.shippingCostUSD)).toFixed(1)}x
- Pillar scores (0-100): margin ${pillars.margin}, marketFit ${pillars.marketFit}, demand ${pillars.demand}, competition ${pillars.competition}, creative ${pillars.creative}
- Final sell score: ${sellScore}/100

OUTPUT JSON
{
  "whyTest": [2-4 short bullet sentences explaining the strongest reasons to test, each grounded in a specific number or pillar. Use complete sentences.],
  "redFlags": [0-3 short bullet sentences naming the strongest risks, each grounded in a specific number or competitive reality. If there are no real flags, return an empty array.],
  "topAngle": "A single sentence (max 35 words) naming the most-likely-to-win creative angle, including format hint (UGC / split-screen / studio / founder testimonial) and the hook beat."
}

STYLE EXAMPLES
- whyTest: "7.1x markup leaves $18 CPA headroom — well above the country's median acquisition cost."
- redFlags: "Saturation visible in DE Meta ad library; copy fatigue will hit before week 3."
- topAngle: "First-person UGC: desk worker tries it for 7 days, films their slouch on day 1 vs day 7. Hook on the side-profile shock."

Return JSON only — no preamble, no markdown fences.`;
}
