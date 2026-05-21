import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { CompactScan } from "@/types/insights";

export type StrengthsBlindspotsContext = {
  firstName: string;
  scans: CompactScan[];
  overallAvg: number;
};

/**
 * Build the prompt for the strengths & blindspots cards. Returns
 * 1-3 strengths and 1-3 blindspots with specific, observational
 * commentary. Gemini Flash — should run cheap and fast.
 */
export function buildStrengthsBlindspotsPrompt(
  ctx: StrengthsBlindspotsContext,
): string {
  // Pre-bucket the scan data so the prompt is short.
  const byNiche = new Map<string, { scores: number[]; verdicts: string[] }>();
  const byCountry = new Map<string, { scores: number[]; verdicts: string[] }>();
  for (const s of ctx.scans) {
    const n = byNiche.get(s.niche) ?? { scores: [], verdicts: [] };
    n.scores.push(s.score);
    n.verdicts.push(s.verdict);
    byNiche.set(s.niche, n);

    const c = byCountry.get(s.country) ?? { scores: [], verdicts: [] };
    c.scores.push(s.score);
    c.verdicts.push(s.verdict);
    byCountry.set(s.country, c);
  }
  function summarize(label: string, bucket: { scores: number[]; verdicts: string[] }): string {
    const avg = Math.round(
      bucket.scores.reduce((s, n) => s + n, 0) / bucket.scores.length,
    );
    const wins = bucket.verdicts.filter((v) => v === "go" || v === "test").length;
    const winRate = Math.round((wins / bucket.verdicts.length) * 100);
    return `${label}: ${bucket.scores.length} scans, avg ${avg}, win rate ${winRate}%`;
  }
  const nicheLines = [...byNiche.entries()]
    .sort((a, b) => b[1].scores.length - a[1].scores.length)
    .slice(0, 8)
    .map(([k, b]) => summarize(NICHES[k as keyof typeof NICHES]?.label ?? k, b))
    .join("\n  ");
  const countryLines = [...byCountry.entries()]
    .sort((a, b) => b[1].scores.length - a[1].scores.length)
    .slice(0, 8)
    .map(([k, b]) => summarize(COUNTRIES[k]?.name ?? k, b))
    .join("\n  ");

  // What niches/countries the user has NOT touched at all.
  const allNiches = Object.keys(NICHES);
  const allCountries = Object.keys(COUNTRIES);
  const unscannedNiches = allNiches.filter((n) => !byNiche.has(n)).slice(0, 6);
  const unscannedCountries = allCountries.filter((c) => !byCountry.has(c)).slice(0, 6);

  // Killed products — anything verdict=skip is a recurring mistake signal.
  const killedNiches = new Map<string, number>();
  for (const s of ctx.scans) {
    if (s.verdict === "skip") {
      killedNiches.set(s.niche, (killedNiches.get(s.niche) ?? 0) + 1);
    }
  }
  const killedLines = [...killedNiches.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k, c]) => `${NICHES[k as keyof typeof NICHES]?.label ?? k}: ${c} skips`)
    .join(", ");

  return `You are Wynner, analyzing ${ctx.firstName}'s scanning history to surface 3 STRENGTHS (where they shine) and 3 BLINDSPOTS (where they're flying blind). Be specific, name real categories, cite real numbers from the data below. Never use generic phrases like "broaden horizons" — always be concrete.

OPERATOR CONTEXT
  Name: ${ctx.firstName}
  Overall avg sell-score: ${ctx.overallAvg}
  Total scans summarized below: ${ctx.scans.length}

PER-NICHE PERFORMANCE
  ${nicheLines || "(no scans yet)"}

PER-COUNTRY PERFORMANCE
  ${countryLines || "(no scans yet)"}

RECURRING SKIPS (niches they tried but kept rejecting):
  ${killedLines || "(none)"}

UNTOUCHED NICHES (haven't scanned a single product):
  ${unscannedNiches.map((n) => NICHES[n as keyof typeof NICHES]?.label ?? n).join(", ") || "(covered all niches)"}

UNTOUCHED COUNTRIES:
  ${unscannedCountries.map((c) => COUNTRIES[c]?.name ?? c).join(", ") || "(covered all countries)"}

OUTPUT FORMAT — ONE JSON OBJECT
{
  "strengths": [
    {
      "category": "<short tag, e.g. 'Wellness niche'>",
      "label": "<1-line summary, e.g. 'Your edge'>",
      "stat": "<a specific stat: e.g. '84 avg score on 12 wellness scans'>",
      "insight": "<1 line of specific commentary referencing the data>"
    },
    ...up to 3
  ],
  "blindspots": [
    {
      "category": "<short tag, e.g. 'TikTok-led products'>",
      "label": "<1-line summary, e.g. 'Worth exploring'>",
      "gap": "<a specific gap: e.g. '0 scans of fitness niche this month'>",
      "insight": "<1 line of commentary — what they're probably missing>",
      "exploreUrl": "<optional /scan?niche=... URL>"
    },
    ...up to 3
  ]
}

RULES
  • For STRENGTHS pick categories where the user's avg materially beats their overall avg (${ctx.overallAvg}) OR where they have a high concentration + healthy win rate.
  • For BLINDSPOTS pick: (a) entirely untouched niches/countries that fit their profile, (b) recurring skip patterns, or (c) missing combinations (e.g. they love Germany + wellness but never tried Germany + home).
  • Use real numbers. If you don't have a specific stat for something, don't say it.
  • Tone: warm but honest. Like a coach reading their stats back to them.
  • No hype words ("massive", "huge", "game-changer"). One exclamation MAX across the whole output.

Valid niche keys (use only these): ${Object.keys(NICHES).join(", ")}
Valid country keys (ISO-2, only these): ${Object.keys(COUNTRIES).join(", ")}

EXAMPLE (different user — do NOT copy):
{
  "strengths": [
    {
      "category": "Wellness niche",
      "label": "Your edge",
      "stat": "84 avg on 12 wellness scans",
      "insight": "17% above your overall avg — clearly your strongest category."
    }
  ],
  "blindspots": [
    {
      "category": "TikTok-led products",
      "label": "Worth exploring",
      "gap": "0 scans in fitness — historically a TikTok niche",
      "insight": "Peers in similar markets average 4-6 fitness scans/month. Worth dipping in.",
      "exploreUrl": "/scan?niche=fitness"
    }
  ]
}`;
}
