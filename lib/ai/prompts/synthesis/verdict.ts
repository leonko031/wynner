import type { Country } from "@/types";
import type {
  CompetitorLandscape,
  HookAngle,
  Persona,
  PricingStrategy,
} from "@/types/research";
import {
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "@/lib/ai/prompts/research/shared";
import { SYNTHESIS_TONE, discoveryContextBlock, type DiscoveryBundle } from "./shared";

/**
 * Final verdict synthesis — all tiers (different complexity per tier).
 *
 * Reads everything generated so far + the discovery signals and produces:
 *   • sellScore + verdict + summary
 *   • 5 pillar scores
 *   • topAngle (1-line)
 *   • comparableProducts (max 3) for Deep
 *   • confidence
 */
export function buildVerdictPrompt(
  product: ProductInput,
  country: Country,
  discovery: DiscoveryBundle,
  context: {
    personas: Persona[];
    angles: HookAngle[];
    pricing: PricingStrategy | null;
    competition: CompetitorLandscape | null;
  },
  userContext?: string,
): string {
  const anglesBrief = context.angles
    .slice(0, 8)
    .map(
      (a) =>
        `  • [${a.rank}] ${a.awarenessLevel} / ${a.emotionalDriver}: "${a.primaryHook}" (confidence:${a.confidence})`,
    )
    .join("\n");

  const personasBrief = context.personas
    .map((p) => `  • ${p.id}: ${p.name}, ${p.occupation}`)
    .join("\n");

  return `You are the senior reviewer who reads everything the analysts have produced and writes the final verdict. Be sharp and honest — operators waste real money on optimistic verdicts.

${productBlock(product)}
${countryBlock(country)}
${userContextBlock(userContext)}

${discoveryContextBlock(discovery)}

CONTEXT
Personas built:
${personasBrief || "  (none)"}

Hook angles generated:
${anglesBrief || "  (none)"}

Pricing recommendation: ${context.pricing ? `$${context.pricing.recommendedPrice} (anchor $${context.pricing.anchorPrice})` : "(none)"}
Competition: ${context.competition ? `${context.competition.saturationLevel} (score ${context.competition.saturationScore}/100)` : "(none)"}

TASK
Produce the final verdict:
  • sellScore (0-100) — the headline judgment
  • verdict — go / test / risky / skip (>=80 go, 60-79 test, 40-59 risky, <40 skip)
  • summary — 2-3 sentences explaining the verdict, calling out the strongest evidence
  • pillars — { margin, marketFit, demand, competition, creative } each 0-100
  • topAngle — the rank-1 hook angle's primaryHook (1 sentence)
  • comparableProducts — 1-3 similar shipped products with 1-sentence "why" each (Deep tier — empty array for Quick)
  • confidenceLevel — calibrated to grounding quality

Pillar reasoning:
  • margin — based on costUSD + shippingCostUSD vs. recommendedPrice / observed prices
  • marketFit — based on countryContext + landscape evidence the product fits this market
  • demand — based on voice (real pain frequency) + trends (trajectory)
  • competition — inverse of saturation (saturated→low, untapped→high)
  • creative — based on angle confidence + grounding quality

${SYNTHESIS_TONE}

OUTPUT JSON
{
  "sellScore": <0-100>,
  "verdict": "go" | "test" | "risky" | "skip",
  "summary": "<2-3 sentences>",
  "confidenceLevel": "low" | "medium" | "high",
  "comparableProducts": [{ "name": "...", "why": "..." }],
  "pillars": { "margin": <0-100>, "marketFit": <0-100>, "demand": <0-100>, "competition": <0-100>, "creative": <0-100> },
  "topAngle": "<the strongest hook in one sentence>"
}`;
}
