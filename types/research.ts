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
import type { GroundingSource } from "./grounding";

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
  /** Indices into the report-level sources array — for citations UI. */
  sources: z.array(z.number().int().min(0)).max(20).default([]),
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
  sources: z.array(z.number().int().min(0)).max(40).default([]),
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
  sources: z.array(z.number().int().min(0)).max(20).default([]),
});
export type PricingStrategy = z.infer<typeof pricingStrategySchema>;

/* -------------------------------------------------------------------------- */
/* Stage 6 — Ad Angles (legacy schema kept for back-compat with old reports)  */
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
/* Stage 6 (new) — HookAngle: the full creative blueprint                     */
/* -------------------------------------------------------------------------- */

export const emotionalDriverSchema = z.enum([
  "curiosity",
  "fear",
  "aspiration",
  "belonging",
  "fomo",
  "transformation",
  "validation",
  "convenience",
]);
export type EmotionalDriver = z.infer<typeof emotionalDriverSchema>;

export const platformFitEntrySchema = z.object({
  score: score100,
  reasoning: z.string().min(1).max(160),
});

export const hookScriptSchema = z.object({
  opening: z.string(),
  problem: z.string(),
  /** Quick tier may omit agitation/proof — they're optional. */
  agitation: z.string().optional(),
  solution: z.string(),
  proof: z.string().optional(),
  cta: z.string(),
});
export type HookScript = z.infer<typeof hookScriptSchema>;

export const hookAngleSchema = z.object({
  id: z.string(),
  rank: z.number().int().min(1).max(20),
  awarenessLevel: awarenessLevelSchema,
  emotionalDriver: emotionalDriverSchema,
  targetPersonaId: z.string(),

  primaryHook: z.string().min(8).max(220),
  /** A/B test alternatives. Quick tier: omit. Standard: 2. Deep: 3. */
  hookVariants: z.array(z.string()).max(4).default([]),

  firstFrameDescription: z.string().min(8).max(240),
  /** B-roll concepts. Quick tier: omit. Standard/Deep: 3. */
  visualHookIdeas: z.array(z.string()).max(5).default([]),

  scriptStructure: hookScriptSchema,

  platformFit: z.object({
    meta: platformFitEntrySchema,
    tiktok: platformFitEntrySchema,
    youtube: platformFitEntrySchema,
    googleAds: platformFitEntrySchema,
  }),

  captionVariations: z.array(z.string()).min(1).max(6),
  ctaVariations: z.array(z.string()).min(1).max(4),

  whyThisWorks: z.string().min(8).max(420),
  /** References to signals from discovery phase (string format, human readable). */
  groundedInSignals: z.array(z.string()).max(6).default([]),
  /** Indices into the report-level sources array. */
  sources: z.array(z.number().int().min(0)).max(20).default([]),
  confidence: confidenceLevelSchema,
});
export type HookAngle = z.infer<typeof hookAngleSchema>;

export const hookAngleSetSchema = z.object({
  angles: z.array(hookAngleSchema).min(1).max(10),
});
export type HookAngleSet = z.infer<typeof hookAngleSetSchema>;

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
  sources: z.array(z.number().int().min(0)).max(10).default([]),
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
  sources: z.array(z.number().int().min(0)).max(10).default([]),
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
  /** Legacy field for older reports — new flow populates `hookAngles` instead. */
  adAngles: AdAngle[];
  /** The new creative-blueprint angles. Per-tier count: 2 / 5 / 8. */
  hookAngles: HookAngle[];
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
  /* ----- Grounding metadata (new) ----- */
  /** Consolidated + deduplicated source list from all phase 1 calls. */
  sources: GroundingSource[];
  /** Every Google query Gemini executed during this scan. */
  searchQueriesRun: string[];
  /** 0-100 grounding quality score — drives the badge near the verdict. */
  groundingQualityScore: number;
  /** True when GEMINI_GROUNDING_ENABLED=false or all grounded calls fell back. */
  ungroundedFallback: boolean;
}

/* -------------------------------------------------------------------------- */
/* Progress events streamed by the orchestrator                               */
/* -------------------------------------------------------------------------- */

/**
 * Stage ids — kept aligned with the per-tier card layouts in the live
 * research UI. The new 3-phase pipeline maps each stage to a phase:
 *   • Phase 1 (discovery)  → quick_signals, landscape, voice, competitors,
 *                             trends, country_context
 *   • Phase 2 (synthesis)  → personas, hook_angles, pricing, competition,
 *                             risk, launch_playbook
 *   • Phase 3 (verdict)    → final_verdict
 *
 * Older stage ids (product_intelligence, ad_angles, risk_verdict, etc.)
 * are kept for back-compat with stored reports and the old prompts.
 */
export type ResearchStageId =
  // Phase 1 — discovery (grounded)
  | "quick_signals"
  | "landscape"
  | "voice"
  | "competitors_discovery"
  | "trends"
  | "country_context"
  // Phase 2 — synthesis
  | "personas"
  | "hook_angles"
  | "pricing"
  | "competition_synthesis"
  | "risk"
  | "launch_playbook"
  // Phase 3 — verdict
  | "final_verdict"
  // Legacy (old reports' stages — keep for back-compat)
  | "product_intelligence"
  | "market_analysis"
  | "persona_synthesis"
  | "competitor_landscape"
  | "pricing_strategy"
  | "ad_angles"
  | "risk_verdict";

export type ResearchPhase = 1 | 2 | 3;

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
  | { type: "phase_started"; phase: ResearchPhase }
  | { type: "phase_completed"; phase: ResearchPhase }
  | { type: "search_query_started"; query: string; stage: ResearchStageId }
  | {
      type: "search_query_completed";
      query: string;
      resultCount: number;
      stage: ResearchStageId;
    }
  | { type: "source_discovered"; source: GroundingSource; stage: ResearchStageId }
  | { type: "research_completed"; reportId: string }
  | { type: "research_failed"; error: string };

/* -------------------------------------------------------------------------- */
/* Depth selector metadata — referenced by UI + orchestrator                  */
/* -------------------------------------------------------------------------- */

/**
 * Per-tier research configuration. Each mode declares:
 *   • discoveryStages  — which Phase 1 (grounded) calls to run in parallel
 *   • synthesisStages  — which Phase 2 calls to run in parallel after Phase 1
 *   • angleCount       — how many HookAngles to ask for
 *   • personaCount     — how many personas to ask for
 *   • Phase 3 always runs final_verdict.
 */
export const RESEARCH_MODE_META: Record<
  ResearchMode,
  {
    label: string;
    creditCost: number;
    estimatedSeconds: number;
    /** Phase 1 — grounded web research, all in parallel. */
    discoveryStages: ResearchStageId[];
    /** Phase 2 — synthesis stages, all in parallel after Phase 1. */
    synthesisStages: ResearchStageId[];
    angleCount: 2 | 5 | 8;
    personaCount: 1 | 2 | 3;
    /** Model preference for grounded calls. Deep gets Pro for stronger grounding. */
    groundingModel: "flash" | "pro";
    /** Whether the new HookAngle synthesis runs on Pro or Flash. */
    angleModel: "flash" | "pro";
    /** Legacy stages array — kept so old UI bits that read .stages don't crash. */
    stages: ResearchStageId[];
  }
> = {
  quick: {
    label: "Quick Scan",
    creditCost: 1,
    estimatedSeconds: 15,
    discoveryStages: ["quick_signals"],
    synthesisStages: ["personas", "hook_angles"],
    angleCount: 2,
    personaCount: 1,
    groundingModel: "flash",
    angleModel: "flash",
    stages: ["quick_signals", "personas", "hook_angles", "final_verdict"],
  },
  standard: {
    label: "Standard Scan",
    creditCost: 4,
    estimatedSeconds: 35,
    discoveryStages: ["landscape", "voice", "competitors_discovery"],
    synthesisStages: ["personas", "hook_angles", "pricing", "competition_synthesis"],
    angleCount: 5,
    personaCount: 3,
    groundingModel: "flash",
    angleModel: "pro",
    stages: [
      "landscape",
      "voice",
      "competitors_discovery",
      "personas",
      "hook_angles",
      "pricing",
      "competition_synthesis",
      "final_verdict",
    ],
  },
  deep: {
    label: "Deep Research",
    creditCost: 9,
    estimatedSeconds: 75,
    discoveryStages: [
      "landscape",
      "voice",
      "competitors_discovery",
      "trends",
      "country_context",
    ],
    synthesisStages: [
      "personas",
      "hook_angles",
      "pricing",
      "competition_synthesis",
      "risk",
      "launch_playbook",
    ],
    angleCount: 8,
    personaCount: 3,
    groundingModel: "pro",
    angleModel: "pro",
    stages: [
      "landscape",
      "voice",
      "competitors_discovery",
      "trends",
      "country_context",
      "personas",
      "hook_angles",
      "pricing",
      "competition_synthesis",
      "risk",
      "launch_playbook",
      "final_verdict",
    ],
  },
};

export const STAGE_LABELS: Record<ResearchStageId, string> = {
  // New
  quick_signals: "Quick signals",
  landscape: "Product landscape",
  voice: "Customer voice",
  competitors_discovery: "Competitor intelligence",
  trends: "Trend signals",
  country_context: "Country context",
  personas: "Personas",
  hook_angles: "Hook angles",
  pricing: "Pricing strategy",
  competition_synthesis: "Competitor landscape",
  risk: "Risks & launch plan",
  launch_playbook: "14-day playbook",
  final_verdict: "Final verdict",
  // Legacy
  product_intelligence: "Product intelligence",
  market_analysis: "Market analysis",
  persona_synthesis: "Customer avatars",
  competitor_landscape: "Competitive landscape",
  pricing_strategy: "Pricing strategy",
  ad_angles: "Ad angles",
  risk_verdict: "Risk & verdict",
};

/** Phase number for each stage — drives the live UI's grouping. */
export const STAGE_PHASE: Record<ResearchStageId, ResearchPhase> = {
  quick_signals: 1,
  landscape: 1,
  voice: 1,
  competitors_discovery: 1,
  trends: 1,
  country_context: 1,
  personas: 2,
  hook_angles: 2,
  pricing: 2,
  competition_synthesis: 2,
  risk: 2,
  launch_playbook: 2,
  final_verdict: 3,
  product_intelligence: 1,
  market_analysis: 1,
  persona_synthesis: 2,
  competitor_landscape: 1,
  pricing_strategy: 2,
  ad_angles: 2,
  risk_verdict: 3,
};
