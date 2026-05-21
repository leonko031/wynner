import { z } from "zod";
import type { Country } from "@/types";
import {
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "@/lib/ai/prompts/research/shared";
import {
  DISCOVERY_TONE,
  discoveryConfidence,
  observedBrandSchema,
} from "./shared";

/**
 * Standard + Deep — Competitor intelligence discovery.
 *
 * Specific real brands currently selling in this space, with their ad
 * angles, positioning, and observable price/MOQ data.
 */

export const competitorsSchema = z.object({
  topAdvertisers: z
    .array(
      observedBrandSchema.extend({
        adAngle: z.string().min(4).max(240).optional(),
        platformPresence: z.array(z.string()).max(5).optional(),
        estimatedAdSpend: z.enum(["low", "medium", "high", "unknown"]).optional(),
      }),
    )
    .max(8),
  pricingObservations: z
    .array(
      z.object({
        brand: z.string(),
        productName: z.string().optional(),
        price: z.string(),
        evidenceUrl: z.string().url().optional(),
      }),
    )
    .max(10),
  marketGaps: z.array(z.string()).max(6),
  saturationVerdict: z.enum(["untapped", "emerging", "competitive", "saturated"]),
  notesOnVerdict: z.string().min(4).max(400),
  confidence: discoveryConfidence,
});
export type CompetitorsOutput = z.infer<typeof competitorsSchema>;

export function buildCompetitorsPrompt(
  product: ProductInput,
  country: Country,
  userContext?: string,
): string {
  return `You are mapping the active competitive landscape for a product category in a specific country. Focus on REAL brands you can name, with REAL ad angles you can describe.

${productBlock(product)}
${countryBlock(country)}
${userContextBlock(userContext)}

Use Google Search aggressively. Suggested patterns:
  • Brand discovery: "${product.category} brand ${country.name}", "${product.name} alternatives"
  • Ad-library style searches: TikTok ad observations, Facebook ad library URLs via web search
  • DTC players: "${product.category} dropshipping ${country.name}", landing-page reviews
  • Price discovery: visit storefronts when search results expose them

For each top advertiser:
  • Real brand name (no invention)
  • Positioning (the hook they lead with)
  • Ad angle if observable (e.g. "demo + 3-step transformation", "celebrity testimonial")
  • Platform presence (TikTok, Meta, Google, own store)
  • Estimated ad spend: low/medium/high based on visible presence

Synthesize:
  • pricingObservations — specific brand × product × price snapshots, each with evidenceUrl
  • marketGaps — observable gaps no current player addresses well
  • saturationVerdict — untapped / emerging / competitive / saturated, with notesOnVerdict explaining why

${DISCOVERY_TONE}

Output JSON only. Brand names MUST be observable in your search results. If only 2 brands are credibly observable, return 2 with confidence:"low" — never pad with invented brands.`;
}
