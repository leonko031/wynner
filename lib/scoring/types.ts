import type { Country, Product, Verdict } from "@/types";
import type { EnrichmentBundle, EnrichmentSources } from "@/lib/scrapers/types";

export type { EnrichmentBundle, EnrichmentSources };

export type ScoreInput = {
  product: Pick<
    Product,
    | "name"
    | "description"
    | "image"
    | "category"
    | "costUSD"
    | "suggestedPriceUSD"
    | "shippingCostUSD"
    | "source"
  >;
  country: Country;
};

export type PillarKey =
  | "margin"
  | "marketFit"
  | "demand"
  | "competition"
  | "creative";

export type PillarResult = {
  score: number; // 0-100
  reasoning: string;
};

export type ScoreReasoning = {
  whyTest: string[];
  redFlags: string[];
  topAngle: string;
};

export type ScoreResult = {
  sellScore: number; // 0-100
  verdict: Verdict;
  pillars: Record<PillarKey, number>;
  pillarReasoning: Record<PillarKey, string>;
  reasoning: ScoreReasoning;
  enrichment?: EnrichmentSources;
};

export const PILLAR_WEIGHTS: Record<PillarKey, number> = {
  margin: 0.25,
  marketFit: 0.2,
  demand: 0.2,
  competition: 0.2,
  creative: 0.15,
};
