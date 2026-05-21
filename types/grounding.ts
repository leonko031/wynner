/**
 * Types for Gemini's Google Search grounding tool.
 *
 * When we run a grounded call, the model emits `groundingMetadata` alongside
 * the response. We normalize that into a clean shape the rest of the app
 * (UI + PDF) can render: a flat list of sources + the search queries that
 * were actually run + a per-text-span mapping back to source indices.
 *
 * Grounding adds ~$0.035/query and 5-15s of latency vs. an ungrounded call.
 * Every claim should carry source indices so the UI can render a citation.
 */
import { z } from "zod";

export const groundingSourceSchema = z.object({
  /** 0-based index — used by CitedValue.sources to point back here. */
  index: z.number().int().min(0),
  uri: z.string().url(),
  title: z.string(),
  /** Hostname only (e.g. "reddit.com"). UI uses this for favicon + grouping. */
  domain: z.string(),
  /** Optional snippet Gemini surfaced from the source. */
  snippet: z.string().optional(),
  /** ISO timestamp of when the search returned this source. */
  retrievedAt: z.string(),
});
export type GroundingSource = z.infer<typeof groundingSourceSchema>;

export const citedValueSchema = <T extends z.ZodTypeAny>(inner: T) =>
  z.object({
    value: inner,
    /** Indices into the report-level sources array. */
    sources: z.array(z.number().int().min(0)).max(20).default([]),
    confidence: z.enum(["low", "medium", "high"]).default("medium"),
  });
export type CitedValue<T> = {
  value: T;
  sources: number[];
  confidence: "low" | "medium" | "high";
};

/** Domain-bucketed source counts — drives the sources panel filter chips. */
export type SourceBucket = "reddit" | "amazon" | "news" | "forums" | "other";

export function bucketForDomain(domain: string): SourceBucket {
  const d = domain.toLowerCase();
  if (d.endsWith("reddit.com")) return "reddit";
  if (d.endsWith("amazon.com") || d.endsWith("amazon.co.uk") || d.includes("amazon.")) {
    return "amazon";
  }
  if (
    d.endsWith("nytimes.com") ||
    d.endsWith("bloomberg.com") ||
    d.endsWith("ft.com") ||
    d.endsWith("theverge.com") ||
    d.endsWith("techcrunch.com") ||
    d.endsWith("forbes.com") ||
    d.includes("news")
  ) {
    return "news";
  }
  if (
    d.includes("forum") ||
    d.endsWith("quora.com") ||
    d.endsWith("stackexchange.com") ||
    d.endsWith("stackoverflow.com") ||
    d.includes("community")
  ) {
    return "forums";
  }
  return "other";
}

/** Aggregate grounding quality 0-100 — drives the badge near the verdict. */
export function computeGroundingQuality(input: {
  sourceCount: number;
  queryCount: number;
  averageConfidence: "low" | "medium" | "high";
}): number {
  // Heuristic: bonus for source count + query diversity + average confidence.
  // Caps at 100.
  const conf = input.averageConfidence === "high" ? 1 : input.averageConfidence === "medium" ? 0.6 : 0.3;
  const sourceScore = Math.min(input.sourceCount / 40, 1); // 40+ sources → max
  const queryScore = Math.min(input.queryCount / 15, 1); // 15+ queries → max
  const composite = sourceScore * 0.5 + queryScore * 0.2 + conf * 0.3;
  return Math.round(composite * 100);
}

/** Friendly quality label for the badge. */
export function groundingQualityLabel(score: number): "low" | "medium" | "high" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/* -------------------------------------------------------------------------- */
/* Per-call metadata returned by geminiWithGrounding — consumed by the engine */
/* -------------------------------------------------------------------------- */

export type GroundedCallResult<T> = {
  data: T;
  sources: GroundingSource[];
  searchQueries: string[];
  /** Tokens consumed — used for admin cost reporting. null if SDK didn't expose. */
  tokens: { input: number | null; output: number | null };
  /** Wall-clock duration of the call. */
  durationMs: number;
  /** True when grounding was unavailable and we fell back to a plain call. */
  fellBackToUngrounded: boolean;
};
