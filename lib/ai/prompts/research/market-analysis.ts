import {
  CONSTRAINTS,
  countryBlock,
  nicheBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "./shared";
import type { Country } from "@/types";

export function buildMarketAnalysisPrompt(
  product: ProductInput,
  country: Country,
  userContext?: string,
): string {
  const now = new Date();
  const currentMonth = now.toLocaleString("en", { month: "long" });
  return `You are Wynner, a market intelligence analyst specializing in ${country.name} consumer behavior. Estimate market conditions for this product, this country, this month (${currentMonth}).

${productBlock(product)}
${nicheBlock(product.category)}
${countryBlock(country)}
${userContextBlock(userContext)}

${CONSTRAINTS}

Output JSON:
{
  "countryCode": "${country.code}",
  "demandLevel": "low" | "moderate" | "strong" | "very-strong",
  "seasonality": {
    "peakMonths": string[],          // 2-4 months, full names
    "lowMonths": string[],           // 2-4 months, full names
    "currentPosition": "off-peak" | "approaching-peak" | "peak" | "post-peak"
  },
  "marketSizeEstimate": string,      // one phrase: "~€40M annual, growing"
  "growthTrend": "declining" | "flat" | "growing" | "exploding",
  "regulatoryNotes": string[],       // 0-4 short notes about local regulations, customs, or warranty norms that matter for this product
  "confidenceLevel": "low" | "medium" | "high"
}

Reason like a local: which holidays matter, when does this category spike, what does the average buyer expect?`;
}
