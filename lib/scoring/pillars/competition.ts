import type { PillarResult, ScoreInput } from "../types";
import { NICHES } from "@/lib/data/niches";
import { geminiFlash, isGeminiAvailable } from "@/lib/ai/gemini";
import {
  buildCompetitionPrompt,
  competitionSchema,
} from "@/lib/ai/prompts/competition-prompt";
import type { MetaAdsResult } from "@/lib/scrapers/types";

function fallbackCompetition({
  product,
  country,
}: ScoreInput): PillarResult {
  const heat = NICHES[product.category].heat;
  // Higher heat = more competition. CPM-heavy countries punish saturation.
  const base = 100 - heat * 0.55;
  const cpmAdj = country.cpmIndex >= 8 ? -8 : country.cpmIndex <= 3 ? 10 : 0;
  const score = Math.max(10, Math.min(90, Math.round(base + cpmAdj)));
  return {
    score,
    reasoning: `AI unavailable — heuristic from ${NICHES[product.category].label} heat and ${country.code} CPM index ${country.cpmIndex}.`,
  };
}

function scoreFromMetaAds(
  metaAds: MetaAdsResult,
  input: ScoreInput,
): PillarResult {
  // 0 active ads → 90 (blue ocean); 200+ → 15 (saturated). Linear interpolation
  // with country CPM adjustment.
  const ads = Math.max(0, metaAds.totalActiveAds);
  const raw = Math.max(15, Math.min(90, Math.round(90 - ads * 0.4)));
  const cpmAdj = input.country.cpmIndex >= 8 ? -6 : input.country.cpmIndex <= 3 ? 6 : 0;
  const score = Math.max(10, Math.min(95, raw + cpmAdj));
  const topAdvert =
    metaAds.topAdvertisers[0]?.pageName ?? "no dominant advertiser";
  return {
    score,
    reasoning: `Based on ${ads} active ads in Meta Ad Library ${metaAds.countryCode} for "${metaAds.query}". Top advertiser: ${topAdvert}. ${
      ads === 0
        ? "Blue-ocean signal — first-mover advantage available."
        : ads < 30
          ? "Crowded but beatable with a fresh hook."
          : "Saturated — needs differentiated creative volume to break through."
    }`,
  };
}

export async function scoreCompetition(
  input: ScoreInput,
  metaAds?: MetaAdsResult,
): Promise<PillarResult> {
  if (metaAds) return scoreFromMetaAds(metaAds, input);
  if (!isGeminiAvailable()) return fallbackCompetition(input);
  try {
    const res = await geminiFlash<{ score: number; reasoning: string }>(
      buildCompetitionPrompt(input),
      competitionSchema,
    );
    return {
      score: Math.max(0, Math.min(100, Math.round(res.score))),
      reasoning: res.reasoning.trim(),
    };
  } catch {
    return fallbackCompetition(input);
  }
}
