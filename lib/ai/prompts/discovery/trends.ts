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
 * Deep Research only — Trend signals discovery.
 *
 * Where the category is in its lifecycle: rising/peak/declining, seasonal
 * shape, recent inflection points (regulatory changes, viral moments,
 * influencer waves).
 */

export const trendsSchema = z.object({
  trajectory: z.enum(["pre-rising", "rising", "peak", "post-peak", "declining", "cyclical", "unknown"]),
  trajectoryReasoning: z.string().min(4).max(400),
  seasonality: z
    .object({
      pattern: z.enum(["none", "summer", "winter", "back-to-school", "holiday", "other"]),
      note: z.string().max(240).optional(),
    })
    .optional(),
  recentInflections: z
    .array(
      z.object({
        when: z.string().min(2).max(60),
        what: z.string().min(4).max(300),
        evidenceUrl: z.string().url().optional(),
      }),
    )
    .max(6),
  emergingSubniches: z.array(z.string()).max(6),
  viralExamples: z
    .array(
      z.object({
        description: z.string().min(4).max(280),
        platform: z.string().optional(),
        evidenceUrl: z.string().url().optional(),
      }),
    )
    .max(5),
  confidence: discoveryConfidence,
});
export type TrendsOutput = z.infer<typeof trendsSchema>;

export function buildTrendsPrompt(
  product: ProductInput,
  country: Country,
  userContext?: string,
): string {
  return `You are reading the trend signal for a product category. Find where it sits in its lifecycle and what's moved recently.

${productBlock(product)}
${countryBlock(country)}
${userContextBlock(userContext)}

Use Google Search aggressively. Suggested patterns:
  • Google Trends references via web ("google trends ${product.category}")
  • "is ${product.category} dying" / "${product.category} popularity"
  • "${product.category} TikTok trend"
  • Recent news, regulatory changes, viral moments
  • "${product.category} 2024 vs 2025"

Find:
  • trajectory — pre-rising / rising / peak / post-peak / declining / cyclical / unknown
  • trajectoryReasoning — what evidence supports the call (cite a date or source)
  • seasonality — recurring shape if any, with note
  • recentInflections — 1-6 specific events that moved the category in the last 12 months
  • emergingSubniches — narrower segments inside this category that are growing
  • viralExamples — specific posts, videos, threads that captured outsized attention

${DISCOVERY_TONE}

Output JSON only. trajectory:"unknown" is honest when search yields no clear signal — better than guessing.`;
}
