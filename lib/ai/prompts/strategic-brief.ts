import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { CompactScan } from "@/types/insights";

export type StrategicBriefContext = {
  firstName: string;
  scans: CompactScan[];
  /** Period these scans cover. */
  periodLabel: string;
  /** YYYY-MM-DD bounds. */
  periodStart: string;
  periodEnd: string;
  /** Cached operator level snapshot, so the brief can reference the tier. */
  operatorLevel: number;
  operatorTier: string;
  /** Counts pulled from vault status. */
  testingCount: number;
  wonCount: number;
  killedCount: number;
  watchlistCount: number;
  /** Distinct comparisons run in the period. */
  comparisonsCount: number;
};

/**
 * Long, intentional prompt that asks Gemini Pro for a 5-part strategic
 * brief about the user's operation. The output is dense, specific, and
 * uses real numbers from the data above.
 */
export function buildStrategicBriefPrompt(ctx: StrategicBriefContext): string {
  // Compress scans into a condensed bullet block — score + verdict + niche + country.
  const scanLines = ctx.scans
    .slice(0, 60)
    .map((s) => {
      const n = NICHES[s.niche as keyof typeof NICHES]?.label ?? s.niche;
      const c = COUNTRIES[s.country]?.name ?? s.country;
      const status = s.status ? `, status=${s.status}` : "";
      return `  • ${s.name} — ${n} / ${c} — ${s.score} ${s.verdict.toUpperCase()}${status}`;
    })
    .join("\n");

  // Niche tally
  const nicheCount = new Map<string, { count: number; scoreSum: number }>();
  for (const s of ctx.scans) {
    const e = nicheCount.get(s.niche) ?? { count: 0, scoreSum: 0 };
    e.count += 1;
    e.scoreSum += s.score;
    nicheCount.set(s.niche, e);
  }
  const nicheSummary = [...nicheCount.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([k, v]) => {
      const label = NICHES[k as keyof typeof NICHES]?.label ?? k;
      return `${label}: ${v.count} scans @ avg ${Math.round(v.scoreSum / v.count)}`;
    })
    .join("\n  ");

  // Country tally
  const countryCount = new Map<string, { count: number; scoreSum: number }>();
  for (const s of ctx.scans) {
    const e = countryCount.get(s.country) ?? { count: 0, scoreSum: 0 };
    e.count += 1;
    e.scoreSum += s.score;
    countryCount.set(s.country, e);
  }
  const countrySummary = [...countryCount.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([k, v]) => {
      const label = COUNTRIES[k]?.name ?? k;
      return `${label}: ${v.count} scans @ avg ${Math.round(v.scoreSum / v.count)}`;
    })
    .join("\n  ");

  const avgScore =
    ctx.scans.length === 0
      ? 0
      : Math.round(
          ctx.scans.reduce((s, x) => s + x.score, 0) / ctx.scans.length,
        );
  const goCount = ctx.scans.filter((s) => s.verdict === "go").length;
  const testCount = ctx.scans.filter((s) => s.verdict === "test").length;
  const skipCount = ctx.scans.filter((s) => s.verdict === "skip").length;

  return `You are Wynner, a senior dropshipping operations advisor writing a monthly strategic brief for an individual operator named ${ctx.firstName}. You are observant, honest, and specific. You name patterns, point to data, and give actionable advice. You don't flatter.

PERIOD: ${ctx.periodLabel} (${ctx.periodStart} → ${ctx.periodEnd})

OPERATOR PROFILE
  Operator level: ${ctx.operatorLevel}/100 — ${ctx.operatorTier}
  Total scans in period: ${ctx.scans.length}
  Avg sell-score: ${avgScore}
  Verdict mix: ${goCount} GO, ${testCount} TEST, ${ctx.scans.length - goCount - testCount - skipCount} RISKY, ${skipCount} SKIP

ACTION STATE (from their vault)
  Currently Testing: ${ctx.testingCount}
  Confirmed Won: ${ctx.wonCount}
  Killed: ${ctx.killedCount}
  On Watchlist: ${ctx.watchlistCount}
  Comparisons run in period: ${ctx.comparisonsCount}

NICHES SCANNED
  ${nicheSummary || "(none)"}

COUNTRIES SCANNED
  ${countrySummary || "(none)"}

RECENT SCANS (most recent first, up to 60)
${scanLines || "  (no scans in this period)"}

OUTPUT — ONE JSON OBJECT with this exact shape:
{
  "portrait": "<2 paragraphs. Open with a specific observation. State concrete numbers (scan count, % in their dominant niche, % targeting their dominant region, avg score, action rate). Surface the gap between scanning volume vs action rate if relevant. ~150-220 words.>",
  "whatsWorking": {
    "intro": "<1-2 sentences setting up what's paying off.>",
    "bullets": [
      "<Specific point about a strength — reference a niche/country/pattern + a real number from the data above.>",
      "<Another specific strength.>",
      "<A third strength.>"
    ]
  },
  "needsAttention": {
    "intro": "<1-2 sentences framing the things to watch.>",
    "bullets": [
      "<Specific blindspot — name a niche/country/behavior + a number.>",
      "<Another specific blindspot.>"
    ]
  },
  "hypothesis": "<1 paragraph. Your honest read on what's driving their behavior. E.g. 'You're probably reading too much research, scanning too cautiously — your scoring is selective but your action rate is low.' Be direct but warm. 60-120 words.>",
  "planForNextMonth": {
    "intro": "<1 sentence framing the plan.>",
    "actions": [
      "<Action 1 — specific. Reference a product by name when possible, a niche/country, a budget number.>",
      "<Action 2.>",
      "<Action 3.>",
      "<Action 4 (optional).>",
      "<Action 5 (optional).>"
    ]
  }
}

CONSTRAINTS
  • Always use specific numbers. Never generic.
  • Name niches and countries by their human labels (e.g. "Wellness", "Germany") not the keys.
  • Tone: confident, direct, warm. Like a senior partner reading the data, not a marketer.
  • No hype words: never "massive", "huge", "game-changer", "next-level", "explode", "blow up", "incredible", "amazing".
  • Avoid exclamation marks. One MAX across the whole brief.
  • Address ${ctx.firstName} by name AT MOST ONCE.
  • If the user has very few scans (under 10), acknowledge it honestly. Don't fabricate patterns.

EXAMPLE PORTRAIT TONE (different operator — DO NOT COPY):
"You scan with discipline — 23 products in the last 30 days, 70% in wellness, 80% targeting DACH markets. Your average score (74) is solidly in TEST territory, suggesting you're filtering well before committing. But you've only marked 2 products as actually Testing in your vault, which means you're scanning more than acting. The gap between research and action is the most interesting thing in your data right now."`;
}
