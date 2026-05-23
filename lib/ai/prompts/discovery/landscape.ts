import { z } from "zod";
import type { Country } from "@/types";
import {
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "@/lib/ai/prompts/research/shared";
import { DISCOVERY_TONE, discoveryConfidence } from "./shared";

/**
 * Standard + Deep — Product landscape discovery.
 *
 * What's being sold in this category right now, who's selling it, what
 * positioning angles are saturated vs. open, what price bands exist.
 */

export const landscapeSchema = z
  .object({
    categoryFraming: z.string().min(4).max(400).optional().default(""),
    topSellers: z
      .array(
        z.object({
          name: z.string(),
          positioning: z.string().max(240).default(""),
          priceBand: z.string().optional(),
          platforms: z.array(z.string()).max(5).optional(),
          evidenceUrl: z.string().url().optional(),
        }),
      )
      .max(8)
      .default([]),
    saturatedAngles: z.array(z.string()).max(8).default([]),
    openAngles: z.array(z.string()).max(8).default([]),
    priceBands: z
      .object({
        low: z.string().optional(),
        mid: z.string().optional(),
        premium: z.string().optional(),
      })
      .optional()
      .default({}),
    noteworthyObservations: z.array(z.string()).max(6).default([]),
    confidence: discoveryConfidence.default("low"),
  })
  .passthrough();
export type LandscapeOutput = z.infer<typeof landscapeSchema>;

export function buildLandscapePrompt(
  product: ProductInput,
  country: Country,
  userContext?: string,
): string {
  return `You are a market-research analyst mapping the competitive landscape for a product category in a specific country. Goal: understand what's being sold today, who's winning, and what positioning is open.

${productBlock(product)}
${countryBlock(country)}
${userContextBlock(userContext)}

Use Google Search aggressively. Suggested patterns:
  • Top sellers: "best ${product.category} ${country.name} 2025"
  • Storefronts: Amazon, eBay, niche DTC stores
  • Price discovery: "${product.name} price ${country.currency}"
  • Positioning angles: search top-seller landing pages — note their primary hook
  • Trend pages, "best of" listicles, retailer category pages

For each top seller:
  • Real brand/SKU name (no invention — must be observable)
  • 1-2 sentence positioning (the hook they lead with)
  • Price band if visible
  • Platforms where they appear (Amazon, TikTok Shop, own store, etc.)

Then synthesize:
  • saturatedAngles — positioning angles you saw repeatedly (e.g. "premium ergonomic", "celebrity-endorsed", "scientific backing")
  • openAngles — angles you didn't see saturated (or saw weakly) that this product could own
  • priceBands — low/mid/premium with $ ranges (use the country's currency if relevant)
  • noteworthyObservations — surprises, contradictions, gaps the operator should know

${DISCOVERY_TONE}

Output JSON only. confidence:"high" means 5+ top sellers found with real names and pricing; "low" means you struggled to find observable evidence.`;
}
