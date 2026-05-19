/**
 * Deep Research — strict types + Zod runtime schemas for every Gemini stage.
 *
 * The orchestrator runs each stage with a JSON-mode Gemini call, then parses
 * with the matching schema. Any validation failure triggers a graceful
 * fallback (a typed stub object) rather than crashing the pipeline.
 *
 * Every stage's TypeScript type is derived from its Zod schema via `z.infer`
 * — single source of truth, no drift.
 */

import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Common primitives                                                          */
/* -------------------------------------------------------------------------- */

export const confidenceLevelSchema = z.enum(["low", "medium", "high"]);
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;

/**
 * Score field — Gemini often emits decimals (e.g. 67.5) where we want an
 * integer 0-100. We accept any number in range and round it ourselves.
 */
const score100 = z
  .number()
  .min(0)
  .max(100)
  .transform((n) => Math.round(n));

/** Loose integer that allows decimals from Gemini and rounds them. */
const looseInt = z.number().transform((n) => Math.round(n));

export const researchModeSchema = z.enum(["quick", "standard", "deep"]);
export type ResearchMode = z.infer<typeof researchModeSchema>;

/** Re-export the app-level Verdict type for ergonomic imports from research. */
export type { Verdict } from "@/types";

export const awarenessLevelSchema = z.enum([
  "unaware",
  "problem-aware",
  "solution-aware",
  "product-aware",
  "most-aware",
]);
export type AwarenessLevel = z.infer<typeof awarenessLevelSchema>;

export const severitySchema = z.enum(["low", "medium", "high", "critical"]);
export type Severity = z.infer<typeof severitySchema>;

/* -------------------------------------------------------------------------- */
/* Stage 1 — Product Intelligence                                             */
/* -------------------------------------------------------------------------- */

export const productIntelligenceSchema = z.object({
  category: z.string(),
  subcategory: z.string(),
  primaryUseCase: z.string(),
  problemSolved: z.string(),
  noveltyScore: score100,
  viralPotential: score100,
  tags: z.array(z.string()).max(8),
  emotionalTriggers: z.array(z.string()).max(6),
  confidenceLevel: confidenceLevelSchema,
});
export type ProductIntelligence = z.infer<typeof productIntelligenceSchema>;

/* -------------------------------------------------------------------------- */
/* Stage 2 — Market Analysis                                                  */
/* -------------------------------------------------------------------------- */

export const marketAnalysisSchema = z.object({
  countryCode: z.string().length(2),
  demandLevel: z.enum(["low", "moderate", "strong", "very-strong"]),
  seasonality: z.object({
    peakMonths: z.array(z.string()).max(6),
    lowMonths: z.array(z.string()).max(6),
    currentPosition: z.enum(["off-peak", "approaching-peak", "peak", "post-peak"]),
  }),
  marketSizeEstimate: z.string(),
  growthTrend: z.enum(["declining", "flat", "growing", "exploding"]),
  regulatoryNotes: z.array(z.string()).max(4),
  confidenceLevel: confidenceLevelSchema,
});
export type MarketAnalysis = z.infer<typeof marketAnalysisSchema>;

/* -------------------------------------------------------------------------- */
/* Stage 3 — Personas (3 in one call for consistency)                         */
/* -------------------------------------------------------------------------- */

export const personaSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: looseInt.pipe(z.number().min(14).max(90)),
  occupation: z.string(),
  income: z.string(),
  location: z.string(),
  lifestyle: z.string(),
  personalityTraits: z.array(z.string()).max(5),
  // Mins are intentionally generous — Gemini will sometimes return 2 instead
  // of 3 and we'd rather show the persona than fall back to defaults.
  painPoints: z.array(z.string()).min(1).max(8),
  desiredOutcomes: z.array(z.string()).min(1).max(5),
  objections: z.array(z.string()).min(1).max(6),
  buyingTriggers: z.array(z.string()).min(1).max(5),
  languagePatterns: z.array(z.string()).min(1).max(6),
  platformBehavior: z.string(),
  dayInTheLife: z.string(),
  realQuoteStyle: z.string(),
  avatarDescription: z.string(),
  confidenceLevel: confidenceLevelSchema,
});
export type Persona = z.infer<typeof personaSchema>;

export const personaSetSchema = z.object({
  personas: z.array(personaSchema).min(1).max(3),
});
export type PersonaSet = z.infer<typeof personaSetSchema>;

/* -------------------------------------------------------------------------- */
/* Stage 4 — Competitor Landscape                                             */
/* -------------------------------------------------------------------------- */

export const competitorArchetypeSchema = z.object({
  name: z.string(),
  approach: z.string(),
  strengths: z.array(z.string()).min(1).max(4),
  weaknesses: z.array(z.string()).min(1).max(4),
});
export type CompetitorArchetype = z.infer<typeof competitorArchetypeSchema>;

export const competitorLandscapeSchema = z.object({
  saturationScore: score100,
  saturationLevel: z.enum(["untapped", "emerging", "competitive", "saturated"]),
  topAdvertiserArchetypes: z.array(competitorArchetypeSchema).min(2).max(4),
  pricingBenchmarks: z.object({
    lowEnd: z.number(),
    midRange: z.number(),
    premium: z.number(),
  }),
  marketGaps: z.array(z.string()).min(1).max(5),
  confidenceLevel: confidenceLevelSchema,
});
export type CompetitorLandscape = z.infer<typeof competitorLandscapeSchema>;

/* -------------------------------------------------------------------------- */
/* Stage 5 — Pricing Strategy                                                 */
/* -------------------------------------------------------------------------- */

export const priceTierSchema = z.object({
  label: z.enum(["entry", "popular", "premium"]),
  price: z.number(),
  includes: z.array(z.string()).min(1).max(5),
  who: z.string(),
});
export type PriceTier = z.infer<typeof priceTierSchema>;

export const pricingStrategySchema = z.object({
  recommendedPrice: z.number(),
  anchorPrice: z.number(),
  priceTiers: z.array(priceTierSchema).length(3),
  bundleSuggestions: z.array(z.string()).min(1).max(4),
  priceJustification: z.string(),
  confidenceLevel: confidenceLevelSchema,
});
export type PricingStrategy = z.infer<typeof pricingStrategySchema>;

/* -------------------------------------------------------------------------- */
/* Stage 6 — Ad Angles (six, mapped to personas)                              */
/* -------------------------------------------------------------------------- */

export const adAngleSchema = z.object({
  id: z.string(),
  awarenessLevel: awarenessLevelSchema,
  angle: z.string(),
  hook: z.string(),
  scriptStructure: z.object({
    opening: z.string(),
    middle: z.string(),
    close: z.string(),
  }),
  platformFit: z.object({
    meta: score100,
    tiktok: score100,
    googleAds: score100,
  }),
  targetPersonaId: z.string(),
  confidenceLevel: confidenceLevelSchema,
});
export type AdAngle = z.infer<typeof adAngleSchema>;

export const adAngleSetSchema = z.object({
  angles: z.array(adAngleSchema).min(3).max(6),
});
export type AdAngleSet = z.infer<typeof adAngleSetSchema>;

/* -------------------------------------------------------------------------- */
/* Stage 7 — Launch Playbook (14-day)                                         */
/* -------------------------------------------------------------------------- */

export const dailyActionSchema = z.object({
  day: looseInt.pipe(z.number().min(1).max(14)),
  focus: z.string(),
  actions: z.array(z.string()).min(2).max(6),
  creativeCount: looseInt.pipe(z.number().min(0).max(20)),
  budgetSplit: z.string(),
  kpis: z.array(z.string()).min(1).max(4),
});
export type DailyAction = z.infer<typeof dailyActionSchema>;

export const launchPlaybookSchema = z.object({
  totalDays: z.literal(14),
  dailyActions: z.array(dailyActionSchema).length(14),
  totalBudget: z.number(),
  expectedROAS: z.number(),
  confidenceLevel: confidenceLevelSchema,
});
export type LaunchPlaybook = z.infer<typeof launchPlaybookSchema>;

/* -------------------------------------------------------------------------- */
/* Stage 8 — Risk Analysis                                                    */
/* -------------------------------------------------------------------------- */

export const redFlagSchema = z.object({
  description: z.string(),
  severity: severitySchema,
  mitigation: z.string(),
});
export type RedFlag = z.infer<typeof redFlagSchema>;

export const riskAnalysisSchema = z.object({
  redFlags: z.array(redFlagSchema).min(1).max(6),
  confidenceLevel: confidenceLevelSchema,
});
export type RiskAnalysis = z.infer<typeof riskAnalysisSchema>;

/* -------------------------------------------------------------------------- */
/* Final verdict (synthesized from everything above)                          */
/* -------------------------------------------------------------------------- */

export const comparableProductSchema = z.object({
  name: z.string(),
  why: z.string(),
});
export type ComparableProduct = z.infer<typeof comparableProductSchema>;

export const finalVerdictSchema = z.object({
  sellScore: score100,
  verdict: z.enum(["go", "test", "risky", "skip"]),
  summary: z.string(),
  confidenceLevel: confidenceLevelSchema,
  comparableProducts: z.array(comparableProductSchema).max(3),
  pillars: z.object({
    margin: score100,
    marketFit: score100,
    demand: score100,
    competition: score100,
    creative: score100,
  }),
  topAngle: z.string(),
});
export type FinalVerdict = z.infer<typeof finalVerdictSchema>;

/* -------------------------------------------------------------------------- */
/* Master report                                                              */
/* -------------------------------------------------------------------------- */

export interface DeepResearchReport {
  id: string;
  productId: string;
  generatedAt: string;
  mode: ResearchMode;
  productSnapshot: {
    name: string;
    description: string;
    image: string;
    countryCode: string;
    countryName: string;
    countryFlag: string;
    costUSD: number;
    suggestedPriceUSD: number;
  };
  productIntelligence?: ProductIntelligence;
  marketAnalysis?: MarketAnalysis;
  personas: Persona[];
  competitorLandscape?: CompetitorLandscape;
  pricingStrategy?: PricingStrategy;
  adAngles: AdAngle[];
  launchPlaybook?: LaunchPlaybook;
  riskAnalysis?: RiskAnalysis;
  finalVerdict: FinalVerdict;
  /** Methodology — surfaced in the report footer for trust. */
  methodology: {
    modelsUsed: string[];
    stagesRun: string[];
    durationMs: number;
    fallbacksTriggered: string[];
  };
}

/* -------------------------------------------------------------------------- */
/* Progress events streamed by the orchestrator                               */
/* -------------------------------------------------------------------------- */

export type ResearchStageId =
  | "product_intelligence"
  | "market_analysis"
  | "persona_synthesis"
  | "competitor_landscape"
  | "pricing_strategy"
  | "ad_angles"
  | "launch_playbook"
  | "risk_verdict";

export type ResearchProgressEvent =
  | { type: "stage_started"; stage: ResearchStageId; label: string }
  | { type: "stage_thinking"; stage: ResearchStageId; thought: string }
  | {
      type: "stage_completed";
      stage: ResearchStageId;
      preview: string;
      durationMs: number;
    }
  | {
      type: "stage_failed";
      stage: ResearchStageId;
      error: string;
      usedFallback: boolean;
    }
  | { type: "research_completed"; reportId: string }
  | { type: "research_failed"; error: string };

/* -------------------------------------------------------------------------- */
/* Depth selector metadata — referenced by UI + orchestrator                  */
/* -------------------------------------------------------------------------- */

export const RESEARCH_MODE_META: Record<
  ResearchMode,
  {
    label: string;
    creditCost: number;
    estimatedSeconds: number;
    stages: ResearchStageId[];
    /** How many personas to ask for in the persona-synthesis call. */
    personaCount: 1 | 2 | 3;
  }
> = {
  quick: {
    label: "Quick Scan",
    creditCost: 1,
    estimatedSeconds: 10,
    stages: ["product_intelligence", "persona_synthesis", "risk_verdict"],
    personaCount: 1,
  },
  standard: {
    label: "Standard Scan",
    creditCost: 4,
    estimatedSeconds: 25,
    stages: [
      "product_intelligence",
      "market_analysis",
      "persona_synthesis",
      "competitor_landscape",
      "pricing_strategy",
      "ad_angles",
      "risk_verdict",
    ],
    personaCount: 3,
  },
  deep: {
    label: "Deep Research",
    creditCost: 9,
    estimatedSeconds: 60,
    stages: [
      "product_intelligence",
      "market_analysis",
      "persona_synthesis",
      "competitor_landscape",
      "pricing_strategy",
      "ad_angles",
      "launch_playbook",
      "risk_verdict",
    ],
    personaCount: 3,
  },
};

export const STAGE_LABELS: Record<ResearchStageId, string> = {
  product_intelligence: "Product intelligence",
  market_analysis: "Market analysis",
  persona_synthesis: "Customer avatars",
  competitor_landscape: "Competitive landscape",
  pricing_strategy: "Pricing strategy",
  ad_angles: "Ad angles",
  launch_playbook: "14-day playbook",
  risk_verdict: "Risk & verdict",
};
