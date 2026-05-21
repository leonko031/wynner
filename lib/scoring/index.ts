import { verdictFromScore } from "@/types";
import { geminiFlash, isGeminiAvailable } from "@/lib/ai/gemini";
import {
  buildReasoningPrompt,
  reasoningSchema,
} from "@/lib/ai/prompts/reasoning-prompt";
import { scoreMargin } from "./pillars/margin";
import { scoreMarketFit } from "./pillars/market-fit";
import { scoreDemand } from "./pillars/demand";
import { scoreCompetition } from "./pillars/competition";
import { scoreCreative } from "./pillars/creative";
import {
  PILLAR_WEIGHTS,
  type EnrichmentBundle,
  type EnrichmentSources,
  type PillarKey,
  type ScoreInput,
  type ScoreReasoning,
  type ScoreResult,
} from "./types";

function fallbackReasoning(
  input: ScoreInput,
  pillars: Record<PillarKey, number>,
  sellScore: number,
): ScoreReasoning {
  const why: string[] = [];
  const flags: string[] = [];

  if (pillars.margin >= 70)
    why.push("Margin pillar is healthy — room for paid acquisition.");
  if (pillars.demand >= 65)
    why.push("Demand signal supports an active testing window.");
  if (pillars.marketFit >= 65)
    why.push(`Country fit is strong for ${input.country.name}.`);
  if (why.length === 0)
    why.push("No standout strengths — consider re-pricing or re-targeting.");

  if (pillars.competition < 55)
    flags.push("Competitive surface is crowded — fresh creative is mandatory.");
  if (pillars.margin < 55)
    flags.push("Margin is tight — ad spend has little room to breathe.");
  if (sellScore < 50)
    flags.push("Overall score is sub-pass — treat any test as exploratory.");

  return {
    whyTest: why.slice(0, 3),
    redFlags: flags.slice(0, 3),
    topAngle:
      "Heuristic top angle: lead with a 5-second demo or before/after framing on the dominant local platform.",
  };
}

export async function runScore(
  input: ScoreInput,
  enrichment: EnrichmentBundle = {},
): Promise<ScoreResult> {
  // Sync pillars
  const marginRes = scoreMargin(input);
  const marketFitRes = scoreMarketFit(input);

  // Async pillars in parallel — enriched when corresponding scraper data exists.
  const [demandRes, competitionRes, creativeRes] = await Promise.all([
    scoreDemand(input, {
      tiktok: enrichment.tiktok,
      trends: enrichment.googleTrends,
    }),
    scoreCompetition(input, enrichment.metaAds),
    scoreCreative({ product: input.product }),
  ]);

  const pillars: Record<PillarKey, number> = {
    margin: marginRes.score,
    marketFit: marketFitRes.score,
    demand: demandRes.score,
    competition: competitionRes.score,
    creative: creativeRes.score,
  };

  const pillarReasoning: Record<PillarKey, string> = {
    margin: marginRes.reasoning,
    marketFit: marketFitRes.reasoning,
    demand: demandRes.reasoning,
    competition: competitionRes.reasoning,
    creative: creativeRes.reasoning,
  };

  const sellScore = Math.round(
    (Object.keys(pillars) as PillarKey[]).reduce(
      (acc, k) => acc + pillars[k] * PILLAR_WEIGHTS[k],
      0,
    ),
  );

  // Reasoning summary
  let reasoning: ScoreReasoning;
  if (isGeminiAvailable()) {
    try {
      // Flash is plenty for the short reasoning summary — keeps scan latency
      // under a couple seconds. Pro added depth but cost the user wait time.
      reasoning = await geminiFlash<ScoreReasoning>(
        buildReasoningPrompt(input, pillars, sellScore),
        reasoningSchema,
      );
    } catch {
      reasoning = fallbackReasoning(input, pillars, sellScore);
    }
  } else {
    reasoning = fallbackReasoning(input, pillars, sellScore);
  }

  const enrichmentSources: EnrichmentSources | undefined =
    enrichment.product || enrichment.metaAds || enrichment.tiktok || enrichment.googleTrends
      ? {
          productScrape: enrichment.product
            ? {
                source: enrichment.product.source === "manual" ? "amazon" : enrichment.product.source,
                scrapedAt: new Date().toISOString(),
              }
            : undefined,
          metaAds: enrichment.metaAds
            ? {
                scrapedAt: new Date().toISOString(),
                totalActiveAds: enrichment.metaAds.totalActiveAds,
              }
            : undefined,
          tiktok: enrichment.tiktok
            ? {
                scrapedAt: new Date().toISOString(),
                totalViews: enrichment.tiktok.totalViews,
              }
            : undefined,
          googleTrends: enrichment.googleTrends
            ? {
                scrapedAt: new Date().toISOString(),
                velocity: enrichment.googleTrends.velocity,
              }
            : undefined,
        }
      : undefined;

  return {
    sellScore,
    verdict: verdictFromScore(sellScore),
    pillars,
    pillarReasoning,
    enrichment: enrichmentSources,
    reasoning,
  };
}

export type { ScoreResult, ScoreInput, PillarKey } from "./types";
