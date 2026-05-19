import type { PillarResult, ScoreInput } from "../types";
import { NICHES } from "@/lib/data/niches";
import { geminiFlash, isGeminiAvailable } from "@/lib/ai/gemini";
import { buildDemandPrompt, demandSchema } from "@/lib/ai/prompts/demand-prompt";
import type {
  GoogleTrendsData,
  TikTokTrendData,
} from "@/lib/scrapers/types";

function fallbackDemand({ product, country }: ScoreInput): PillarResult {
  const heat = NICHES[product.category].heat;
  let score = Math.round(heat * 0.7);
  if (country.trendingNiches.includes(product.category)) score += 12;
  if (country.deadNiches.includes(product.category)) score -= 18;
  score = Math.max(0, Math.min(100, score));
  return {
    score,
    reasoning: `AI unavailable — heuristic from ${NICHES[product.category].label} heat (${heat}) and ${country.code} trend fit.`,
  };
}

function blendWithLiveSignals(
  base: PillarResult,
  input: ScoreInput,
  tiktok?: TikTokTrendData,
  trends?: GoogleTrendsData,
): PillarResult {
  let score = base.score;
  const notes: string[] = [base.reasoning];

  if (trends) {
    // Velocity is -100..100. Nudge demand pillar up or down by up to ±10 pts.
    const delta = Math.round(trends.velocity / 10);
    score = Math.max(0, Math.min(100, score + delta));
    notes.push(
      `Google Trends ${input.country.code}: ${trends.velocity >= 0 ? "+" : ""}${trends.velocity}% interest velocity over the last 8 weeks.`,
    );
  }
  if (tiktok) {
    // Very high views or rising velocity → bonus; flat → small penalty.
    let bonus = 0;
    if (tiktok.totalViews >= 100_000_000) bonus += 6;
    else if (tiktok.totalViews >= 10_000_000) bonus += 3;
    if (tiktok.currentVelocity > 1_000_000) bonus += 3;
    if (tiktok.totalViews < 1_000_000) bonus -= 4;
    score = Math.max(0, Math.min(100, score + bonus));
    notes.push(
      `TikTok #${tiktok.hashtag}: ${(tiktok.totalViews / 1_000_000).toFixed(1)}M views across ${tiktok.videoCount.toLocaleString()} videos.`,
    );
  }

  return { score, reasoning: notes.join(" ") };
}

export async function scoreDemand(
  input: ScoreInput,
  signals: { tiktok?: TikTokTrendData; trends?: GoogleTrendsData } = {},
): Promise<PillarResult> {
  let base: PillarResult;
  if (isGeminiAvailable()) {
    try {
      const res = await geminiFlash<{ score: number; reasoning: string }>(
        buildDemandPrompt(input),
        demandSchema,
      );
      base = {
        score: Math.max(0, Math.min(100, Math.round(res.score))),
        reasoning: res.reasoning.trim(),
      };
    } catch {
      base = fallbackDemand(input);
    }
  } else {
    base = fallbackDemand(input);
  }
  if (!signals.tiktok && !signals.trends) return base;
  return blendWithLiveSignals(base, input, signals.tiktok, signals.trends);
}
