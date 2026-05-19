import { NICHES } from "@/lib/data/niches";
import type { Country, Niche } from "@/types";

export const extractVoiceSchema = {
  type: "object",
  properties: {
    topPains: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 6,
    },
    topObjections: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 6,
    },
    topDesiredOutcomes: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
    },
    commonPhrases: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 6,
    },
    realQuotes: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          quote: { type: "string" },
          subreddit: { type: "string" },
          upvotes: { type: "integer" },
          context: { type: "string" },
          permalink: { type: "string" },
        },
        required: ["quote", "subreddit", "upvotes", "context"],
      },
    },
    inferredAvatar: {
      type: "object",
      properties: {
        ageRange: { type: "string" },
        occupation: { type: "string" },
        lifestyle: { type: "string" },
        emotionalState: { type: "string" },
      },
      required: ["ageRange", "occupation", "lifestyle", "emotionalState"],
    },
    adAngleSuggestions: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          hook: { type: "string" },
          whyItWorks: { type: "string" },
        },
        required: ["hook", "whyItWorks"],
      },
    },
  },
  required: [
    "topPains",
    "topObjections",
    "topDesiredOutcomes",
    "commonPhrases",
    "realQuotes",
    "inferredAvatar",
    "adAngleSuggestions",
  ],
};

export type RedditDoc = {
  subreddit: string;
  postId?: string;
  title?: string;
  body: string;
  ups: number;
  permalink?: string;
};

export type ExtractVoiceInput = {
  product: { name: string; description: string; category: Niche };
  country: Country;
  docs: RedditDoc[];
};

export function buildExtractVoicePrompt(input: ExtractVoiceInput): string {
  const niche = NICHES[input.product.category];
  // Cap each doc body to keep total prompt under reasonable token limits.
  const cleaned = input.docs
    .filter((d) => d.body && d.body.trim().length > 12)
    .slice(0, 200)
    .map((d, i) => {
      const body = d.body.replace(/\s+/g, " ").slice(0, 700);
      const title = d.title ? `[${d.title}] ` : "";
      return `(#${i + 1}) r/${d.subreddit} · ${d.ups} ups\n${title}${body}`;
    })
    .join("\n\n");

  return `You are Wynner, a senior dropshipping copywriter who reads Reddit threads daily to extract the language buyers actually use. You are looking at a corpus of REAL posts and comments from communities adjacent to this product. Your job is to surface the strongest verbatim insights — not to write marketing copy, not to be polite, not to hallucinate quotes.

PRODUCT
- Name: ${input.product.name}
- Description: ${input.product.description}
- Niche: ${niche.label}
- Target market: ${input.country.name} (${input.country.code})

CORPUS (${input.docs.length} entries — posts and comments)
${cleaned}

EXTRACTION TASK
Read every entry. Find patterns. Then output structured JSON.

CRITICAL CONSTRAINTS
- realQuotes MUST be verbatim or near-verbatim text from the corpus. No paraphrasing into "polished" English. Keep slang, typos, raw voice. If a quote is long, trim from middle with "[…]" — never re-author it.
- The subreddit field for each quote MUST match a subreddit that appears in the corpus.
- upvotes for each quote should reflect the entry's ups (best-effort).
- For each quote, context is one short sentence: what was the post/comment about.
- topPains, topObjections, topDesiredOutcomes are SHORT bullet phrases (10-18 words each) that distill recurring themes, again grounded in the corpus language.
- commonPhrases are 5 distinctive expressions or slang terms recurring across multiple entries (e.g. "bandaid fix", "snake oil", "actually moves the needle").
- inferredAvatar fields must read like a 1-line dossier on a real person, not a generic persona. Mention concrete signals from the corpus.
- adAngleSuggestions: 2-4 hooks. Each hook is the first 3 seconds of a video ad (max 25 words, written as the creator would say it). whyItWorks (max 20 words) cites the specific pain/objection the hook addresses.
- No hype words: avoid "amazing", "huge", "incredible", "revolutionary", "game-changing".
- No emojis in any field.

OUTPUT
Strict JSON only — no preamble, no fences:

{
  "topPains": ["…"],
  "topObjections": ["…"],
  "topDesiredOutcomes": ["…"],
  "commonPhrases": ["…"],
  "realQuotes": [
    { "quote": "…", "subreddit": "Posture", "upvotes": 412, "context": "user explaining why office chair pillows failed" }
  ],
  "inferredAvatar": {
    "ageRange": "28–42",
    "occupation": "WFH knowledge worker (software / design / admin)",
    "lifestyle": "8+ hours seated daily, occasional gym, often has kids",
    "emotionalState": "tired by 4pm, slightly self-conscious about posture in calls, wants quick relief"
  },
  "adAngleSuggestions": [
    { "hook": "I sat slumped for 9 hours a day for 4 years. Day 7 with this belt, here's the side profile.", "whyItWorks": "Mirrors the most-upvoted before/after framing the community responds to." }
  ]
}`;
}
