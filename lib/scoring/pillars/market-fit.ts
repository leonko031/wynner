import type { PillarResult, ScoreInput } from "../types";
import { NICHES } from "@/lib/data/niches";

export function scoreMarketFit({ product, country }: ScoreInput): PillarResult {
  let score = 50;
  const reasons: string[] = [];

  // Niche-trending bonus / dead-niche penalty
  if (country.trendingNiches.includes(product.category)) {
    score += 18;
    reasons.push(
      `${NICHES[product.category].label} trending in ${country.name}`,
    );
  } else if (country.deadNiches.includes(product.category)) {
    score -= 22;
    reasons.push(
      `${NICHES[product.category].label} listed as cold in ${country.name}`,
    );
  }

  // Shipping tolerance vs source
  if (product.source === "aliexpress" || product.source === "temu") {
    if (country.shippingTolerance >= 10) {
      score += 8;
      reasons.push(`${country.shippingTolerance}-day ship tolerance fits CN supply`);
    } else if (country.shippingTolerance < 6) {
      score -= 10;
      reasons.push(
        `${country.shippingTolerance}-day tolerance too tight for CN supply — needs 3PL`,
      );
    }
  }

  // Card trust gates premium pricing
  const priceEUR = product.suggestedPriceUSD * 0.92;
  if (priceEUR > 40 && country.cardTrust < 7) {
    score -= 8;
    reasons.push(
      `card trust ${country.cardTrust}/10 weak for €${Math.round(priceEUR)} AOV`,
    );
  } else if (priceEUR > 40 && country.cardTrust >= 8.5) {
    score += 4;
    reasons.push(`card trust ${country.cardTrust}/10 supports premium pricing`);
  }

  // Return-rate risk on physical-fit products
  if (country.returnRate > 0.27) {
    score -= 5;
    reasons.push(`${Math.round(country.returnRate * 100)}% return rate adds margin risk`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const reasoning =
    reasons.length > 0
      ? `Fit signals: ${reasons.join(", ")}.`
      : `Neutral fit — no strong tail-winds or head-winds in ${country.name}.`;
  return { score, reasoning };
}
