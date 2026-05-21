import { nanoid } from "nanoid";
import {
  geminiFlashJSON,
  geminiProJSON,
  geminiWithGrounding,
  isGeminiAvailable,
} from "@/lib/ai/gemini";
import { COUNTRIES } from "@/lib/data/countries";
import {
  RESEARCH_MODE_META,
  STAGE_LABELS,
  STAGE_PHASE,
  finalVerdictSchema,
  hookAngleSetSchema,
  personaSetSchema,
  type CompetitorLandscape,
  type DeepResearchReport,
  type FinalVerdict,
  type HookAngle,
  type LaunchPlaybook,
  type Persona,
  type PricingStrategy,
  type ResearchMode,
  type ResearchPhase,
  type ResearchProgressEvent,
  type ResearchStageId,
  type RiskAnalysis,
  competitorLandscapeSchema,
  launchPlaybookSchema,
  pricingStrategySchema,
  riskAnalysisSchema,
} from "@/types/research";
import {
  computeGroundingQuality,
  type GroundedCallResult,
  type GroundingSource,
} from "@/types/grounding";
import type { Country } from "@/types";
import type { ProductInput } from "@/lib/ai/prompts/research/shared";

// Discovery prompts + their output types
import {
  buildQuickSignalsPrompt,
  quickSignalsSchema,
  type QuickSignalsOutput,
} from "@/lib/ai/prompts/discovery/quick-signals";
import {
  buildLandscapePrompt,
  landscapeSchema,
  type LandscapeOutput,
} from "@/lib/ai/prompts/discovery/landscape";
import {
  buildVoicePrompt,
  voiceSchema,
  type VoiceOutput,
} from "@/lib/ai/prompts/discovery/voice";
import {
  buildCompetitorsPrompt,
  competitorsSchema,
  type CompetitorsOutput,
} from "@/lib/ai/prompts/discovery/competitors";
import {
  buildTrendsPrompt,
  trendsSchema,
  type TrendsOutput,
} from "@/lib/ai/prompts/discovery/trends";
import {
  buildCountryContextPrompt,
  countryContextSchema,
  type CountryContextOutput,
} from "@/lib/ai/prompts/discovery/country-context";

// Synthesis prompts
import type { DiscoveryBundle } from "@/lib/ai/prompts/synthesis/shared";
import { buildPersonasPrompt } from "@/lib/ai/prompts/synthesis/personas";
import { buildHookAnglesPrompt } from "@/lib/ai/prompts/synthesis/angles";
import { buildPricingPrompt } from "@/lib/ai/prompts/synthesis/pricing";
import { buildCompetitionPrompt } from "@/lib/ai/prompts/synthesis/competition";
import { buildRiskPrompt } from "@/lib/ai/prompts/synthesis/risk";
import { buildLaunchPlaybookPrompt } from "@/lib/ai/prompts/synthesis/launch-playbook";
import { buildVerdictPrompt } from "@/lib/ai/prompts/synthesis/verdict";

import {
  fallbackAdAngles,
  fallbackCompetitors,
  fallbackPersonas,
  fallbackPlaybook,
  fallbackPricing,
  fallbackRisk,
  fallbackVerdict,
} from "./research-fallbacks";

export type RunResearchInput = {
  product: ProductInput & {
    image: string;
    shippingCostUSD: number;
  };
  countryCode: string;
  userContext?: string;
  mode: ResearchMode;
};

/* -------------------------------------------------------------------------- */
/* Source deduplication + indexing                                             */
/* -------------------------------------------------------------------------- */

/**
 * Phase-1 calls each return their own GroundingSource[] with local indices.
 * The engine merges them into one global array, dedupes by URI, and rewrites
 * every source's `index` to its position in the global array. Synthesis
 * prompts and the final report reference these global indices.
 */
function mergeSources(
  buckets: { stage: ResearchStageId; result: GroundedCallResult<unknown> | null }[],
): { global: GroundingSource[]; localToGlobal: Map<string, Map<number, number>> } {
  const global: GroundingSource[] = [];
  const byUri = new Map<string, number>();
  /** stage -> (localIndex -> globalIndex). */
  const localToGlobal = new Map<string, Map<number, number>>();

  for (const { stage, result } of buckets) {
    if (!result) continue;
    const stageMap = new Map<number, number>();
    for (const src of result.sources) {
      const existing = byUri.get(src.uri);
      if (existing !== undefined) {
        stageMap.set(src.index, existing);
        continue;
      }
      const globalIndex = global.length;
      global.push({ ...src, index: globalIndex });
      byUri.set(src.uri, globalIndex);
      stageMap.set(src.index, globalIndex);
    }
    localToGlobal.set(stage, stageMap);
  }

  return { global, localToGlobal };
}

/* -------------------------------------------------------------------------- */
/* Per-stage runners                                                           */
/* -------------------------------------------------------------------------- */

type PhaseOneResult<T> = {
  data: T | null;
  result: GroundedCallResult<T> | null;
  usedFallback: boolean;
  durationMs: number;
};

/**
 * Run a single grounded discovery call. Yields search-query + source-
 * discovered events as the call resolves. On failure, yields stage_failed
 * but never throws — the orchestrator continues with an empty signal for
 * that domain (marked low-confidence downstream).
 */
async function runGroundedStage<T>(opts: {
  stage: ResearchStageId;
  prompt: string;
  schema: import("zod").ZodSchema<T>;
  model: "flash" | "pro";
}): Promise<{
  events: ResearchProgressEvent[];
  outcome: PhaseOneResult<T>;
}> {
  const events: ResearchProgressEvent[] = [];
  const started = Date.now();
  events.push({
    type: "stage_started",
    stage: opts.stage,
    label: STAGE_LABELS[opts.stage],
  });

  try {
    const result = await geminiWithGrounding<T>({
      prompt: opts.prompt,
      schema: opts.schema,
      model: opts.model === "pro" ? "gemini-2.5-pro" : "gemini-2.5-flash",
    });

    // Replay the search queries + sources as if they happened live. The UI
    // ingests these to render the live thinking feed.
    for (const q of result.searchQueries) {
      events.push({ type: "search_query_started", query: q, stage: opts.stage });
      events.push({
        type: "search_query_completed",
        query: q,
        resultCount: result.sources.filter(() => true).length,
        stage: opts.stage,
      });
    }
    for (const src of result.sources) {
      events.push({ type: "source_discovered", source: src, stage: opts.stage });
    }

    const sourceLabel = result.fellBackToUngrounded
      ? "no grounding (fallback)"
      : `${result.sources.length} sources · ${result.searchQueries.length} queries`;
    events.push({
      type: "stage_completed",
      stage: opts.stage,
      preview: sourceLabel,
      durationMs: Date.now() - started,
    });

    return {
      events,
      outcome: {
        data: result.data,
        result,
        usedFallback: result.fellBackToUngrounded,
        durationMs: Date.now() - started,
      },
    };
  } catch (err) {
    events.push({
      type: "stage_failed",
      stage: opts.stage,
      error: err instanceof Error ? err.message : String(err),
      usedFallback: true,
    });
    return {
      events,
      outcome: {
        data: null,
        result: null,
        usedFallback: true,
        durationMs: Date.now() - started,
      },
    };
  }
}

type SynthesisStageResult<T> = {
  events: ResearchProgressEvent[];
  data: T | null;
  usedFallback: boolean;
  durationMs: number;
};

/** Synthesis stage — ungrounded JSON call against Pro or Flash. */
async function runSynthesisStage<T>(opts: {
  stage: ResearchStageId;
  prompt: string;
  schema: import("zod").ZodSchema<T>;
  model: "flash" | "pro";
  preview: (data: T) => string;
  fallback: () => T;
}): Promise<SynthesisStageResult<T>> {
  const events: ResearchProgressEvent[] = [];
  const started = Date.now();
  events.push({
    type: "stage_started",
    stage: opts.stage,
    label: STAGE_LABELS[opts.stage],
  });
  try {
    const fn = opts.model === "pro" ? geminiProJSON<unknown> : geminiFlashJSON<unknown>;
    const raw = await fn(opts.prompt);
    const parsed = opts.schema.safeParse(raw);
    if (!parsed.success) {
      const fallback = opts.fallback();
      events.push({
        type: "stage_failed",
        stage: opts.stage,
        error: `validation failed: ${parsed.error.issues[0]?.message ?? "unknown"}`,
        usedFallback: true,
      });
      return {
        events,
        data: fallback,
        usedFallback: true,
        durationMs: Date.now() - started,
      };
    }
    events.push({
      type: "stage_completed",
      stage: opts.stage,
      preview: opts.preview(parsed.data),
      durationMs: Date.now() - started,
    });
    return {
      events,
      data: parsed.data,
      usedFallback: false,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    const fallback = opts.fallback();
    events.push({
      type: "stage_failed",
      stage: opts.stage,
      error: err instanceof Error ? err.message : String(err),
      usedFallback: true,
    });
    return {
      events,
      data: fallback,
      usedFallback: true,
      durationMs: Date.now() - started,
    };
  }
}

/* -------------------------------------------------------------------------- */
/* The orchestrator                                                            */
/* -------------------------------------------------------------------------- */

export async function* runDeepResearch(
  input: RunResearchInput,
): AsyncGenerator<ResearchProgressEvent, DeepResearchReport> {
  const startedAt = Date.now();
  const meta = RESEARCH_MODE_META[input.mode];
  const country = COUNTRIES[input.countryCode] ?? COUNTRIES.US;
  const productForPrompts: ProductInput = {
    name: input.product.name,
    description: input.product.description,
    category: input.product.category,
    costUSD: input.product.costUSD,
    suggestedPriceUSD: input.product.suggestedPriceUSD,
    shippingCostUSD: input.product.shippingCostUSD,
  };

  const fallbacksTriggered: string[] = [];
  const modelsUsed = new Set<string>();
  const stagesRun: ResearchStageId[] = [];

  /* ----------------------- PHASE 1 — discovery ---------------------------- */
  yield { type: "phase_started", phase: 1 as ResearchPhase };

  const discoveryStarts = await launchDiscovery(productForPrompts, country, input, meta);
  const discoveryResults = await Promise.all(discoveryStarts);
  // Replay events from each parallel call in stage order.
  for (const r of discoveryResults) {
    for (const ev of r.events) yield ev;
  }

  // Merge sources
  const sourceBuckets = discoveryResults.map((r) => ({
    stage: r.stage,
    result: r.outcome.result as GroundedCallResult<unknown> | null,
  }));
  const { global: globalSources } = mergeSources(sourceBuckets);

  // Build the typed bundle for synthesis prompts
  const discoveryBundle: DiscoveryBundle = {
    sources: globalSources,
  };
  for (const r of discoveryResults) {
    stagesRun.push(r.stage);
    if (r.outcome.usedFallback) fallbacksTriggered.push(r.stage);
    modelsUsed.add(
      meta.groundingModel === "pro" ? "gemini-2.5-pro" : "gemini-2.5-flash",
    );
    if (!r.outcome.data) continue;
    switch (r.stage) {
      case "quick_signals":
        discoveryBundle.quickSignals = r.outcome.data as QuickSignalsOutput;
        break;
      case "landscape":
        discoveryBundle.landscape = r.outcome.data as LandscapeOutput;
        break;
      case "voice":
        discoveryBundle.voice = r.outcome.data as VoiceOutput;
        break;
      case "competitors_discovery":
        discoveryBundle.competitors = r.outcome.data as CompetitorsOutput;
        break;
      case "trends":
        discoveryBundle.trends = r.outcome.data as TrendsOutput;
        break;
      case "country_context":
        discoveryBundle.countryContext = r.outcome.data as CountryContextOutput;
        break;
    }
  }

  // Concatenate every search query Gemini ran across all discovery calls.
  const searchQueriesRun: string[] = [];
  for (const r of discoveryResults) {
    if (r.outcome.result) searchQueriesRun.push(...r.outcome.result.searchQueries);
  }

  yield { type: "phase_completed", phase: 1 as ResearchPhase };

  /* ----------------------- PHASE 2 — synthesis ---------------------------- */
  yield { type: "phase_started", phase: 2 as ResearchPhase };

  // Personas always run.
  const personasJob = runSynthesisStage<{ personas: Persona[] }>({
    stage: "personas",
    prompt: buildPersonasPrompt(
      productForPrompts,
      country,
      discoveryBundle,
      meta.personaCount,
      input.userContext,
    ),
    schema: personaSetSchema,
    model: input.mode === "deep" ? "pro" : "flash",
    preview: (d) =>
      `${d.personas.length} persona${d.personas.length === 1 ? "" : "s"} crafted`,
    fallback: () => ({ personas: fallbackPersonas(meta.personaCount) }),
  });

  // Other synthesis stages depending on the tier.
  const synthesisJobs: Promise<SynthesisStageResult<unknown>>[] = [
    personasJob as Promise<SynthesisStageResult<unknown>>,
  ];

  if (meta.synthesisStages.includes("pricing")) {
    synthesisJobs.push(
      runSynthesisStage<PricingStrategy>({
        stage: "pricing",
        prompt: buildPricingPrompt(
          productForPrompts,
          country,
          discoveryBundle,
          input.userContext,
        ),
        schema: pricingStrategySchema,
        model: input.mode === "deep" ? "pro" : "flash",
        preview: (d) => `$${d.recommendedPrice} (anchor $${d.anchorPrice})`,
        fallback: () => fallbackPricing(input.product.suggestedPriceUSD),
      }) as Promise<SynthesisStageResult<unknown>>,
    );
  }

  if (meta.synthesisStages.includes("competition_synthesis")) {
    synthesisJobs.push(
      runSynthesisStage<CompetitorLandscape>({
        stage: "competition_synthesis",
        prompt: buildCompetitionPrompt(
          productForPrompts,
          country,
          discoveryBundle,
          input.userContext,
        ),
        schema: competitorLandscapeSchema,
        model: "flash",
        preview: (d) => `${d.saturationLevel} (${d.saturationScore}/100)`,
        fallback: () => fallbackCompetitors(),
      }) as Promise<SynthesisStageResult<unknown>>,
    );
  }

  if (meta.synthesisStages.includes("risk")) {
    synthesisJobs.push(
      runSynthesisStage<RiskAnalysis>({
        stage: "risk",
        prompt: buildRiskPrompt(
          productForPrompts,
          country,
          discoveryBundle,
          input.userContext,
        ),
        schema: riskAnalysisSchema,
        model: "pro",
        preview: (d) => `${d.redFlags.length} risk${d.redFlags.length === 1 ? "" : "s"} flagged`,
        fallback: () => fallbackRisk(),
      }) as Promise<SynthesisStageResult<unknown>>,
    );
  }

  if (meta.synthesisStages.includes("launch_playbook")) {
    synthesisJobs.push(
      runSynthesisStage<LaunchPlaybook>({
        stage: "launch_playbook",
        prompt: buildLaunchPlaybookPrompt(
          productForPrompts,
          country,
          discoveryBundle,
          null,
          input.userContext,
        ),
        schema: launchPlaybookSchema,
        model: "pro",
        preview: (d) => `14-day plan · $${d.totalBudget} budget`,
        fallback: () => fallbackPlaybook(input.product.suggestedPriceUSD),
      }) as Promise<SynthesisStageResult<unknown>>,
    );
  }

  // Wait for personas + other phase-2 stages (except hook_angles which needs personas).
  const phaseTwoResults = await Promise.all(synthesisJobs);
  for (const r of phaseTwoResults) {
    for (const ev of r.events) yield ev;
  }

  // Pluck typed results out by stage.
  const personas: Persona[] =
    (phaseTwoResults[0].data as { personas: Persona[] } | null)?.personas ??
    fallbackPersonas(meta.personaCount);
  let pricing: PricingStrategy | null = null;
  let competition: CompetitorLandscape | null = null;
  let risk: RiskAnalysis | null = null;
  let playbook: LaunchPlaybook | null = null;
  for (const r of phaseTwoResults) {
    if (r.usedFallback) fallbacksTriggered.push("synthesis");
    if (!r.data) continue;
    const d = r.data as Record<string, unknown>;
    if ("recommendedPrice" in d) pricing = r.data as unknown as PricingStrategy;
    else if ("saturationScore" in d) competition = r.data as unknown as CompetitorLandscape;
    else if ("redFlags" in d) risk = r.data as unknown as RiskAnalysis;
    else if ("totalDays" in d) playbook = r.data as unknown as LaunchPlaybook;
  }

  // Hook angles depend on personas — run after.
  const anglesResult = await runSynthesisStage<{ angles: HookAngle[] }>({
    stage: "hook_angles",
    prompt: buildHookAnglesPrompt(
      productForPrompts,
      country,
      discoveryBundle,
      personas,
      meta.angleCount,
      input.userContext,
    ),
    schema: hookAngleSetSchema,
    model: meta.angleModel,
    preview: (d) => `${d.angles.length} angle${d.angles.length === 1 ? "" : "s"} generated`,
    fallback: () => ({ angles: legacyToHookAngles(fallbackAdAngles(), personas) }),
  });
  for (const ev of anglesResult.events) yield ev;
  if (anglesResult.usedFallback) fallbacksTriggered.push("hook_angles");
  const hookAngles: HookAngle[] = anglesResult.data?.angles ?? [];

  stagesRun.push(...meta.synthesisStages);
  modelsUsed.add(meta.angleModel === "pro" ? "gemini-2.5-pro" : "gemini-2.5-flash");

  yield { type: "phase_completed", phase: 2 as ResearchPhase };

  /* ----------------------- PHASE 3 — verdict ----------------------------- */
  yield { type: "phase_started", phase: 3 as ResearchPhase };

  const verdictResult = await runSynthesisStage<FinalVerdict>({
    stage: "final_verdict",
    prompt: buildVerdictPrompt(
      productForPrompts,
      country,
      discoveryBundle,
      {
        personas,
        angles: hookAngles,
        pricing,
        competition,
      },
      input.userContext,
    ),
    schema: finalVerdictSchema,
    model: input.mode === "deep" ? "pro" : "flash",
    preview: (d) => `${d.verdict.toUpperCase()} · score ${d.sellScore}`,
    fallback: () => fallbackVerdict(input.product.suggestedPriceUSD),
  });
  for (const ev of verdictResult.events) yield ev;
  if (verdictResult.usedFallback) fallbacksTriggered.push("final_verdict");
  const verdict: FinalVerdict = verdictResult.data ??
    fallbackVerdict(input.product.suggestedPriceUSD);

  stagesRun.push("final_verdict");
  modelsUsed.add(input.mode === "deep" ? "gemini-2.5-pro" : "gemini-2.5-flash");

  yield { type: "phase_completed", phase: 3 as ResearchPhase };

  /* ----------------------- Assemble report ------------------------------- */

  // Average per-stage confidence — drives groundingQualityScore.
  const avgConfidence = ((): "low" | "medium" | "high" => {
    const confidences: ("low" | "medium" | "high")[] = [];
    if (discoveryBundle.landscape) confidences.push(discoveryBundle.landscape.confidence);
    if (discoveryBundle.voice) confidences.push(discoveryBundle.voice.confidence);
    if (discoveryBundle.competitors) confidences.push(discoveryBundle.competitors.confidence);
    if (discoveryBundle.quickSignals) confidences.push(discoveryBundle.quickSignals.confidence);
    if (discoveryBundle.trends) confidences.push(discoveryBundle.trends.confidence);
    if (discoveryBundle.countryContext) confidences.push(discoveryBundle.countryContext.confidence);
    if (confidences.length === 0) return "low";
    const highs = confidences.filter((c) => c === "high").length;
    const lows = confidences.filter((c) => c === "low").length;
    if (highs >= confidences.length / 2) return "high";
    if (lows >= confidences.length / 2) return "low";
    return "medium";
  })();

  const groundingQualityScore = computeGroundingQuality({
    sourceCount: globalSources.length,
    queryCount: searchQueriesRun.length,
    averageConfidence: avgConfidence,
  });

  const ungroundedFallback = discoveryResults.every((r) => r.outcome.usedFallback);

  const report: DeepResearchReport = {
    id: nanoid(10),
    productId: "",
    generatedAt: new Date().toISOString(),
    mode: input.mode,
    productSnapshot: {
      name: input.product.name,
      description: input.product.description,
      image: input.product.image,
      countryCode: country.code,
      countryName: country.name,
      countryFlag: country.flag,
      costUSD: input.product.costUSD,
      suggestedPriceUSD: input.product.suggestedPriceUSD,
    },
    personas,
    competitorLandscape: competition ?? undefined,
    pricingStrategy: pricing ?? undefined,
    adAngles: [], // legacy — empty in the new flow
    hookAngles,
    launchPlaybook: playbook ?? undefined,
    riskAnalysis: risk ?? undefined,
    finalVerdict: verdict,
    methodology: {
      modelsUsed: [...modelsUsed],
      stagesRun,
      durationMs: Date.now() - startedAt,
      fallbacksTriggered,
    },
    sources: globalSources,
    searchQueriesRun,
    groundingQualityScore,
    ungroundedFallback,
  };

  yield { type: "research_completed", reportId: report.id };
  return report;
}

/* -------------------------------------------------------------------------- */
/* Phase-1 launcher — fires every discovery stage for the tier in parallel    */
/* -------------------------------------------------------------------------- */

type DiscoveryRunResult = {
  stage: ResearchStageId;
  events: ResearchProgressEvent[];
  outcome: PhaseOneResult<unknown>;
};

async function launchDiscovery(
  product: ProductInput,
  country: Country,
  input: RunResearchInput,
  meta: typeof RESEARCH_MODE_META[ResearchMode],
): Promise<Promise<DiscoveryRunResult>[]> {
  const jobs: Promise<DiscoveryRunResult>[] = [];
  const model = meta.groundingModel;

  for (const stage of meta.discoveryStages) {
    if (STAGE_PHASE[stage] !== 1) continue;
    const job: Promise<DiscoveryRunResult> = (async () => {
      switch (stage) {
        case "quick_signals": {
          const r = await runGroundedStage<QuickSignalsOutput>({
            stage,
            prompt: buildQuickSignalsPrompt(product, country, input.userContext),
            schema: quickSignalsSchema,
            model,
          });
          return { stage, events: r.events, outcome: r.outcome };
        }
        case "landscape": {
          const r = await runGroundedStage<LandscapeOutput>({
            stage,
            prompt: buildLandscapePrompt(product, country, input.userContext),
            schema: landscapeSchema,
            model,
          });
          return { stage, events: r.events, outcome: r.outcome };
        }
        case "voice": {
          const r = await runGroundedStage<VoiceOutput>({
            stage,
            prompt: buildVoicePrompt(product, country, input.userContext),
            schema: voiceSchema,
            model,
          });
          return { stage, events: r.events, outcome: r.outcome };
        }
        case "competitors_discovery": {
          const r = await runGroundedStage<CompetitorsOutput>({
            stage,
            prompt: buildCompetitorsPrompt(product, country, input.userContext),
            schema: competitorsSchema,
            model,
          });
          return { stage, events: r.events, outcome: r.outcome };
        }
        case "trends": {
          const r = await runGroundedStage<TrendsOutput>({
            stage,
            prompt: buildTrendsPrompt(product, country, input.userContext),
            schema: trendsSchema,
            model,
          });
          return { stage, events: r.events, outcome: r.outcome };
        }
        case "country_context": {
          const r = await runGroundedStage<CountryContextOutput>({
            stage,
            prompt: buildCountryContextPrompt(product, country, input.userContext),
            schema: countryContextSchema,
            model,
          });
          return { stage, events: r.events, outcome: r.outcome };
        }
        default:
          // Unreachable for discovery stages; satisfies exhaustive switch.
          return {
            stage,
            events: [],
            outcome: { data: null, result: null, usedFallback: true, durationMs: 0 },
          };
      }
    })();
    jobs.push(job);
  }
  return jobs;
}

/* -------------------------------------------------------------------------- */
/* Legacy AdAngle[] → HookAngle[] adapter (fallback path)                     */
/* -------------------------------------------------------------------------- */

import type { AdAngle } from "@/types/research";

function legacyToHookAngles(legacy: AdAngle[], personas: Persona[]): HookAngle[] {
  const targetPersonaId = personas[0]?.id ?? "p1";
  return legacy.map((a, i): HookAngle => ({
    id: a.id,
    rank: i + 1,
    awarenessLevel: a.awarenessLevel,
    emotionalDriver: "curiosity",
    targetPersonaId,
    primaryHook: a.hook,
    hookVariants: [],
    firstFrameDescription: a.scriptStructure.opening,
    visualHookIdeas: [],
    scriptStructure: {
      opening: a.scriptStructure.opening,
      problem: a.scriptStructure.middle,
      solution: a.scriptStructure.middle,
      cta: a.scriptStructure.close,
    },
    platformFit: {
      meta: { score: a.platformFit.meta, reasoning: "fallback estimate" },
      tiktok: { score: a.platformFit.tiktok, reasoning: "fallback estimate" },
      youtube: { score: 40, reasoning: "fallback estimate" },
      googleAds: { score: a.platformFit.googleAds, reasoning: "fallback estimate" },
    },
    captionVariations: [a.angle],
    ctaVariations: [a.scriptStructure.close],
    whyThisWorks: "Fallback angle — Gemini call failed.",
    groundedInSignals: [],
    sources: [],
    confidence: "low",
  }));
}

/** Whether the engine is configured to run real Gemini calls. */
export function isResearchEngineLive(): boolean {
  return isGeminiAvailable();
}
