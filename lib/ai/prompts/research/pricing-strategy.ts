import {
  CONSTRAINTS,
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "./shared";
import type { Country } from "@/types";
import type { CompetitorLandscape } from "@/types/research";

export function buildPricingStrategyPrompt(
  product: ProductInput,
  country: Country,
  competitors: CompetitorLandscape | null,
  userContext?: string,
): string {
  const compBlock = competitors
    ? `Competitor pricing (USD):
  • Low end: $${competitors.pricingBenchmarks.lowEnd}
  • Mid range: $${competitors.pricingBenchmarks.midRange}
  • Premium: $${competitors.pricingBenchmarks.premium}`
    : "";

  return `You are Wynner, a pricing strategist for D2C e-commerce. Design a 3-tier pricing ladder that maximizes ASP while keeping conversion rate healthy.

${productBlock(product)}
${countryBlock(country)}
${compBlock}
${userContextBlock(userContext)}

${CONSTRAINTS}

Rules
  • All prices in USD. Tiers should be roughly entry ≈ 0.85× the popular, premium ≈ 1.6×.
  • The "popular" tier must be the one you'd actively push in ads.
  • Use anchor pricing — anchorPrice should be the visible struck-through price (typically ~1.4-1.7× the recommendedPrice).
  • Country AOV is €${country.avgAOV} — premium tier should not exceed 2× the AOV unless the product clearly warrants it.

Output JSON:
{
  "recommendedPrice": number,            // the price you'd actually charge for the "popular" tier
  "anchorPrice": number,                 // the struck-through "compare-at" price
  "priceTiers": [                        // exactly 3, in order: entry, popular, premium
    {
      "label": "entry" | "popular" | "premium",
      "price": number,
      "includes": string[],              // 1-5 concrete inclusions ("single unit", "free shipping")
      "who": string                      // 1 sentence — who this tier is for
    }
  ],
  "bundleSuggestions": string[],         // 1-4 — "Buy 2 get 1 free", "Add-on care kit at $12"
  "priceJustification": string,          // 2-3 sentences explaining the strategy
  "confidenceLevel": "low" | "medium" | "high"
}`;
}
