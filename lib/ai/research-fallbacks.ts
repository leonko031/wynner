/**
 * Typed fallback values for every research stage. The orchestrator uses these
 * when a Gemini call fails or its output fails Zod validation — never crashes
 * the pipeline. Each fallback is intentionally generic but plausibly shaped so
 * the UI doesn't break when fallback data renders.
 */

import type {
  AdAngle,
  CompetitorLandscape,
  FinalVerdict,
  LaunchPlaybook,
  MarketAnalysis,
  Persona,
  PricingStrategy,
  ProductIntelligence,
  RiskAnalysis,
} from "@/types/research";

export function fallbackProductIntel(name: string, category: string): ProductIntelligence {
  return {
    category,
    subcategory: "general",
    primaryUseCase: `Everyday use case for ${name}.`,
    problemSolved: "Solves a recurring everyday pain in this category.",
    noveltyScore: 50,
    viralPotential: 50,
    tags: [category.toLowerCase()],
    emotionalTriggers: ["convenience", "self-image"],
    confidenceLevel: "low",
  };
}

export function fallbackMarketAnalysis(countryCode: string): MarketAnalysis {
  return {
    countryCode,
    demandLevel: "moderate",
    seasonality: {
      peakMonths: ["November", "December"],
      lowMonths: ["February", "August"],
      currentPosition: "approaching-peak",
    },
    marketSizeEstimate: "Mid-sized category with steady demand.",
    growthTrend: "growing",
    regulatoryNotes: [],
    confidenceLevel: "low",
  };
}

export function fallbackPersonas(count: 1 | 2 | 3): Persona[] {
  const base: Persona = {
    id: "p1",
    name: "Alex",
    age: 34,
    occupation: "Knowledge worker",
    income: "€40–60k",
    location: "Major city",
    lifestyle: "Busy, online-first, mid-income.",
    personalityTraits: ["pragmatic", "skeptical"],
    painPoints: [
      "Wants a quick fix that actually works",
      "Tired of products that overpromise",
      "Limited time to research alternatives",
    ],
    desiredOutcomes: ["Solves the problem in under a week", "Doesn't feel like a scam"],
    objections: ["Is this actually different?", "What if it doesn't work?"],
    buyingTriggers: ["Strong before/after demo", "Real review thread"],
    languagePatterns: ["does this actually work", "tried 3 of these already", "skeptical but tempted"],
    platformBehavior: "Browses TikTok in the evening, scrolls Instagram on commute.",
    dayInTheLife: "Wakes up early, gets through a packed workday, looks for small wins to feel in control.",
    realQuoteStyle: "anyone tried this? looks too good to be true",
    avatarDescription: "Tired but stylish adult in casual clothes.",
    confidenceLevel: "low",
  };
  return Array.from({ length: count }, (_, i) => ({
    ...base,
    id: `p${i + 1}`,
    name: ["Alex", "Sam", "Jordan"][i] ?? `Persona ${i + 1}`,
  }));
}

export function fallbackCompetitors(): CompetitorLandscape {
  return {
    saturationScore: 55,
    saturationLevel: "competitive",
    topAdvertiserArchetypes: [
      {
        name: "Generic drop-shipper",
        approach: "Low price, AliExpress copy, scattershot creatives",
        strengths: ["Cheap ASP"],
        weaknesses: ["No brand", "Bad reviews"],
      },
      {
        name: "Premium D2C brand",
        approach: "Higher price, UGC + influencer, returns-friendly",
        strengths: ["Trust", "Repeat buyers"],
        weaknesses: ["Higher CAC"],
      },
    ],
    pricingBenchmarks: { lowEnd: 14, midRange: 29, premium: 49 },
    marketGaps: ["Underserved demographic segment", "Better-told problem-aware angle"],
    confidenceLevel: "low",
  };
}

export function fallbackPricing(price: number): PricingStrategy {
  return {
    recommendedPrice: price,
    anchorPrice: Math.round(price * 1.5),
    priceTiers: [
      { label: "entry", price: Math.round(price * 0.85), includes: ["Single unit"], who: "Price-sensitive testers" },
      { label: "popular", price, includes: ["Single unit", "Free shipping"], who: "Mainstream buyer" },
      { label: "premium", price: Math.round(price * 1.6), includes: ["2-pack", "Free shipping", "Extended warranty"], who: "Committed buyer" },
    ],
    bundleSuggestions: ["Buy 2 get 1 free"],
    priceJustification: "Anchored to mid-market, with a popular tier matched to category AOV.",
    confidenceLevel: "low",
  };
}

export function fallbackAdAngles(): AdAngle[] {
  return [
    {
      id: "a1",
      awarenessLevel: "problem-aware",
      angle: "The everyday fix",
      hook: "the small thing that fixed [problem] for me",
      scriptStructure: {
        opening: "I've had this issue for years.",
        middle: "Then I tried this, and it actually worked within a week.",
        close: "Link in bio.",
      },
      platformFit: { meta: 70, tiktok: 75, googleAds: 50 },
      targetPersonaId: "p1",
      confidenceLevel: "low",
    },
  ];
}

export function fallbackPlaybook(price: number): LaunchPlaybook {
  const days = Array.from({ length: 14 }, (_, i): LaunchPlaybook["dailyActions"][number] => ({
    day: i + 1,
    focus: i < 3 ? "Creative testing" : i < 7 ? "Scale winners" : "Retarget + LAL",
    actions: ["Launch / iterate ads", "Check core metrics"],
    creativeCount: i < 3 ? 5 : i < 7 ? 3 : 2,
    budgetSplit: "$120 — 80% Meta / 20% TikTok",
    kpis: ["CTR", "CPA", "ROAS"],
  }));
  return {
    totalDays: 14,
    dailyActions: days,
    totalBudget: 14 * 120,
    expectedROAS: Math.max(1.4, Math.min(2.5, 60 / price)),
    confidenceLevel: "low",
  };
}

export function fallbackRisk(): RiskAnalysis {
  return {
    redFlags: [
      {
        description: "Insufficient evidence to fully assess this product.",
        severity: "medium",
        mitigation: "Run a small $300 creative test to gather real CTR/CPA data before scaling.",
      },
    ],
    confidenceLevel: "low",
  };
}

export function fallbackVerdict(price: number): FinalVerdict {
  return {
    sellScore: 55,
    verdict: "test",
    summary: "Heuristic verdict — limited evidence. Run a small creative test before committing budget.",
    confidenceLevel: "low",
    comparableProducts: [],
    pillars: { margin: 60, marketFit: 55, demand: 55, competition: 50, creative: 55 },
    topAngle: `A simple problem-aware hook anchored to the recommended price ($${price}).`,
  };
}
