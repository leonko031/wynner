import type { Country } from "@/types";
import type { Persona } from "@/types/research";
import {
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "@/lib/ai/prompts/research/shared";
import { SYNTHESIS_TONE, discoveryContextBlock, type DiscoveryBundle } from "./shared";

/**
 * Hook-angle synthesis — the centerpiece deliverable. Per-tier counts:
 *   • Quick: 2 angles, lighter scriptStructure (no agitation/proof), 2
 *     captions, 1 CTA, no hookVariants, no visualHookIdeas
 *   • Standard: 5 angles, full script, 2 hookVariants, 3 visualHookIdeas,
 *     3 captions
 *   • Deep: 8 angles spanning all awareness levels and varied drivers,
 *     full detail, 3 hookVariants, 3 visualHookIdeas, 5 captions
 */
export function buildHookAnglesPrompt(
  product: ProductInput,
  country: Country,
  discovery: DiscoveryBundle,
  personas: Persona[],
  angleCount: 2 | 5 | 8,
  userContext?: string,
): string {
  const isQuick = angleCount === 2;
  const variantsTarget = isQuick ? 0 : angleCount === 5 ? 2 : 3;
  const visualsTarget = isQuick ? 0 : 3;
  const captionsTarget = isQuick ? 2 : angleCount === 5 ? 3 : 5;
  const ctasTarget = isQuick ? 1 : 3;

  const tierBehaviorBullets = isQuick
    ? `  • OMIT hookVariants and visualHookIdeas (empty arrays)
  • scriptStructure may omit agitation and proof — only opening, problem, solution, cta required
  • platformFit MUST still include all 4 platforms (meta, tiktok, youtube, googleAds) — set youtube and googleAds with honest scores even if low`
    : `  • hookVariants array MUST have ${variantsTarget} genuinely different angles (not synonyms of each other)
  • visualHookIdeas MUST have ${visualsTarget} concrete b-roll/visual concepts
  • scriptStructure MUST include all 6 beats: opening, problem, agitation, solution, proof, cta`;

  return `You are a senior direct-response copywriter specializing in dropshipping ad creative. You write hooks that stop the scroll within 1.5 seconds. You ground EVERY hook in the real customer language surfaced in the discovery output below. You never write generic marketing fluff.

${productBlock(product)}
${countryBlock(country)}
${userContextBlock(userContext)}

${discoveryContextBlock(discovery)}

PERSONAS AVAILABLE (use these IDs in targetPersonaId)
${personas
  .map(
    (p) =>
      `  • ${p.id} — ${p.name}, ${p.age}, ${p.occupation}. Pains: ${p.painPoints.slice(0, 3).join(" | ")}. Voice: "${p.realQuoteStyle}"`,
  )
  .join("\n") || "  (no personas — use a single generic targetPersonaId of 'p1')"}

TASK
Generate ${angleCount} hook angles. Critical constraints:
  • Distribute across awareness levels — don't cluster on one. Across ${angleCount}
    angles, hit at least ${isQuick ? 2 : Math.min(4, angleCount)} different awarenessLevels.
  • Distribute across emotionalDrivers — at least ${isQuick ? 2 : 4} different drivers
    represented across the set.
  • Every primaryHook is 8-15 words, written in the voice of someone the targetPersona
    would trust (a friend, a peer, themselves talking to themselves).
  • EVERY claim in primaryHook, scriptStructure, captionVariations references real signals
    from the discovery output. Reach for voice.realQuotes phrases, voice.topPains
    language, landscape.openAngles framing, competitors.marketGaps positioning.
  • whyThisWorks must cite real signals — e.g. "Plays on the recurring Reddit complaint
    about straps loosening [12]" or "Uses 'finally something that' pattern from 8 verbatim
    quotes". Reference source indices in brackets.
  • groundedInSignals is a short array of plain-English breadcrumbs to the signals you
    pulled from ("Reddit thread about XYZ", "Amazon review mentioning ABC")
  • sources is the array of source indices from the discovery output you used.
  • platformFit scores are 0-100 with terse reasoning. Be honest — a curiosity-driven
    text-overlay TikTok hook doesn't fit Google Ads, score it 20 with one-sentence why.
  • confidence:"high" only when grounded in 3+ source signals, "medium" for 1-2,
    "low" for extrapolated angles.

TIER-SPECIFIC OUTPUT
${tierBehaviorBullets}

${SYNTHESIS_TONE}

OUTPUT FORMAT
Return JSON:
{
  "angles": [
    {
      "id": "a1",
      "rank": 1,
      "awarenessLevel": "unaware" | "problem-aware" | "solution-aware" | "product-aware" | "most-aware",
      "emotionalDriver": "curiosity" | "fear" | "aspiration" | "belonging" | "fomo" | "transformation" | "validation" | "convenience",
      "targetPersonaId": "p1",
      "primaryHook": "<the 3-second opening line, 8-15 words>",
      "hookVariants": [<${variantsTarget} alternatives or empty array>],
      "firstFrameDescription": "<what the opening shot looks like, 1-2 sentences>",
      "visualHookIdeas": [<${visualsTarget} concrete b-roll concepts or empty array>],
      "scriptStructure": {
        "opening": "<first 3 seconds>",
        "problem": "<pain point setup>",
        "agitation": "<why it matters — omit on Quick>",
        "solution": "<product introduction>",
        "proof": "<trust element — omit on Quick>",
        "cta": "<call to action>"
      },
      "platformFit": {
        "meta": { "score": <0-100>, "reasoning": "<short why>" },
        "tiktok": { "score": <0-100>, "reasoning": "<short why>" },
        "youtube": { "score": <0-100>, "reasoning": "<short why>" },
        "googleAds": { "score": <0-100>, "reasoning": "<short why>" }
      },
      "captionVariations": [<${captionsTarget} variations>],
      "ctaVariations": [<${ctasTarget} variations>],
      "whyThisWorks": "<2-3 sentences citing real discovery signals with [source indices]>",
      "groundedInSignals": ["<plain-English breadcrumb>", ...],
      "sources": [<source indices>],
      "confidence": "low" | "medium" | "high"
    }
  ]
}

Rank the angles 1..${angleCount} by predicted impact (rank 1 = your strongest pick). Sequence them so the user reads the most-actionable hook first.`;
}
