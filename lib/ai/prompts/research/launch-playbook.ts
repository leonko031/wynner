import {
  CONSTRAINTS,
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "./shared";
import type { Country } from "@/types";
import type { PricingStrategy } from "@/types/research";

export function buildLaunchPlaybookPrompt(
  product: ProductInput,
  country: Country,
  pricing: PricingStrategy | null,
  userContext?: string,
): string {
  const aov = pricing?.recommendedPrice ?? product.suggestedPriceUSD;

  return `You are Wynner, a paid-acquisition operator who's launched 200+ D2C SKUs. Design a tight 14-day launch playbook for this product in ${country.name}. Be brutally specific.

${productBlock(product)}
${countryBlock(country)}
${pricing ? `Recommended price: $${pricing.recommendedPrice}` : ""}
${userContextBlock(userContext)}

${CONSTRAINTS}

Framework
  • Days 1-3 = creative testing (5-7 hooks, $20-30/day each, optimize for CTR + thumbstop)
  • Days 4-7 = winner scaling (kill bottom 50%, 2× budget on top 20%)
  • Days 8-14 = retargeting + lookalikes + UGC infusion
  • Total budget should be reasonable for a single SKU launch at $${aov} ASP — typically $1,500–4,000 for a 14-day test.

Output JSON:
{
  "totalDays": 14,
  "dailyActions": [
    {
      "day": number,                 // 1-14
      "focus": string,               // 3-5 word theme — "Hook variety test", "Scale winners"
      "actions": string[],           // 2-6 concrete actions (verb-led: "Launch 5 hooks against Anna", "Kill ads under 1.2% CTR")
      "creativeCount": number,       // how many ad creatives are live this day
      "budgetSplit": string,         // 1 sentence: "$120 — 80% Meta / 20% TikTok"
      "kpis": string[]               // 1-4 things to check at end of day
    }
  ],                                 // exactly 14 entries, day 1 through 14
  "totalBudget": number,             // USD across all 14 days
  "expectedROAS": number,            // realistic blended ROAS by day 14 (most launches: 1.4-2.5)
  "confidenceLevel": "low" | "medium" | "high"
}`;
}
