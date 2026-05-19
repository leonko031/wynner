import {
  CONSTRAINTS,
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "./shared";
import type { Country } from "@/types";

export function buildCompetitorLandscapePrompt(
  product: ProductInput,
  country: Country,
  userContext?: string,
): string {
  return `You are Wynner, a competitive intelligence analyst. Map the competitive landscape for this product in ${country.name}.

${productBlock(product)}
${countryBlock(country)}
${userContextBlock(userContext)}

${CONSTRAINTS}

Identify how saturated this market is, what the dominant competitor archetypes look like, where they're priced, and crucially — where the gaps are.

Output JSON:
{
  "saturationScore": number,             // 0-100, where 0 = untapped, 100 = TikTok-flooded
  "saturationLevel": "untapped" | "emerging" | "competitive" | "saturated",
  "topAdvertiserArchetypes": [           // 2-4 distinct archetypes
    {
      "name": string,                    // e.g. "The Generic Drop-Shipper", "The Premium D2C Brand"
      "approach": string,                // 1-sentence summary of their strategy
      "strengths": string[],             // 1-4
      "weaknesses": string[]             // 1-4
    }
  ],
  "pricingBenchmarks": {                 // USD
    "lowEnd": number,
    "midRange": number,
    "premium": number
  },
  "marketGaps": string[],                // 1-5 — concrete openings a new entrant could exploit
  "confidenceLevel": "low" | "medium" | "high"
}

The marketGaps are the most valuable field — be specific. "Pet owners over 50 are underserved by current creatives" is good. "Better marketing" is useless.`;
}
