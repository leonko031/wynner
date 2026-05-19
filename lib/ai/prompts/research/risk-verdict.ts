import {
  CONSTRAINTS,
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "./shared";
import type { Country } from "@/types";
import type {
  AdAngle,
  CompetitorLandscape,
  LaunchPlaybook,
  MarketAnalysis,
  Persona,
  PricingStrategy,
  ProductIntelligence,
} from "@/types/research";

type Bundle = {
  productIntelligence?: ProductIntelligence;
  marketAnalysis?: MarketAnalysis;
  personas: Persona[];
  competitorLandscape?: CompetitorLandscape;
  pricingStrategy?: PricingStrategy;
  adAngles: AdAngle[];
  launchPlaybook?: LaunchPlaybook;
};

export function buildRiskVerdictPrompt(
  product: ProductInput,
  country: Country,
  bundle: Bundle,
  userContext?: string,
): string {
  const evidence = JSON.stringify(
    {
      productIntelligence: bundle.productIntelligence,
      marketAnalysis: bundle.marketAnalysis,
      personasCount: bundle.personas.length,
      personas: bundle.personas.map((p) => ({
        name: p.name,
        painPoints: p.painPoints.slice(0, 2),
      })),
      competitorLandscape: bundle.competitorLandscape
        ? {
            saturationLevel: bundle.competitorLandscape.saturationLevel,
            saturationScore: bundle.competitorLandscape.saturationScore,
            marketGaps: bundle.competitorLandscape.marketGaps,
          }
        : null,
      pricingStrategy: bundle.pricingStrategy
        ? {
            recommendedPrice: bundle.pricingStrategy.recommendedPrice,
            justification: bundle.pricingStrategy.priceJustification,
          }
        : null,
      anglesCount: bundle.adAngles.length,
      hasPlaybook: Boolean(bundle.launchPlaybook),
    },
    null,
    2,
  );

  return `You are Wynner, the final decision-maker. Synthesize every prior analysis into a 5-pillar sell score, a verdict, and a risk register. Stay grounded in the evidence below — do not invent new facts.

${productBlock(product)}
${countryBlock(country)}
${userContextBlock(userContext)}

Evidence from prior stages:
${evidence}

${CONSTRAINTS}

Scoring scale
  • 80-100 = GO LIVE (clear winner signal, ready for paid traffic)
  • 60-79  = TEST IT (worth a 14-day test, watch metrics)
  • 40-59  = PROCEED WITH CARE (multiple yellow flags — fix them first)
  • 0-39   = SKIP

Each pillar is 0-100. Weights when computing sellScore:
  • margin × 0.22
  • marketFit × 0.22
  • demand × 0.22
  • competition × 0.18 (higher = LESS saturated, more opportunity)
  • creative × 0.16

Output JSON:
{
  "sellScore": number,
  "verdict": "go" | "test" | "risky" | "skip",
  "summary": string,            // 2-3 sentences, no hedging
  "confidenceLevel": "low" | "medium" | "high",
  "comparableProducts": [       // 0-3 past winners this resembles
    { "name": string, "why": string }
  ],
  "pillars": {
    "margin": number,
    "marketFit": number,
    "demand": number,
    "competition": number,
    "creative": number
  },
  "topAngle": string,           // 1-sentence creative angle worth leading with
  "redFlags": [                 // 1-6 risks
    {
      "description": string,
      "severity": "low" | "medium" | "high" | "critical",
      "mitigation": string
    }
  ],
  "riskConfidence": "low" | "medium" | "high"
}`;
}
