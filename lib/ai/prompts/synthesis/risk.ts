import type { Country } from "@/types";
import {
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "@/lib/ai/prompts/research/shared";
import { SYNTHESIS_TONE, discoveryContextBlock, type DiscoveryBundle } from "./shared";

/**
 * Risk analysis synthesis — Deep only.
 *
 * Pulls red flags from across the discovery surface — voice complaints,
 * regulatory notes, competitor saturation warnings — and surfaces them with
 * mitigation steps.
 */
export function buildRiskPrompt(
  product: ProductInput,
  country: Country,
  discovery: DiscoveryBundle,
  userContext?: string,
): string {
  return `You are auditing what could go wrong with this launch. Read every signal in discovery — especially voice.topPains + voice.topObjections + competitors.marketGaps + countryContext.regulatoryNotes — and surface the red flags an operator needs to plan around.

${productBlock(product)}
${countryBlock(country)}
${userContextBlock(userContext)}

${discoveryContextBlock(discovery)}

TASK
Generate 2-6 red flags. Each one:
  • description — what the risk is, in plain English
  • severity — low / medium / high / critical (use "critical" only for blockers — e.g. regulatory restriction the operator missed)
  • mitigation — a concrete action the operator can take to manage the risk
  • sources — indices into the discovery source array that surfaced this risk

Prioritize:
  • Regulatory blockers from countryContext.regulatoryNotes (severity:"critical" if severity:"blocker" there)
  • Recurring negative themes in voice.topPains/topObjections (e.g. "product never arrives" → fulfillment risk)
  • Saturation-driven CPM risk if competitors.saturationVerdict is "saturated"
  • Pricing risk if margin is thin vs. observed competitors

Skip generic warnings ("ad fatigue could happen") — they're noise.

${SYNTHESIS_TONE}

OUTPUT JSON
{
  "redFlags": [
    {
      "description": "<plain English>",
      "severity": "low" | "medium" | "high" | "critical",
      "mitigation": "<concrete action>",
      "sources": [<indices>]
    }
  ],
  "confidenceLevel": "low" | "medium" | "high"
}`;
}
