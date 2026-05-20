import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { Niche, Product } from "@/types";

export type EditorialRecommendationContext = {
  firstName: string;
  scanCount: number;
  favoriteCount: number;
  hasCompared: boolean;
  hasUsedDeepResearch: boolean;
  weeklyScans: number;
  topProductName: string | null;
  preferredNiches: Niche[];
  preferredCountry: string | null;
  recentScans: { name: string; verdict: string; sellScore: number }[];
  topProducts: Pick<Product, "name" | "category" | "targetCountry" | "sellScore">[];
};

/**
 * Build the prompt for the editorial "Next Move" card. Returns ONE specific
 * tactical action for the next 24 hours, framed as a single decisive
 * editorial line.
 *
 * Cached daily alongside the briefing.
 */
export function buildEditorialRecommendationPrompt(
  ctx: EditorialRecommendationContext,
): string {
  const country = ctx.preferredCountry ? COUNTRIES[ctx.preferredCountry] : null;
  const nicheLabels = ctx.preferredNiches.map((n) => NICHES[n]?.label ?? n).join(", ");
  const recentBlock = ctx.recentScans.length
    ? ctx.recentScans
        .slice(0, 5)
        .map((s) => `  • ${s.name} — ${s.sellScore} ${s.verdict.toUpperCase()}`)
        .join("\n")
    : "  (no recent scans)";
  const topBlock = ctx.topProducts
    .slice(0, 4)
    .map(
      (p) =>
        `  • ${p.name} — ${NICHES[p.category as Niche]?.label ?? p.category} / ${COUNTRIES[p.targetCountry]?.name ?? p.targetCountry} — ${p.sellScore}`,
    )
    .join("\n");

  return `You are Wynner, recommending exactly ONE specific action to operator ${ctx.firstName} for the next 24 hours. Frame it as a single decisive editorial line — the kind a senior partner would deliver in a quiet, confident voice.

OPERATOR STATE
  Total scans: ${ctx.scanCount}
  Favorites kept: ${ctx.favoriteCount}
  Has compared products: ${ctx.hasCompared ? "yes" : "no"}
  Has used Deep Research: ${ctx.hasUsedDeepResearch ? "yes" : "no"}
  Scans this week: ${ctx.weeklyScans}
  Top product in vault: ${ctx.topProductName ?? "(none)"}
  Preferred niches: ${nicheLabels || "(unset)"}
  Preferred country: ${country ? country.name : "(unset)"}
  Recent scans:
${recentBlock}

PLATFORM SIGNAL
  Top products platform-wide:
${topBlock}

ACTION TYPES (you MUST pick exactly one):
  • "scan"          — run a new product scan. Use when the operator should be discovering, not analyzing existing scans.
  • "deepResearch"  — run a Deep Research on an existing product. Use when they've scored something promising but haven't gone deep.
  • "compare"       — open the comparison view with specific products. Use when they have favorites/high-scoring picks but haven't yet picked a winner.
  • "vault"         — revisit existing scored products. Use when there's an under-acted-on winner already in their library.

VOICE RULES
  • Avoid hype: never "huge", "massive", "incredible", "game-changing", "amazing", "exciting".
  • Headline is editorial — 6-14 words, declarative, never starts with "Try" or "Check".
  • Rationale is 2-3 short sentences. Specific. References a real product/niche/country/number from the data above when possible.
  • Never generic ("explore more", "keep scanning"). Always pointed.

OUTPUT — ONE JSON OBJECT
{
  "headline": "<the decisive editorial line, 6-14 words>",
  "rationale": "<2-3 sentences. Specific. Cite a name, a number, a niche when possible.>",
  "actionType": "scan" | "deepResearch" | "compare" | "vault",
  "actionContext": "<optional, max 150 chars — free-form context the UI can show as a sub-line. e.g. 'posture · Germany' or 'Compare your top 3 wellness picks'.>"
}

EXAMPLES (different operators — DO NOT COPY):
{
  "headline": "Score one wellness adjacency in Germany today.",
  "rationale": "Your last three wellness picks all cleared 78. Germany's demand signal in posture has climbed twelve points this week. A single Standard scan turns this from a pattern into a decision.",
  "actionType": "scan",
  "actionContext": "wellness · Germany"
}
{
  "headline": "Compare your two highest-scoring picks now.",
  "rationale": "You've got a 84 and an 82 sitting side by side in your vault, both untested. The comparison view shows you exactly which one ships first.",
  "actionType": "compare",
  "actionContext": "top vault scores"
}`;
}
