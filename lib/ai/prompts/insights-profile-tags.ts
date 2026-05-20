import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { CompactScan } from "@/types/insights";

export type ProfileTagsContext = {
  firstName: string;
  scans: CompactScan[];
  /** Total scans all time (the `scans` array may be sampled). */
  totalScans: number;
  /** Avg sellScore across the user's history. */
  avgScore: number;
  /** % of verdicts in GO+TEST. */
  winRate: number;
};

/**
 * Compress the scan history into a short profile snapshot Gemini Flash
 * can riff on. Returns 2-4 short "self-portrait" tags.
 */
export function buildProfileTagsPrompt(ctx: ProfileTagsContext): string {
  // Tally niches & countries
  const nicheCount = new Map<string, number>();
  const countryCount = new Map<string, number>();
  for (const s of ctx.scans) {
    nicheCount.set(s.niche, (nicheCount.get(s.niche) ?? 0) + 1);
    countryCount.set(s.country, (countryCount.get(s.country) ?? 0) + 1);
  }
  const topNiches = [...nicheCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, c]) => `${NICHES[k as keyof typeof NICHES]?.label ?? k} (${c})`)
    .join(", ");
  const topCountries = [...countryCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, c]) => `${COUNTRIES[k]?.name ?? k} (${c})`)
    .join(", ");

  // Verdict mix
  const verdictMap = { go: 0, test: 0, risky: 0, skip: 0 };
  for (const s of ctx.scans) {
    const v = (s.verdict ?? "").toLowerCase();
    if (v in verdictMap) verdictMap[v as keyof typeof verdictMap]++;
  }
  const pctGo =
    ctx.scans.length === 0
      ? 0
      : Math.round((verdictMap.go / ctx.scans.length) * 100);
  const pctSkip =
    ctx.scans.length === 0
      ? 0
      : Math.round((verdictMap.skip / ctx.scans.length) * 100);

  return `You are Wynner, generating 2-4 short "self-portrait" tags for an operator named ${ctx.firstName} based on their scanning history. Each tag is a tiny label that captures something true and specific about how they scan. Think of these like dating-profile tags — punchy, observational, never generic.

OPERATOR DATA
  Total scans (all time): ${ctx.totalScans}
  Average sell-score: ${ctx.avgScore}
  Win rate (GO+TEST): ${Math.round(ctx.winRate * 100)}%
  Top niches: ${topNiches || "(none)"}
  Top countries: ${topCountries || "(none)"}
  Verdict mix: ${pctGo}% GO, ${pctSkip}% SKIP
  Niche diversity: ${nicheCount.size} distinct
  Country diversity: ${countryCount.size} distinct

TAG KINDS (you must include each kind that applies, in this order):
  • "niche"      — niche affinity. Examples: "Wellness specialist", "Multi-niche scout", "Pet-niche operator"
  • "country"    — country focus. Examples: "Germany-focused", "DACH operator", "Multi-market scout"
  • "pickiness"  — based on the verdict mix. Examples: "Selective scorer" (mostly TEST/SKIP), "Optimistic scorer" (lots of GO), "Balanced caller"
  • "pace"      — based on volume + recency. Examples: "Daily operator", "Weekly researcher", "Burst scanner"

CONSTRAINTS
  • Each label is at most 30 characters. No hashtags, no emoji inside the label string.
  • Be honest — if they only have 3 scans, say "Just getting started" instead of inflating.
  • Tone: warm, observational, mildly clever. Like a friend who's been paying attention.

Output ONE JSON object with this exact shape:
{
  "tags": [
    { "kind": "niche", "label": "<niche affinity>", "emoji": "<optional single emoji>" },
    { "kind": "country", "label": "<country focus>", "emoji": "<optional>" },
    { "kind": "pickiness", "label": "<scoring style>", "emoji": "<optional>" },
    { "kind": "pace", "label": "<pace>", "emoji": "<optional>" }
  ]
}

EXAMPLE (different user — do NOT copy):
{
  "tags": [
    { "kind": "niche", "label": "Wellness specialist", "emoji": "🌿" },
    { "kind": "country", "label": "DACH operator", "emoji": "🇩🇪" },
    { "kind": "pickiness", "label": "Selective scorer", "emoji": "🔍" },
    { "kind": "pace", "label": "Weekly researcher", "emoji": "📅" }
  ]
}`;
}
