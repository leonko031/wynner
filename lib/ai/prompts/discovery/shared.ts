import { z } from "zod";

/**
 * Common schema primitives shared across discovery prompts. Every discovery
 * output is grounded in real web search results — the schemas reflect that:
 * every meaningful claim carries a source URL pulled from grounding metadata.
 */

/**
 * Discovery confidence — we accept "unknown" as well because grounded calls
 * may legitimately have nothing to say about a question. Downstream we treat
 * "unknown" the same as "low" so existing UI doesn't have to special-case.
 */
export const discoveryConfidence = z.enum(["low", "medium", "high", "unknown"]);

export const realQuoteSchema = z.object({
  quote: z.string().min(4).max(400),
  /** Source URL — must be a real result from Google search, not made up. */
  sourceUrl: z.string().url().optional(),
  context: z.string().max(200).optional(),
  sentiment: z.enum(["positive", "negative", "mixed", "neutral"]).default("neutral"),
});
export type DiscoveryQuote = z.infer<typeof realQuoteSchema>;

export const observedBrandSchema = z.object({
  name: z.string().min(1).max(80),
  /** What they do / positioning in 1 short sentence. */
  positioning: z.string().min(4).max(200),
  pricingNote: z.string().max(120).optional(),
  evidenceUrl: z.string().url().optional(),
});
export type ObservedBrand = z.infer<typeof observedBrandSchema>;

export const DISCOVERY_TONE = `Voice rules
  • Sound like a research analyst, not a marketer. Specific, terse, observational.
  • NEVER invent quotes, brand names, prices, or URLs. Everything must be observable in the search results you ran.
  • If real data is sparse, return less. confidence:"low" with 2 sourced findings beats confidence:"high" with 8 made-up ones.
  • Avoid hype words: "explode", "massive", "game-changing", "next-level", "incredible".`;
