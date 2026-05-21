import type { Country } from "@/types";
import {
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "@/lib/ai/prompts/research/shared";
import { SYNTHESIS_TONE, discoveryContextBlock, type DiscoveryBundle } from "./shared";

/**
 * Competition synthesis — Standard + Deep.
 *
 * Reads discovery.competitors + discovery.landscape and produces the
 * CompetitorLandscape shape the existing UI/PDF expects, but now grounded in
 * real observed brand activity rather than guesses.
 */
export function buildCompetitionPrompt(
  product: ProductInput,
  country: Country,
  discovery: DiscoveryBundle,
  userContext?: string,
): string {
  return `You are summarizing the competitive landscape into archetype-level intelligence the operator can act on. Read the real brand observations in discovery.competitors and landscape.topSellers — synthesize into 2-4 archetypes.

${productBlock(product)}
${countryBlock(country)}
${userContextBlock(userContext)}

${discoveryContextBlock(discovery)}

TASK
  • saturationScore (0-100) and saturationLevel — anchored to competitors.saturationVerdict
  • topAdvertiserArchetypes — 2-4 archetypes describing the kinds of players in this market.
    Each archetype:
      - name (e.g. "Premium-positioned D2C", "Bulk dropshipper", "Influencer-led brand")
      - approach (1 sentence)
      - strengths (1-4)
      - weaknesses (1-4)
    Group real brands from discovery into these archetypes — don't invent new players.
  • pricingBenchmarks — { lowEnd, midRange, premium } numbers anchored to real observed prices
  • marketGaps — 1-5 specific gaps observable in discovery, with source indices in sources[]
  • sources — array of source indices used

${SYNTHESIS_TONE}

OUTPUT JSON
{
  "saturationScore": <0-100>,
  "saturationLevel": "untapped" | "emerging" | "competitive" | "saturated",
  "topAdvertiserArchetypes": [
    { "name": "...", "approach": "...", "strengths": ["..."], "weaknesses": ["..."] }
  ],
  "pricingBenchmarks": { "lowEnd": <n>, "midRange": <n>, "premium": <n> },
  "marketGaps": ["..."],
  "confidenceLevel": "low" | "medium" | "high",
  "sources": [<indices>]
}`;
}
