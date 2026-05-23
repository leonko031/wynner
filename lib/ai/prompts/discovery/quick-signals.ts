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
  realQuoteSchema,
} from "./shared";

/**
 * Quick Scan — single combined discovery call.
 *
 * One efficient grounded pass that pulls the most important signals in 4-6
 * searches. Used only by Quick Scan; Standard + Deep run the dedicated
 * landscape/voice/competitor prompts in parallel instead.
 */

export const quickSignalsSchema = z
  .object({
    similarProducts: z
      .array(
        z.object({
          name: z.string(),
          price: z.string().optional(),
          positioning: z.string().min(4).max(180),
          evidenceUrl: z.string().url().optional(),
        }),
      )
      .max(5)
      .default([]),
    customerQuotes: z.array(realQuoteSchema).max(8).default([]),
    competitorBrands: z.array(observedBrandSchema).max(4).default([]),
    trendSignal: z
      .object({
        direction: z.enum(["rising", "flat", "declining", "unknown"]),
        note: z.string().min(4).max(200),
      })
      .optional()
      .default({ direction: "unknown", note: "No clear trend signal." }),
    confidence: discoveryConfidence.default("low"),
  })
  // Tolerate extra metadata fields Gemini may add — we won't error on
  // unrecognized keys; we just ignore them.
  .passthrough();
export type QuickSignalsOutput = z.infer<typeof quickSignalsSchema>;

export function buildQuickSignalsPrompt(
  product: ProductInput,
  country: Country,
  userContext?: string,
): string {
  return `You are a fast market-research analyst. In one efficient grounded pass, gather the most important signals about a product for a specific country.

${productBlock(product)}
${countryBlock(country)}
${userContextBlock(userContext)}

Use Google Search EFFICIENTLY. Run 4-6 searches max. Suggested patterns:
  • "${product.name} review" + ${country.name}
  • "best ${product.category}" + reddit OR amazon
  • Competitor brand discovery: "${product.category} brand ${country.name}"
  • Trend check: "${product.category} popularity 2025" or Google Trends mentions

Find:
  1. Top 3 similar products being sold right now (real brand/SKU names + 1-sentence positioning + price band if visible)
  2. 5 real customer quotes from reviews or forums — VERBATIM, with sourceUrl
  3. 2-3 most active competitor brands (real names observable in search)
  4. 1-line trend signal: rising / flat / declining / unknown — with reasoning

${DISCOVERY_TONE}

Output JSON only — no preamble. confidence:"low" is acceptable if you found 3-4 signals; "high" only if you found 6+ across all four categories.

This is a QUICK pass. Quality > completeness. Better to return fewer real findings than 10 fabricated ones.`;
}
