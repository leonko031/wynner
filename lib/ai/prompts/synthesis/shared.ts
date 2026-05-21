import type { QuickSignalsOutput } from "@/lib/ai/prompts/discovery/quick-signals";
import type { LandscapeOutput } from "@/lib/ai/prompts/discovery/landscape";
import type { VoiceOutput } from "@/lib/ai/prompts/discovery/voice";
import type { CompetitorsOutput } from "@/lib/ai/prompts/discovery/competitors";
import type { TrendsOutput } from "@/lib/ai/prompts/discovery/trends";
import type { CountryContextOutput } from "@/lib/ai/prompts/discovery/country-context";
import type { GroundingSource } from "@/types/grounding";

/**
 * Shape of the discovery output passed to every synthesis prompt. Each tier
 * only populates the fields it ran — synthesis prompts must handle missing
 * fields gracefully.
 */
export type DiscoveryBundle = {
  quickSignals?: QuickSignalsOutput;
  landscape?: LandscapeOutput;
  voice?: VoiceOutput;
  competitors?: CompetitorsOutput;
  trends?: TrendsOutput;
  countryContext?: CountryContextOutput;
  /** All sources discovered across phase-1 calls (deduplicated, index-stable). */
  sources: GroundingSource[];
};

export const SYNTHESIS_TONE = `Voice rules
  • Specific over generic. Real numbers, real product names, real cited evidence.
  • Reference source indices from the provided sources array when making concrete claims.
    Example: "Reddit thread complaints about straps loosening over time [3]" where 3 is the index.
  • Don't invent. If a claim isn't grounded in discovery, set confidence:"low" or omit it.
  • No hype: skip "explode", "massive", "next-level", "incredible", "game-changing".
  • You are a senior creative director / strategist, not a marketer.`;

/** Compact JSON-friendly serializer for the discovery bundle. */
export function discoveryContextBlock(bundle: DiscoveryBundle): string {
  const parts: string[] = [];
  parts.push("DISCOVERY OUTPUT (real grounded signals you must build on)");

  if (bundle.quickSignals) {
    parts.push("\nQuick signals:");
    parts.push(JSON.stringify(bundle.quickSignals, null, 2));
  }
  if (bundle.landscape) {
    parts.push("\nProduct landscape:");
    parts.push(JSON.stringify(bundle.landscape, null, 2));
  }
  if (bundle.voice) {
    parts.push("\nCustomer voice:");
    parts.push(JSON.stringify(bundle.voice, null, 2));
  }
  if (bundle.competitors) {
    parts.push("\nCompetitor intelligence:");
    parts.push(JSON.stringify(bundle.competitors, null, 2));
  }
  if (bundle.trends) {
    parts.push("\nTrend signals:");
    parts.push(JSON.stringify(bundle.trends, null, 2));
  }
  if (bundle.countryContext) {
    parts.push("\nCountry context:");
    parts.push(JSON.stringify(bundle.countryContext, null, 2));
  }

  parts.push(
    `\nSources (use these indices in your sources[] arrays):`,
    bundle.sources
      .map((s) => `  [${s.index}] ${s.domain} — ${s.title}`)
      .join("\n") || "  (no sources — discovery fell back to ungrounded)",
  );

  return parts.join("\n");
}
