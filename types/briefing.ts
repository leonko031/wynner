import { z } from "zod";

/**
 * Daily briefing — what Gemini returns + what we render on the dashboard.
 *
 * `paragraphs` is exactly 3 items (intro, personalized, action recommendation).
 * `chips` is exactly 3 short interactive pills.
 */

export const briefingChipSchema = z.object({
  /** Short label, displayed as the chip's main text. */
  label: z.string().min(1).max(48),
  /** Optional emoji prefix (e.g. "🔥"). */
  emoji: z.string().max(4).optional(),
  /**
   * Action the chip routes to. Constrained to known patterns so we never
   * inject random URLs into Link components.
   */
  action: z.enum(["filter_niche", "filter_country", "open_scan", "open_vault", "info"]),
  /** Value associated with the action (niche key, country code, etc.). */
  value: z.string().optional(),
});
export type BriefingChip = z.infer<typeof briefingChipSchema>;

/**
 * Editorial recommendation — the "next move" card at the bottom of the
 * dashboard. Generated alongside the briefing so we use the same cache key.
 */
export const editorialRecommendationSchema = z.object({
  /** Magazine-headline-style line (e.g. "Try a Standard scan on Germany wellness"). */
  headline: z.string().min(8).max(140),
  /** 1-paragraph rationale, ~3 sentences. */
  rationale: z.string().min(20).max(600),
  /** Action type — drives the visual on the right of the card. */
  actionType: z.enum(["scan", "deepResearch", "compare", "vault"]),
  /** Free-form context for the visual (niche/country/products etc.). */
  actionContext: z.string().max(160).optional(),
});
export type EditorialRecommendation = z.infer<typeof editorialRecommendationSchema>;

export const dailyBriefingSchema = z.object({
  paragraphs: z.array(z.string().min(10).max(600)).length(3),
  chips: z.array(briefingChipSchema).length(3),
  /** Editorial extensions used by the cinematic dashboard. Optional for back-compat. */
  editorialTitle: z.string().min(4).max(80).optional(),
  openingHook: z.string().min(8).max(160).optional(),
  subHeadline: z.string().min(8).max(160).optional(),
  recommendation: editorialRecommendationSchema.optional(),
});
export type DailyBriefing = z.infer<typeof dailyBriefingSchema>;

export interface BriefingRow extends DailyBriefing {
  user_id: string;
  /** YYYY-MM-DD */
  date: string;
  created_at: string;
}

/**
 * The graceful fallback used when Gemini errors / validates incorrectly /
 * the key is missing. Always renders something sensible.
 */
export function fallbackBriefing(firstName: string): DailyBriefing {
  return {
    paragraphs: [
      `Quiet open today — no major shake-ups across the platform's tracked niches.`,
      `For you specifically, ${firstName}, this is a good day to scan a couple of candidates you've been sitting on. A small, deliberate pass beats a long break.`,
      `Worth trying today: start with a Standard scan on a product in your strongest category. It's the lowest-friction way to surface a winner.`,
    ],
    chips: [
      { label: "Run a scan", emoji: "✨", action: "open_scan" },
      { label: "Browse vault", emoji: "📚", action: "open_vault" },
      { label: "Steady market", emoji: "🌤️", action: "info" },
    ],
    editorialTitle: "A quiet morning to scan",
    openingHook: "A steady market — the right kind of day to be deliberate.",
    subHeadline: "Generated for you in the last 24 hours",
    recommendation: {
      headline: "Score one product you've been sitting on",
      rationale:
        "Your strongest signal right now is the one you haven't tested yet. A single Standard scan beats hours of scrolling for inspiration.",
      actionType: "scan",
      actionContext: "standard",
    },
  };
}
