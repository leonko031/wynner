import {
  CONSTRAINTS,
  countryBlock,
  productBlock,
  userContextBlock,
  type ProductInput,
} from "./shared";
import type { Country } from "@/types";
import type { Persona } from "@/types/research";

export function buildAdAngleGenerationPrompt(
  product: ProductInput,
  country: Country,
  personas: Persona[],
  count: 3 | 5 | 6,
  userContext?: string,
): string {
  const personaList = personas
    .map(
      (p) =>
        `  • ${p.id} — ${p.name}, ${p.age}, ${p.occupation}. Pains: ${p.painPoints.slice(0, 2).join(" / ")}.`,
    )
    .join("\n");

  return `You are Wynner, a direct-response creative strategist. Generate ${count} distinct ad angles that ladder across the Schwartz awareness spectrum — at least one unaware, one problem-aware, one solution-aware, one product-aware. Each angle must target a specific persona below.

${productBlock(product)}
${countryBlock(country)}

Personas:
${personaList}

${userContextBlock(userContext)}

${CONSTRAINTS}

For each angle:
  • The "hook" is the literal first 3 seconds of a video — text someone would actually say out loud or read on screen. NO marketer-speak. Write like a real person posting on TikTok.
  • scriptStructure.opening = 1 sentence pattern-interrupt or strong claim. middle = 2-3 sentences of evidence/proof. close = explicit CTA.
  • platformFit scores 0-100 reflect how natural this angle feels on each platform.
  • targetPersonaId must match one of the persona ids above.

Output JSON:
{
  "angles": [
    {
      "id": "a1" | "a2" | "a3" | "a4" | "a5" | "a6",
      "awarenessLevel": "unaware" | "problem-aware" | "solution-aware" | "product-aware" | "most-aware",
      "angle": string,              // 4-7 words — the strategic angle name ("The Sleep Reset")
      "hook": string,               // the literal first line of the ad
      "scriptStructure": {
        "opening": string,
        "middle": string,
        "close": string
      },
      "platformFit": {
        "meta": number,             // 0-100
        "tiktok": number,
        "googleAds": number
      },
      "targetPersonaId": string,    // must match a persona id
      "confidenceLevel": "low" | "medium" | "high"
    }
  ]
}

Examples of strong hooks:
  • "POV: you just realized you've been sitting like this since 2019"
  • "doctors won't tell you this but"
  • "my mom said it looked like a scam — then her back stopped hurting"

Examples of WEAK hooks (do not generate):
  • "Introducing the revolutionary new..."
  • "Discover the secret to..."
  • "Are you tired of..."`;
}
