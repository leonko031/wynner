import { geminiFlash, geminiPro, isGeminiAvailable } from "@/lib/ai/gemini";
import {
  buildFindSubredditsPrompt,
  findSubredditsSchema,
} from "@/lib/ai/prompts/find-subreddits";
import {
  buildExtractVoicePrompt,
  extractVoiceSchema,
  type RedditDoc,
} from "@/lib/ai/prompts/extract-voice";
import {
  fetchPostComments,
  findSubreddits,
  isRedditConfigured,
  searchSubredditPosts,
  type RedditPost,
} from "./client";
import type {
  AdAngleSuggestion,
  Country,
  CustomerVoice,
  InferredAvatar,
  Niche,
  RedditQuote,
} from "@/types";

export type ExtractInput = {
  product: { name: string; description: string; category: Niche };
  country: Country;
};

export class VoiceError extends Error {
  code: "reddit_not_configured" | "ai_not_configured" | "no_results" | "extract_failed";
  constructor(
    message: string,
    code:
      | "reddit_not_configured"
      | "ai_not_configured"
      | "no_results"
      | "extract_failed",
  ) {
    super(message);
    this.code = code;
  }
}

// Tunables
const MAX_SUBS = 6;
const POSTS_PER_SUB = 6;
const TOP_POSTS_FOR_COMMENTS = 5;
const COMMENTS_PER_POST = 8;

function topKeywordQuery(name: string): string {
  // Take the 2-3 most distinctive words for the subreddit search query.
  return name
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 3)
    .join(" ");
}

export async function extractCustomerVoice(
  input: ExtractInput,
): Promise<CustomerVoice> {
  if (!isRedditConfigured()) {
    throw new VoiceError("Reddit is not configured", "reddit_not_configured");
  }
  if (!isGeminiAvailable()) {
    throw new VoiceError("Gemini is not configured", "ai_not_configured");
  }

  // Step 1: ask Gemini for candidate subreddits.
  const subRes = await geminiFlash<{
    subreddits: string[];
    reasoning: string;
  }>(buildFindSubredditsPrompt(input), findSubredditsSchema);

  const candidateNames = (subRes.subreddits ?? [])
    .map((s) => s.replace(/^\/?r\//i, "").trim())
    .filter(Boolean)
    .slice(0, 8);

  // Optionally enrich/validate via Reddit's subreddit-search (kept best-effort).
  let validated = candidateNames;
  try {
    const probe = await findSubreddits(topKeywordQuery(input.product.name), 8);
    const probeNames = new Set(probe.map((p) => p.name.toLowerCase()));
    // Move probe-confirmed names to the front, but keep Gemini's list as fallback.
    validated = [
      ...candidateNames.filter((n) => probeNames.has(n.toLowerCase())),
      ...candidateNames.filter((n) => !probeNames.has(n.toLowerCase())),
    ];
  } catch {
    // Non-fatal: stick with Gemini's list.
  }

  const subsToCrawl = validated.slice(0, MAX_SUBS);
  const keywordQuery = topKeywordQuery(input.product.name);

  // Step 2: for each sub, search for posts matching the product keywords.
  const postsBySub = await Promise.all(
    subsToCrawl.map(async (sub) => {
      try {
        const list = await searchSubredditPosts(sub, keywordQuery, POSTS_PER_SUB);
        return { sub, posts: list };
      } catch {
        return { sub, posts: [] as RedditPost[] };
      }
    }),
  );

  const allPosts: { sub: string; post: RedditPost }[] = [];
  for (const { sub, posts } of postsBySub) {
    for (const p of posts) {
      allPosts.push({ sub, post: p });
    }
  }

  if (allPosts.length === 0) {
    throw new VoiceError(
      "No Reddit threads matched this product across candidate subreddits.",
      "no_results",
    );
  }

  // Step 3: for the most engaged N posts, fetch top comments.
  const ranked = [...allPosts].sort(
    (a, b) => b.post.num_comments - a.post.num_comments,
  );
  const top = ranked.slice(0, TOP_POSTS_FOR_COMMENTS);

  const docs: RedditDoc[] = [];
  // Always include post bodies/titles
  for (const { sub, post } of allPosts) {
    docs.push({
      subreddit: sub,
      postId: post.id,
      title: post.title,
      body: `${post.title ? post.title + ". " : ""}${post.selftext ?? ""}`.trim(),
      ups: post.ups ?? 0,
      permalink: post.permalink,
    });
  }
  // Add top comments
  for (const { sub, post } of top) {
    try {
      const comments = await fetchPostComments(sub, post.id, COMMENTS_PER_POST);
      for (const c of comments) {
        docs.push({
          subreddit: sub,
          postId: post.id,
          body: c.body,
          ups: c.ups ?? 0,
          permalink: c.permalink,
        });
      }
    } catch {
      // skip — partial coverage is fine
    }
  }

  // Step 4: hand the corpus to Gemini Pro for structured extraction.
  let extracted: {
    topPains: string[];
    topObjections: string[];
    topDesiredOutcomes: string[];
    commonPhrases: string[];
    realQuotes: RedditQuote[];
    inferredAvatar: InferredAvatar;
    adAngleSuggestions: AdAngleSuggestion[];
  };
  try {
    extracted = await geminiPro(
      buildExtractVoicePrompt({ ...input, docs }),
      extractVoiceSchema,
    );
  } catch (e) {
    throw new VoiceError(
      e instanceof Error ? e.message : "Extraction failed",
      "extract_failed",
    );
  }

  const usedSubs = Array.from(
    new Set(docs.map((d) => d.subreddit.toLowerCase())),
  );

  return {
    topPains: extracted.topPains.slice(0, 5),
    topObjections: extracted.topObjections.slice(0, 5),
    topDesiredOutcomes: extracted.topDesiredOutcomes.slice(0, 3),
    commonPhrases: extracted.commonPhrases.slice(0, 5),
    realQuotes: extracted.realQuotes.slice(0, 5),
    inferredAvatar: extracted.inferredAvatar,
    adAngleSuggestions: extracted.adAngleSuggestions.slice(0, 3),
    generatedAt: new Date().toISOString(),
    sourceSubreddits: usedSubs,
    threadCount: allPosts.length,
  };
}
