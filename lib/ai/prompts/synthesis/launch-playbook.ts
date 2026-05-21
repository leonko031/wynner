import type { Country } from "@/types";
import type { PricingStrategy } from "@/types/research";
import {
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "@/lib/ai/prompts/research/shared";
import { SYNTHESIS_TONE, discoveryContextBlock, type DiscoveryBundle } from "./shared";

/**
 * 14-day launch playbook synthesis — Deep only.
 *
 * Day-by-day actions, creative counts, budget split, KPIs. Each day's
 * actions reference real signals from discovery where appropriate.
 */
export function buildLaunchPlaybookPrompt(
  product: ProductInput,
  country: Country,
  discovery: DiscoveryBundle,
  pricing: PricingStrategy | null,
  userContext?: string,
): string {
  const priceBlock = pricing
    ? `\nPricing context (already determined): recommended $${pricing.recommendedPrice}, anchor $${pricing.anchorPrice}.`
    : "";

  return `You are a paid-media strategist building a 14-day launch playbook for an operator about to ship this product. Be specific and concrete — vague playbooks waste days of test budget.

${productBlock(product)}
${countryBlock(country)}${priceBlock}
${userContextBlock(userContext)}

${discoveryContextBlock(discovery)}

TASK
Generate 14 daily actions. Across the 14 days:
  • Days 1-3: Creative testing (5+ creatives/day, broad audience, $80-150/day)
  • Days 4-7: Iterate on winning creatives, kill losers, narrow audience
  • Days 8-11: Scale winners, introduce retargeting
  • Days 12-14: Lookalike + scale + brand-search backstop

Each day:
  • focus — 2-4 word headline (e.g. "Creative testing wave 1")
  • actions — 2-6 concrete bullets the operator can do today
  • creativeCount — number of NEW creatives to ship that day
  • budgetSplit — "$X — Y% Meta / Z% TikTok" or similar, anchored to country's topPlatform
  • kpis — 1-4 metrics to watch that day
  • sources — indices from discovery you referenced (often [])

Use real signals from discovery where they change the plan:
  • If voice surfaced specific objections → schedule a day to test creatives addressing those
  • If competitors.saturationVerdict is "saturated" → bias toward retargeting and brand-search earlier
  • If trends.trajectory is "rising" → push aggressive scale earlier

totalBudget = sum of daily budgets (estimate from budgetSplit strings)
expectedROAS = grounded estimate (1.4-3.0 typical for ${country.name})

${SYNTHESIS_TONE}

OUTPUT JSON
{
  "totalDays": 14,
  "dailyActions": [
    {
      "day": 1,
      "focus": "...",
      "actions": ["..."],
      "creativeCount": <n>,
      "budgetSplit": "...",
      "kpis": ["..."],
      "sources": [<indices>]
    }
    // ...14 entries
  ],
  "totalBudget": <n>,
  "expectedROAS": <n>,
  "confidenceLevel": "low" | "medium" | "high"
}`;
}
