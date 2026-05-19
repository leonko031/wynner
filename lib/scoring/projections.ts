import type { Country, Product } from "@/types";
import { NICHES } from "@/lib/data/niches";

export type Projection = {
  budgetPerDayEUR: number;
  breakEvenROAS: number;
  cpaMinEUR: number;
  cpaMaxEUR: number;
};

const USD_TO_EUR = 0.92;

export function getProjection(
  product: Product,
  country: Country,
): Projection {
  const priceEUR = product.suggestedPriceUSD * USD_TO_EUR;
  const costEUR = (product.costUSD + product.shippingCostUSD) * USD_TO_EUR;
  const margin = Math.max(0.01, priceEUR - costEUR);

  // Recommended starting budget: anchored to country CPM, nudged by niche heat.
  const heat = NICHES[product.category].heat / 100;
  const budgetPerDayEUR = Math.round(
    Math.max(15, country.cpmIndex * 5 * (0.6 + heat * 0.8)),
  );

  // Break-even ROAS = price / margin
  const breakEvenROAS = Math.round((priceEUR / margin) * 10) / 10;

  // CPA range: lower bound = budget / (heat * 3), upper bound = margin (so still breakeven)
  const cpaMidEUR = Math.max(4, margin * 0.55);
  const cpaMinEUR = Math.round(cpaMidEUR * 0.7);
  const cpaMaxEUR = Math.round(cpaMidEUR * 1.25);

  return { budgetPerDayEUR, breakEvenROAS, cpaMinEUR, cpaMaxEUR };
}

export type Confidence = "high" | "medium" | "low";

export function getConfidence(score: number): Confidence {
  // Decisive scores (far from 60-threshold) get more confidence.
  const dist = Math.min(Math.abs(score - 60), Math.abs(score - 40));
  if (score >= 80 || dist > 18) return "high";
  if (dist > 8) return "medium";
  return "low";
}

export type RadarAxis = {
  axis:
    | "AOV match"
    | "COD fit"
    | "Shipping tolerance"
    | "Niche heat"
    | "CPM affordability"
    | "Return safety";
  value: number; // 0-100
  hint: string;
};

export function getRadarAxes(
  product: Product,
  country: Country,
): RadarAxis[] {
  const priceEUR = product.suggestedPriceUSD * USD_TO_EUR;
  // AOV match: 100 when price is within ±25% of avgAOV, decays linearly.
  const aovDelta = Math.abs(priceEUR - country.avgAOV) / country.avgAOV;
  const aovMatch = Math.round(Math.max(0, 100 - aovDelta * 140));

  // COD fit: higher COD pref = lower fit for card-based dropship.
  const codFit = Math.round(100 - country.codPreference * 8);

  // Shipping tolerance: more days tolerated = better for AliExpress 10-14 day windows.
  const shippingTol = Math.round(
    Math.min(100, (country.shippingTolerance / 14) * 100),
  );

  // Niche heat: direct from niche metadata.
  const nicheHeat = NICHES[product.category].heat;

  // CPM affordability: US baseline 10 → 50 affordability; RS=1.6 → 100.
  const cpmAfford = Math.round(
    Math.min(100, Math.max(10, 110 - country.cpmIndex * 10)),
  );

  // Return safety: inverse of return rate.
  const returnSafety = Math.round((1 - country.returnRate) * 100);

  return [
    {
      axis: "AOV match",
      value: aovMatch,
      hint: `Suggested €${Math.round(priceEUR)} vs market AOV €${country.avgAOV}.`,
    },
    {
      axis: "COD fit",
      value: codFit,
      hint: `${country.name} COD preference ${country.codPreference}/10.`,
    },
    {
      axis: "Shipping tolerance",
      value: shippingTol,
      hint: `Buyers wait ${country.shippingTolerance} days on average.`,
    },
    {
      axis: "Niche heat",
      value: nicheHeat,
      hint: `${NICHES[product.category].label} category at ${nicheHeat}/100.`,
    },
    {
      axis: "CPM affordability",
      value: cpmAfford,
      hint: `CPM index ${country.cpmIndex} (US=10).`,
    },
    {
      axis: "Return safety",
      value: returnSafety,
      hint: `${Math.round(country.returnRate * 100)}% return rate.`,
    },
  ];
}

export function getPillarExplanation(
  product: Product,
  key: keyof Product["pillars"],
): string {
  const v = product.pillars[key];
  const price = product.suggestedPriceUSD;
  const cost = product.costUSD;
  const ship = product.shippingCostUSD;
  switch (key) {
    case "margin": {
      const markup = (price / (cost + ship)).toFixed(1);
      return `Cost $${cost.toFixed(2)} → suggested $${price.toFixed(
        2,
      )} → ${markup}x markup. ${
        Number(markup) >= 3
          ? "Above the 3x dropship floor — room for $15–20 CPA."
          : "Below the 3x floor — paid acquisition will be tight."
      }`;
    }
    case "marketFit":
      return v >= 70
        ? "Target country buyer profile aligns cleanly with this product's price band and niche conventions."
        : "Some friction expected — either the price point sits awkwardly or the niche skews to a different demo locally.";
    case "demand":
      return v >= 70
        ? "30-day demand trend is rising. Search and trend signals confirm pre-saturation phase."
        : "Demand is mixed — interest exists but no clear inflection yet. Catch it on the way up or skip.";
    case "competition":
      return v >= 65
        ? "Competitive surface is manageable — incumbents are tired, ad library shows aging creative."
        : "Heavy competitor presence — distinctive creative angle is mandatory, not optional.";
    case "creative":
      return v >= 75
        ? "Multiple ready-made hooks: before/after, demo, problem-aware, founder-story. Easy to test 6+ variants."
        : "Limited ready-made angles — needs creative R&D before launch to find a hook that breaks through.";
    default:
      return "";
  }
}

export function getCountryNotes(country: Country, product: Product): string[] {
  const niche = NICHES[product.category];
  const notes: string[] = [];

  notes.push(
    country.cardTrust >= 8
      ? `${country.name} prefers card payments — Stripe / PayPal checkouts convert cleanly.`
      : `${country.name} leans on COD (${country.codPreference}/10) — consider a COD-friendly fulfillment partner.`,
  );

  notes.push(
    country.trendingNiches.includes(product.category)
      ? `${niche.label} is currently trending in ${country.name} — ride the wave.`
      : `${niche.label} is not in ${country.name}'s top trend list — sell into intent, not interest.`,
  );

  notes.push(
    `Shipping ceiling here is ${country.shippingTolerance} days — use ePacket or a local 3PL if your supplier slips.`,
  );

  notes.push(
    country.topPlatform === "Both"
      ? `Both Meta and TikTok perform — split-test 50/50 on first launch.`
      : `${country.topPlatform} dominates locally — anchor your launch there first.`,
  );

  if (country.returnRate > 0.25) {
    notes.push(
      `Return rate (${Math.round(country.returnRate * 100)}%) is high — pad your margin and tighten size charts.`,
    );
  }

  return notes;
}
