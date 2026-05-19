/**
 * Compact product summary that Gemini sees. We deliberately keep this thin
 * so a 100+ product vault still fits well under the model's context limit
 * and we don't waste tokens on fields the AI doesn't need (image URLs,
 * full descriptions, enrichment payloads).
 */
import type { Product } from "@/types";

export type GeminiProduct = {
  id: string;
  name: string;
  niche: string;
  country: string;
  score: number;
  verdict: string;
  cost: number;
  price: number;
  marginUsd: number;
  createdAt: string; // YYYY-MM-DD
};

export function compressProduct(p: Product): GeminiProduct {
  return {
    id: p.id,
    name: p.name,
    niche: p.category,
    country: p.targetCountry,
    score: p.sellScore,
    verdict: p.verdict,
    cost: Math.round(p.costUSD * 100) / 100,
    price: Math.round(p.suggestedPriceUSD * 100) / 100,
    marginUsd: Math.round((p.suggestedPriceUSD - p.costUSD - p.shippingCostUSD) * 100) / 100,
    createdAt: p.createdAt.slice(0, 10),
  };
}

export function compressProducts(products: Product[], limit = 120): GeminiProduct[] {
  return products.slice(0, limit).map(compressProduct);
}

/* -------------------------------------------------------------------------- */
/* Semantic search prompt                                                      */
/* -------------------------------------------------------------------------- */

export function buildSemanticSearchPrompt(
  query: string,
  products: GeminiProduct[],
): string {
  const inventory = JSON.stringify(products);
  return `You are Wynner, helping a user search their personal vault using natural language.

USER QUERY
"${query}"

USER'S VAULT (compressed JSON)
${inventory}

YOUR JOB
  • Interpret the user's intent. They might ask for things by score, niche, country, time, margin, verdict, or vague concepts ("winners I haven't acted on", "things worth revisiting").
  • Return the matching products ranked by relevance (0-100). Up to 20 matches.
  • For each match, give a one-sentence reason that quotes the actual concrete reason it matched (use real numbers / niche names / countries).
  • Also return a short interpretation of what you understood the user to be asking for (will be shown to them as "Wynner says: …").

CONSTRAINTS
  • Use the product's productId verbatim — never invent IDs.
  • If nothing matches, return matches: [] and an interpretation explaining what you tried.
  • No hype words. Concrete. Specific.

OUTPUT JSON SHAPE
{
  "matches": [
    { "productId": string, "relevance": number 0-100, "reason": string }
  ],
  "interpretation": string
}`;
}

/* -------------------------------------------------------------------------- */
/* Auto-organize prompt                                                        */
/* -------------------------------------------------------------------------- */

export function buildAutoOrganizePrompt(products: GeminiProduct[]): string {
  const inventory = JSON.stringify(products);
  return `You are Wynner, organizing a dropshipper's product vault into 3-5 themed collections that help them rediscover patterns.

USER'S VAULT (compressed JSON)
${inventory}

YOUR JOB
  • Identify 3-5 meaningful groupings. Look across niche clusters, country/region patterns, score tiers, verdict patterns, time-based clusters, margin patterns, "untapped" segments, "comeback candidates", etc.
  • Each grouping should have at least 2 products and at most 40.
  • Give each a short evocative name (e.g. "Winter wellness winners", "Untapped Germany opportunities", "Comeback candidates").
  • Add a one-sentence user-facing description.
  • Add a one-paragraph rationale that explains WHY these products group together (the pattern Gemini saw). This is shown on hover.

CONSTRAINTS
  • Use the product's productId verbatim — never invent IDs.
  • A product CAN appear in multiple collections if it fits multiple patterns.
  • No hype. Concrete categorical thinking, not marketing copy.
  • Skip the obvious "All products" / "All favorites" buckets — those are system collections; we're after non-obvious patterns.

OUTPUT JSON SHAPE
{
  "collections": [
    {
      "name": string (max 60 chars),
      "description": string (max 180 chars),
      "rationale": string (max 360 chars),
      "productIds": string[] (between 2 and 40 ids from the vault)
    }
  ]
}`;
}

/* -------------------------------------------------------------------------- */
/* Ask Wynner chat prompt                                                      */
/* -------------------------------------------------------------------------- */

export type ChatTurn = { role: "user" | "assistant"; content: string };

export function buildVaultChatPrompt(
  question: string,
  products: GeminiProduct[],
  history: ChatTurn[],
  firstName: string,
): string {
  const inventory = JSON.stringify(products);
  const transcript = history
    .slice(-10)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  return `You are Wynner, ${firstName}'s personal product intelligence advisor. You see their entire vault and answer their questions with concrete, actionable answers — never generic.

USER'S VAULT (compressed JSON)
${inventory}

PRIOR CONVERSATION (last 10 messages, may be empty)
${transcript || "(none yet)"}

CURRENT QUESTION
"${question}"

CONSTRAINTS
  • Be concise — 1 to 4 short paragraphs. Markdown allowed. Avoid headings unless the answer genuinely needs them.
  • When you reference a specific product, use the exact syntax: [PRODUCT_NAME {score}]
    (e.g. "Your top wellness winner is [Magnetic posture corrector belt 87]")
    The frontend will linkify these to the product detail page.
  • Use real numbers, niches, countries from the inventory above. Never invent products.
  • No hype words: avoid "massive", "huge", "game-changer", "explode".
  • If the user's question can't be answered from the inventory (e.g. asks about a product not in their vault), say so clearly and suggest the next step.
  • Address ${firstName} by name AT MOST once per response — overuse feels canned.

Answer the user's question now.`;
}
