import type { Country } from "@/types";
import {
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "@/lib/ai/prompts/research/shared";
import { SYNTHESIS_TONE, discoveryContextBlock, type DiscoveryBundle } from "./shared";

/**
 * Persona synthesis. Tier-aware:
 *   • Quick: 1 sketch (shorter, lighter)
 *   • Standard + Deep: 3 detailed personas
 *
 * Every persona's language patterns must be drawn from voice.languagePatterns
 * + voice.realQuotes. Pain points must trace to voice.topPains.
 */
export function buildPersonasPrompt(
  product: ProductInput,
  country: Country,
  discovery: DiscoveryBundle,
  personaCount: 1 | 2 | 3,
  userContext?: string,
): string {
  const detail =
    personaCount === 1
      ? "ONE persona sketch (concise — keep painPoints to 3-4, objections to 3, languagePatterns to 4)"
      : `${personaCount} fully-detailed personas (cover meaningfully different buyer profiles — don't return three near-duplicates)`;

  return `You are a senior customer-research strategist building buyer personas grounded in real discovery signals.

${productBlock(product)}
${countryBlock(country)}
${userContextBlock(userContext)}

${discoveryContextBlock(discovery)}

TASK
Generate ${detail}. Each persona must:
  • Have language patterns pulled DIRECTLY from voice.languagePatterns and voice.realQuotes — copy the slang and phrasing
  • Have pain points that trace to voice.topPains (mark dominant pains as the strongest persona's primary pain)
  • Have objections that trace to voice.topObjections (mix common ones with the per-persona specific worries)
  • Have a realQuoteStyle that sounds like one of the actual people in voice.realQuotes
  • Have a sources array citing the source indices that backed this persona
  • Be a recognizable real person in the ${country.name} market, not a marketing archetype

${SYNTHESIS_TONE}

OUTPUT FORMAT
Return JSON:
{
  "personas": [
    {
      "id": "p1",
      "name": "<plausible first name>",
      "age": <number>,
      "occupation": "<concrete role>",
      "income": "<range, local currency where useful>",
      "location": "<city or city-type>",
      "lifestyle": "<1 sentence>",
      "personalityTraits": ["<1-2 words each, 3-5 traits>"],
      "painPoints": ["<concrete pain, grounded in voice.topPains>"],
      "desiredOutcomes": ["<concrete outcome>"],
      "objections": ["<concrete objection>"],
      "buyingTriggers": ["<what would make them act>"],
      "languagePatterns": ["<exact phrase or slang they'd use>"],
      "platformBehavior": "<1 sentence — where + when they're on socials>",
      "dayInTheLife": "<1-2 sentences>",
      "realQuoteStyle": "<1 sentence in their voice — like a real comment they'd leave>",
      "avatarDescription": "<1 sentence physical/visual description>",
      "confidenceLevel": "low" | "medium" | "high",
      "sources": [<source indices from discovery>]
    }
  ]
}

confidence:"high" requires at least 2 source-backed pain points and 3 quoted language patterns.`;
}
