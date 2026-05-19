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

export const dailyBriefingSchema = z.object({
  paragraphs: z.array(z.string().min(10).max(600)).length(3),
  chips: z.array(briefingChipSchema).length(3),
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
  };
}
