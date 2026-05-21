import { z } from "zod";
import type { Country } from "@/types";
import {
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "@/lib/ai/prompts/research/shared";
import { DISCOVERY_TONE, discoveryConfidence } from "./shared";

/**
 * Deep Research only — Country-specific context discovery.
 *
 * What's specific to selling this category in this country: regulatory
 * notes, payment/shipping norms, language quirks, cultural touchpoints
 * that change how the angle should be framed.
 */

export const countryContextSchema = z.object({
  regulatoryNotes: z
    .array(
      z.object({
        topic: z.string().min(2).max(120),
        detail: z.string().min(4).max(400),
        evidenceUrl: z.string().url().optional(),
        severity: z.enum(["info", "watch", "blocker"]),
      }),
    )
    .max(6),
  paymentAndShipping: z.object({
    expectations: z.string().min(4).max(400),
    commonObjections: z.array(z.string()).max(5),
  }),
  languageNotes: z.string().min(4).max(400),
  culturalAngles: z.array(z.string()).max(6),
  localCompetitors: z
    .array(
      z.object({
        name: z.string(),
        note: z.string().min(4).max(240),
      }),
    )
    .max(6),
  confidence: discoveryConfidence,
});
export type CountryContextOutput = z.infer<typeof countryContextSchema>;

export function buildCountryContextPrompt(
  product: ProductInput,
  country: Country,
  userContext?: string,
): string {
  return `You are scoping country-specific context for selling a product category in ${country.name}. The operator already knows the global pitch — you're finding what's different here.

${productBlock(product)}
${countryBlock(country)}
${userContextBlock(userContext)}

Use Google Search aggressively. Suggested patterns:
  • Regulatory: "${product.category} regulations ${country.name}", "import duty ${country.name}"
  • Payment norms: "${country.name} cash on delivery ${product.category}", local processors
  • Shipping: typical delivery expectations, customs friction
  • Language: ${country.language} idioms used in this category — common phrases, what foreigners get wrong
  • Cultural touchpoints: holidays, local trends, taboos for this category
  • Local competitors: brands specific to ${country.name} that outsiders don't know

Find:
  • regulatoryNotes — at least the basics (taxes, restrictions, certifications); severity:"blocker" if the category can't ship legally
  • paymentAndShipping.expectations — what local buyers expect (currency, timelines, COD prevalence)
  • paymentAndShipping.commonObjections — specific objections German/French/etc. buyers raise that US buyers don't
  • languageNotes — translation gotchas, words to avoid, words that resonate
  • culturalAngles — holidays, news cycles, identity hooks that change how to position
  • localCompetitors — brands operating in ${country.name} the operator should know

${DISCOVERY_TONE}

Output JSON only. Specific > generic. "Germans expect 18% VAT in displayed price" beats "consider local taxes".`;
}
