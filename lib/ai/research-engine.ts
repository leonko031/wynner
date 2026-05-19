import { nanoid } from "nanoid";
import type { z, ZodSchema } from "zod";
import { geminiFlashJSON, geminiProJSON, isGeminiAvailable } from "@/lib/ai/gemini";
import { COUNTRIES } from "@/lib/data/countries";
import {
  RESEARCH_MODE_META,
  STAGE_LABELS,
  adAngleSetSchema,
  competitorLandscapeSchema,
  finalVerdictSchema,
  launchPlaybookSchema,
  marketAnalysisSchema,
  personaSetSchema,
  pricingStrategySchema,
  productIntelligenceSchema,
  riskAnalysisSchema,
  type AdAngle,
  type CompetitorLandscape,
  type DeepResearchReport,
  type FinalVerdict,
  type LaunchPlaybook,
  type MarketAnalysis,
  type Persona,
  type PricingStrategy,
  type ProductIntelligence,
  type ResearchMode,
  type ResearchProgressEvent,
  type ResearchStageId,
  type RiskAnalysis,
} from "@/types/research";
import { buildProductIntelligencePrompt } from "@/lib/ai/prompts/research/product-intelligence";
import { buildMarketAnalysisPrompt } from "@/lib/ai/prompts/research/market-analysis";
import { buildPersonaSynthesisPrompt } from "@/lib/ai/prompts/research/persona-synthesis";
import { buildCompetitorLandscapePrompt } from "@/lib/ai/prompts/research/competitor-landscape";
import { buildPricingStrategyPrompt } from "@/lib/ai/prompts/research/pricing-strategy";
import { buildAdAngleGenerationPrompt } from "@/lib/ai/prompts/research/ad-angle-generation";
import { buildLaunchPlaybookPrompt } from "@/lib/ai/prompts/research/launch-playbook";
import { buildRiskVerdictPrompt } from "@/lib/ai/prompts/research/risk-verdict";
import { thinkingFor } from "@/lib/ai/prompts/research/thinking";
import type { ProductInput } from "@/lib/ai/prompts/research/shared";
import {
  fallbackAdAngles,
  fallbackCompetitors,
  fallbackMarketAnalysis,
  fallbackPersonas,
  fallbackPlaybook,
  fallbackPricing,
  fallbackProductIntel,
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

type StageRunner<T> = {
  stage: ResearchStageId;
  /** "flash" or "pro" — pro is used for the heaviest stages in deep mode. */
  model: "flash" | "pro";
  prompt: string;
  schema: ZodSchema<T>;
  fallback: () => T;
};

/**
 * Run a single stage with timeout, validation, and graceful fallback.
 * Emits stage_thinking events between work — the SSE client uses these for
 * the live feed.
 */
async function* runStage<T>(
  runner: StageRunner<T>,
  thoughts: string[],
): AsyncGenerator<ResearchProgressEvent, { data: T; usedFallback: boolean; durationMs: number; error?: string }> {
  const started = Date.now();
  yield { type: "stage_started", stage: runner.stage, label: STAGE_LABELS[runner.stage] };

  // Drip the scripted thoughts at roughly 800ms intervals while the call is in
  // flight. We yield them in a separate generator and Promise.race against the
  // model call, but since async-gens make that awkward we just fire them ahead
  // of the call — they hit the SSE stream while the model is still chewing.
  for (const t of thoughts) {
    yield { type: "stage_thinking", stage: runner.stage, thought: t };
  }

  try {
    const fn = runner.model === "pro" ? geminiProJSON<T> : geminiFlashJSON<T>;
    const raw = await fn(runner.prompt);
    const parsed = runner.schema.safeParse(raw);
    if (!parsed.success) {
      const fallback = runner.fallback();
      yield {
        type: "stage_failed",
        stage: runner.stage,
        error: `validation failed: ${parsed.error.issues[0]?.message ?? "unknown"}`,
        usedFallback: true,
      };
      return { data: fallback, usedFallback: true, durationMs: Date.now() - started, error: "validation_failed" };
    }
    yield {
      type: "stage_completed",
      stage: runner.stage,
      preview: previewFor(runner.stage, parsed.data as unknown),
      durationMs: Date.now() - started,
    };
    return { data: parsed.data, usedFallback: false, durationMs: Date.now() - started };
  } catch (err) {
    const fallback = runner.fallback();
    yield {
      type: "stage_failed",
      stage: runner.stage,
      error: err instanceof Error ? err.message : String(err),
      usedFallback: true,
    };
    return {
      data: fallback,
      usedFallback: true,
      durationMs: Date.now() - started,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

function previewFor(stage: ResearchStageId, data: unknown): string {
  if (!data || typeof data !== "object") return "Completed.";
  const d = data as Record<string, unknown>;
  switch (stage) {
    case "product_intelligence":
      return `Mapped to ${(d.subcategory as string) ?? "category"} · novelty ${d.noveltyScore}/100`;
    case "market_analysis":
      return `Demand ${d.demandLevel} · ${d.growthTrend}`;
    case "persona_synthesis":
      return `Built ${Array.isArray(d.personas) ? d.personas.length : 0} buyer archetype${Array.isArray(d.personas) && d.personas.length === 1 ? "" : "s"}`;
    case "competitor_landscape":
      return `Saturation ${d.saturationLevel} (${d.saturationScore}/100)`;
    case "pricing_strategy":
      return `Recommends $${d.recommendedPrice} · anchor $${d.anchorPrice}`;
    case "ad_angles": {
      const angles = Array.isArray(d.angles) ? d.angles : [];
      return `Generated ${angles.length} angles across the awareness spectrum`;
    }
    case "launch_playbook":
      return `14-day plan · $${d.totalBudget} budget · ${d.expectedROAS}× ROAS target`;
    case "risk_verdict":
      return `Verdict ${(d.verdict as string)?.toUpperCase()} · score ${d.sellScore}`;
  }
}

/**
 * Drains an async generator that yields events and returns a final value.
 * Bridges sub-generators (one per stage) back into the parent.
 */
async function* drain<T>(
  gen: AsyncGenerator<ResearchProgressEvent, T>,
): AsyncGenerator<ResearchProgressEvent, T> {
  while (true) {
    const r = await gen.next();
    if (r.done) return r.value;
    yield r.value;
  }
}

/**
 * Master orchestrator. Yields progress events as the work happens; finally
 * returns a complete DeepResearchReport. The SSE route translates each event
 * into a `data:` line on the wire; the client renders the live feed.
 */
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

  // -------- Stage 1: product intelligence (always runs first) ----------------
  const piResult = yield* drain(
    runStage<ProductIntelligence>(
      {
        stage: "product_intelligence",
        model: "flash",
        prompt: buildProductIntelligencePrompt(productForPrompts, input.userContext),
        schema: productIntelligenceSchema,
        fallback: () => fallbackProductIntel(input.product.name, String(input.product.category)),
      },
      thinkingFor("product_intelligence", productForPrompts, country),
    ),
  );
  modelsUsed.add("gemini-2.5-flash");
  if (piResult.usedFallback) fallbacksTriggered.push("product_intelligence");

  // -------- Stage 2: market analysis (standard + deep) -----------------------
  let market: MarketAnalysis | undefined;
  if (meta.stages.includes("market_analysis")) {
    const r = yield* drain(
      runStage<MarketAnalysis>(
        {
          stage: "market_analysis",
          model: input.mode === "deep" ? "pro" : "flash",
          prompt: buildMarketAnalysisPrompt(productForPrompts, country, input.userContext),
          schema: marketAnalysisSchema,
          fallback: () => fallbackMarketAnalysis(country.code),
        },
        thinkingFor("market_analysis", productForPrompts, country),
      ),
    );
    market = r.data;
    modelsUsed.add(input.mode === "deep" ? "gemini-2.5-pro" : "gemini-2.5-flash");
    if (r.usedFallback) fallbacksTriggered.push("market_analysis");
  }

  // -------- Stage 3: persona synthesis (all modes) ---------------------------
  const personaResult = yield* drain(
    runStage<z.infer<typeof personaSetSchema>>(
      {
        stage: "persona_synthesis",
        model: input.mode === "deep" ? "pro" : "flash",
        prompt: buildPersonaSynthesisPrompt(
          productForPrompts,
          country,
          meta.personaCount,
          input.userContext,
        ),
        schema: personaSetSchema,
        fallback: () => ({ personas: fallbackPersonas(meta.personaCount) }),
      },
      thinkingFor("persona_synthesis", productForPrompts, country),
    ),
  );
  modelsUsed.add(input.mode === "deep" ? "gemini-2.5-pro" : "gemini-2.5-flash");
  const personas: Persona[] = personaResult.data.personas;
  if (personaResult.usedFallback) fallbacksTriggered.push("persona_synthesis");

  // -------- Stage 4: competitor landscape (standard + deep) ------------------
  let competitors: CompetitorLandscape | undefined;
  if (meta.stages.includes("competitor_landscape")) {
    const r = yield* drain(
      runStage<CompetitorLandscape>(
        {
          stage: "competitor_landscape",
          model: "flash",
          prompt: buildCompetitorLandscapePrompt(productForPrompts, country, input.userContext),
          schema: competitorLandscapeSchema,
          fallback: () => fallbackCompetitors(),
        },
        thinkingFor("competitor_landscape", productForPrompts, country),
      ),
    );
    competitors = r.data;
    modelsUsed.add("gemini-2.5-flash");
    if (r.usedFallback) fallbacksTriggered.push("competitor_landscape");
  }

  // -------- Stage 5: pricing strategy (standard + deep) ----------------------
  let pricing: PricingStrategy | undefined;
  if (meta.stages.includes("pricing_strategy")) {
    const r = yield* drain(
      runStage<PricingStrategy>(
        {
          stage: "pricing_strategy",
          model: "flash",
          prompt: buildPricingStrategyPrompt(
            productForPrompts,
            country,
            competitors ?? null,
            input.userContext,
          ),
          schema: pricingStrategySchema,
          fallback: () => fallbackPricing(input.product.suggestedPriceUSD),
        },
        thinkingFor("pricing_strategy", productForPrompts, country),
      ),
    );
    pricing = r.data;
    modelsUsed.add("gemini-2.5-flash");
    if (r.usedFallback) fallbacksTriggered.push("pricing_strategy");
  }

  // -------- Stage 6: ad angles (standard + deep) -----------------------------
  let angles: AdAngle[] = [];
  if (meta.stages.includes("ad_angles")) {
    const r = yield* drain(
      runStage<z.infer<typeof adAngleSetSchema>>(
        {
          stage: "ad_angles",
          model: input.mode === "deep" ? "pro" : "flash",
          prompt: buildAdAngleGenerationPrompt(
            productForPrompts,
            country,
            personas,
            input.mode === "deep" ? 6 : 5,
            input.userContext,
          ),
          schema: adAngleSetSchema,
          fallback: () => ({ angles: fallbackAdAngles() }),
        },
        thinkingFor("ad_angles", productForPrompts, country),
      ),
    );
    angles = r.data.angles;
    modelsUsed.add(input.mode === "deep" ? "gemini-2.5-pro" : "gemini-2.5-flash");
    if (r.usedFallback) fallbacksTriggered.push("ad_angles");
  }

  // -------- Stage 7: 14-day playbook (deep only) -----------------------------
  let playbook: LaunchPlaybook | undefined;
  if (meta.stages.includes("launch_playbook")) {
    const r = yield* drain(
      runStage<LaunchPlaybook>(
        {
          stage: "launch_playbook",
          model: "pro",
          prompt: buildLaunchPlaybookPrompt(productForPrompts, country, pricing ?? null, input.userContext),
          schema: launchPlaybookSchema,
          fallback: () => fallbackPlaybook(input.product.suggestedPriceUSD),
        },
        thinkingFor("launch_playbook", productForPrompts, country),
      ),
    );
    playbook = r.data;
    modelsUsed.add("gemini-2.5-pro");
    if (r.usedFallback) fallbacksTriggered.push("launch_playbook");
  }

  // -------- Stage 8: risk + verdict (always last) ----------------------------
  // Risk and verdict are derived together — we ask Gemini to return both in a
  // single call so the verdict reasoning has access to the same red-flag list.
  type CombinedSchema = z.infer<typeof finalVerdictSchema> & { redFlags?: z.infer<typeof riskAnalysisSchema>["redFlags"]; riskConfidence?: "low" | "medium" | "high" };

  const combinedResult = yield* drain(
    runStage<CombinedSchema>(
      {
        stage: "risk_verdict",
        model: input.mode === "deep" ? "pro" : "flash",
        prompt: buildRiskVerdictPrompt(
          productForPrompts,
          country,
          {
            productIntelligence: piResult.data,
            marketAnalysis: market,
            personas,
            competitorLandscape: competitors,
            pricingStrategy: pricing,
            adAngles: angles,
            launchPlaybook: playbook,
          },
          input.userContext,
        ),
        // The combined prompt extends finalVerdictSchema with optional redFlags.
        // Validate the core verdict — we manually pull out redFlags after.
        schema: finalVerdictSchema.passthrough() as unknown as ZodSchema<CombinedSchema>,
        fallback: () => ({
          ...fallbackVerdict(input.product.suggestedPriceUSD),
          redFlags: fallbackRisk().redFlags,
          riskConfidence: "low",
        }),
      },
      thinkingFor("risk_verdict", productForPrompts, country),
    ),
  );
  modelsUsed.add(input.mode === "deep" ? "gemini-2.5-pro" : "gemini-2.5-flash");
  if (combinedResult.usedFallback) fallbacksTriggered.push("risk_verdict");

  const verdict: FinalVerdict = {
    sellScore: combinedResult.data.sellScore,
    verdict: combinedResult.data.verdict,
    summary: combinedResult.data.summary,
    confidenceLevel: combinedResult.data.confidenceLevel,
    comparableProducts: combinedResult.data.comparableProducts ?? [],
    pillars: combinedResult.data.pillars,
    topAngle: combinedResult.data.topAngle,
  };
  const risk: RiskAnalysis = {
    redFlags:
      combinedResult.data.redFlags && combinedResult.data.redFlags.length > 0
        ? combinedResult.data.redFlags
        : fallbackRisk().redFlags,
    confidenceLevel: combinedResult.data.riskConfidence ?? "medium",
  };

  // -------- Assemble final report -------------------------------------------
  const report: DeepResearchReport = {
    id: nanoid(10),
    productId: "", // filled in by the route handler before persisting
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
    productIntelligence: piResult.data,
    marketAnalysis: market,
    personas,
    competitorLandscape: competitors,
    pricingStrategy: pricing,
    adAngles: angles,
    launchPlaybook: playbook,
    riskAnalysis: risk,
    finalVerdict: verdict,
    methodology: {
      modelsUsed: [...modelsUsed],
      stagesRun: meta.stages,
      durationMs: Date.now() - startedAt,
      fallbacksTriggered,
    },
  };

  yield { type: "research_completed", reportId: report.id };
  return report;
}

/** Whether the engine is configured to run real Gemini calls. */
export function isResearchEngineLive(): boolean {
  return isGeminiAvailable();
}
