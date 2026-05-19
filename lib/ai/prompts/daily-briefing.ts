import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { Niche, Product } from "@/types";

export type BriefingContext = {
  firstName: string;
  preferredCountry: string | null;
  preferredNiches: Niche[];
  experienceLevel: "beginner" | "intermediate" | "advanced" | null;
  daysSinceLastScan: number | null;
  recentScans: { name: string; verdict: string; sellScore: number }[];
  /** Platform-wide market signal for context (top scoring products). */
  topProducts: Pick<Product, "name" | "category" | "targetCountry" | "sellScore" | "verdict">[];
  marketVibe: "hot" | "active" | "steady" | "quiet";
};

/**
 * Build the prompt for the daily briefing. Long and intentional so the
 * output stays specific + warm + grounded in the user's actual context.
 */
export function buildDailyBriefingPrompt(ctx: BriefingContext): string {
  const country = ctx.preferredCountry ? COUNTRIES[ctx.preferredCountry] : null;
  const nicheLabels = ctx.preferredNiches.map((n) => NICHES[n]?.label ?? n).join(", ");

  const recentBlock = ctx.recentScans.length
    ? ctx.recentScans
        .slice(0, 5)
        .map(
          (s) => `  • ${s.name} — score ${s.sellScore}, verdict ${s.verdict}`,
        )
        .join("\n")
    : "  (no recent scans on record)";

  const topBlock = ctx.topProducts
    .slice(0, 6)
    .map(
      (p) =>
        `  • ${p.name} — ${NICHES[p.category as Niche]?.label ?? p.category} / ${COUNTRIES[p.targetCountry]?.name ?? p.targetCountry} — ${p.sellScore} ${p.verdict.toUpperCase()}`,
    )
    .join("\n");

  return `You are Wynner, a senior dropshipping market intelligence analyst writing a personal morning briefing for ${ctx.firstName}. Make it feel like a smart friend who actually pays attention — never a marketer.

USER CONTEXT
  Name: ${ctx.firstName}
  Preferred country: ${country ? `${country.name} (${country.code})` : "not set yet"}
  Preferred niches: ${nicheLabels || "not set yet"}
  Experience: ${ctx.experienceLevel ?? "unknown"}
  Days since last scan: ${ctx.daysSinceLastScan === null ? "never scanned" : ctx.daysSinceLastScan}
  Recent scans (most recent first):
${recentBlock}

MARKET CONTEXT
  Overall vibe today: ${ctx.marketVibe}
  Top-scoring products platform-wide right now:
${topBlock}

CONSTRAINTS
  • Use ${ctx.firstName}'s first name AT MOST ONCE across the whole briefing. Don't overuse it.
  • Be specific. Use real category names and country names where helpful. Use concrete percentages or numbers only if grounded in the data above — never invent stats.
  • No hype words: never use "massive", "huge", "game-changer", "next-level", "explode", "blow up", "incredible".
  • Conversational, warm, professional. Like a private analyst memo, not a marketing email.
  • Avoid exclamation marks. One per briefing max.

Output ONE JSON object with this exact shape:
{
  "paragraphs": [
    "<paragraph 1 — 1-2 sentences. What you're seeing in the market broadly today, anchored in the data above.>",
    "<paragraph 2 — 1-2 sentences. What this means for ${ctx.firstName} specifically, given their niches/country/history.>",
    "<paragraph 3 — 1-2 sentences. ONE concrete action to take today. Specific (a niche, a country, a comparison) — never generic like 'keep scanning'.>"
  ],
  "chips": [
    { "label": "<short label, max 30 chars>", "emoji": "<single emoji>", "action": "filter_niche" | "filter_country" | "open_scan" | "open_vault" | "info", "value": "<niche key OR country code OR omit for info/open_*>" },
    { "label": "...", "emoji": "...", "action": "...", "value": "..." },
    { "label": "...", "emoji": "...", "action": "...", "value": "..." }
  ]
}

Valid niche values: ${Object.keys(NICHES).join(", ")}
Valid country values (ISO-2): ${Object.keys(COUNTRIES).join(", ")}

EXAMPLE OF A STRONG BRIEFING (different product, different vibe — DO NOT COPY):
{
  "paragraphs": [
    "Wellness keeps leading the platform — five of today's top eight are posture or sleep adjacent.",
    "Your last two scans skewed kitchen, which feels off-cycle right now. Worth a sideways look.",
    "Worth trying today: a Standard scan on a posture or sleep-related product targeting Germany — the demand signal is climbing and your strongest historical win rate is wellness."
  ],
  "chips": [
    { "label": "Posture in DE", "emoji": "🔥", "action": "filter_niche", "value": "wellness" },
    { "label": "Germany watch", "emoji": "🇩🇪", "action": "filter_country", "value": "DE" },
    { "label": "Start a scan", "emoji": "✨", "action": "open_scan" }
  ]
}`;
}
