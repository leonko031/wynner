import { z } from "zod";
import type { Country } from "@/types";
import {
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "@/lib/ai/prompts/research/shared";
import { DISCOVERY_TONE, discoveryConfidence, realQuoteSchema } from "./shared";

/**
 * Standard + Deep — Customer voice discovery.
 *
 * Real verbatim quotes from forums, reviews, social. Pain points, objections,
 * language patterns, community slang. This is the source-of-truth that hook
 * angles get grounded in downstream.
 */

export const voiceSchema = z
  .object({
    topPains: z
      .array(
        z.object({
          pain: z.string().min(2).max(200),
          frequency: z.enum(["sporadic", "common", "dominant"]).default("common"),
        }),
      )
      .max(8)
      .default([]),
    topObjections: z.array(z.string()).max(6).default([]),
    topDesiredOutcomes: z.array(z.string()).max(5).default([]),
    languagePatterns: z.array(z.string()).max(8).default([]),
    realQuotes: z.array(realQuoteSchema).max(12).default([]),
    sourceSurfaces: z
      .array(
        z.object({
          type: z.enum(["reddit", "amazon", "forum", "youtube", "tiktok", "blog", "other"]),
          url: z.string().url().optional(),
          note: z.string().max(200).optional(),
        }),
      )
      .max(10)
      .default([]),
    confidence: discoveryConfidence.default("low"),
  })
  .passthrough();
export type VoiceOutput = z.infer<typeof voiceSchema>;

export function buildVoicePrompt(
  product: ProductInput,
  country: Country,
  userContext?: string,
): string {
  return `You are researching how REAL customers talk about a product category. Your output will be used to ground ad-hook angles in real customer language. The hooks live or die by the authenticity of these quotes.

${productBlock(product)}
${countryBlock(country)}
${userContextBlock(userContext)}

Use Google Search aggressively. Suggested patterns:
  • "reddit ${product.category} review"
  • "${product.name} amazon reviews"
  • "${product.category} complaints" or "doesn't work"
  • "${product.category} ${country.name}" forums
  • Reddit subreddits relevant to the niche
  • YouTube comment surfaces via web search ("youtube comments ${product.category}")

For each quote you pull:
  • VERBATIM — copy the exact wording, even the typos and slang
  • Attach the source URL
  • Note sentiment (positive / negative / mixed / neutral)
  • If you can't link a URL for it, don't include it. Better fewer quotes than fake quotes.

Synthesize:
  • topPains — recurring pain points. Mark frequency: dominant > common > sporadic
  • topObjections — what stops people buying (price, trust, ineffective, etc.)
  • topDesiredOutcomes — what they want the product to actually deliver
  • languagePatterns — words/phrases/slang that appear repeatedly (these will be embedded in hook copy)
  • sourceSurfaces — which surfaces yielded the most signal (so the operator knows where this came from)

${DISCOVERY_TONE}

Output JSON only. NEVER fabricate a quote. If a section is thin, return fewer items with confidence:"low". This data drives the centerpiece of the report — quality matters more than volume.`;
}
