import type { PillarResult, ScoreInput } from "../types";

export function scoreMargin({ product, country }: ScoreInput): PillarResult {
  const cost = product.costUSD;
  const ship = product.shippingCostUSD;
  const price = product.suggestedPriceUSD;
  const totalCost = cost + ship;
  const markup = totalCost > 0 ? price / totalCost : 0;
  const grossMargin = price - totalCost;
  const estimatedCPA = country.cpmIndex * 1.5;
  const netMargin = grossMargin - estimatedCPA;

  // Price vs AOV penalty
  const usdToEur = 0.92;
  const priceEUR = price * usdToEur;
  const priceVsAOV = country.avgAOV > 0 ? priceEUR / country.avgAOV : 1;
  let aovPenalty = 0;
  if (priceVsAOV > 1.5) aovPenalty = Math.min(25, (priceVsAOV - 1.5) * 40);
  else if (priceVsAOV < 0.3) aovPenalty = Math.min(25, (0.3 - priceVsAOV) * 60);

  // Components scaled 0-100
  const markupScore = clamp(markup * 12 + 10, 0, 60); // 5x markup → 70, 3x → 46
  const netMarginScore = clamp(netMargin * 3, -20, 60); // €5 net → 15, €15 net → 45
  const total = clamp(markupScore + netMarginScore + 20 - aovPenalty, 0, 100);
  const score = Math.round(total);

  const reasoning = (() => {
    const markupStr = markup.toFixed(1);
    const grossStr = grossMargin.toFixed(2);
    const netStr = netMargin.toFixed(2);
    const cpaStr = estimatedCPA.toFixed(0);
    if (markup < 2.5) {
      return `${markupStr}x markup — below the 3x dropship floor. Net of ~$${cpaStr} CPA leaves $${netStr} per sale; too thin for paid acquisition.`;
    }
    if (netMargin < 5) {
      return `${markupStr}x markup, $${grossStr} gross. After ~$${cpaStr} CPA estimate, ${netMargin >= 0 ? `$${netStr}` : `-$${Math.abs(netMargin).toFixed(2)}`} net — workable only with high LTV upsell.`;
    }
    return `${markupStr}x markup, $${grossStr} gross margin. Net ~$${netStr} per sale after $${cpaStr} CPA — healthy buffer for testing.`;
  })();

  return { score, reasoning };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
