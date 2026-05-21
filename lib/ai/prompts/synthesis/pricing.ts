import type { Country } from "@/types";
import {
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "@/lib/ai/prompts/research/shared";
import { SYNTHESIS_TONE, discoveryContextBlock, type DiscoveryBundle } from "./shared";

/**
 * Pricing strategy synthesis — Standard + Deep.
 *
 * Grounded in:
 *   • landscape.priceBands (real observed bands)
 *   • landscape.topSellers prices
 *   • competitors.pricingObservations (specific brand × price evidence)
 *   • country AOV from countryBlock
 *
 * Returns recommended price + anchor + 3 tiers + bundle suggestions.
 */
export function buildPricingPrompt(
  product: ProductInput,
  country: Country,
  discovery: DiscoveryBundle,
  userContext?: string,
): string {
  return `You are a direct-response pricing strategist. Read the discovery signals and recommend a price ladder that gives the operator a defensible position in this market.

${productBlock(product)}
${countryBlock(country)}
${userContextBlock(userContext)}

${discoveryContextBlock(discovery)}

TASK
Recommend a pricing strategy:
  • recommendedPrice — the operator's primary SKU price for the "popular" tier
  • anchorPrice — a higher price the recommended one references (usually shown crossed out)
  • priceTiers — exactly 3 tiers: entry / popular / premium, each with what's included and who it's for
  • bundleSuggestions — 1-4 bundle SKUs that lift AOV (be specific: "Buy 2 get the third free", not "consider bundles")
  • priceJustification — 2-3 sentences explaining the recommendation, anchored to real observed prices

Critical:
  • Reference real observed prices from landscape.topSellers + competitors.pricingObservations
  • Match the country's AOV and cardTrust/codPreference (German buyers are price-sensitive on the upper tier; US tolerates premium more)
  • Honest pricing — don't recommend a price the cost+shipping can't support

${SYNTHESIS_TONE}

OUTPUT JSON
{
  "recommendedPrice": <number>,
  "anchorPrice": <number>,
  "priceTiers": [
    { "label": "entry", "price": <n>, "includes": ["..."], "who": "..." },
    { "label": "popular", "price": <n>, "includes": ["..."], "who": "..." },
    { "label": "premium", "price": <n>, "includes": ["..."], "who": "..." }
  ],
  "bundleSuggestions": ["..."],
  "priceJustification": "<2-3 sentences with [source indices]>",
  "confidenceLevel": "low" | "medium" | "high",
  "sources": [<source indices>]
}`;
}
