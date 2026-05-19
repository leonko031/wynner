// ---------- Niche ----------
export const NICHE_KEYS = [
  "pet",
  "home",
  "wellness",
  "beauty",
  "kitchen",
  "fitness",
  "tech",
  "kids",
  "car",
  "outdoor",
  "fashion",
  "office",
  "garden",
  "travel",
] as const;

export type Niche = (typeof NICHE_KEYS)[number];

// ---------- Verdict ----------
export const VERDICTS = ["go", "test", "risky", "skip"] as const;
export type Verdict = (typeof VERDICTS)[number];

// ---------- Source ----------
export const SOURCES = ["aliexpress", "temu", "amazon", "manual"] as const;
export type Source = (typeof SOURCES)[number];

// ---------- Platform ----------
export type AdPlatform = "Meta" | "TikTok" | "Both";

// ---------- Product ----------
export type ScorePillars = {
  margin: number;
  marketFit: number;
  demand: number;
  competition: number;
  creative: number;
};

export type ProductReasoning = {
  whyTest: string[];
  redFlags: string[];
  topAngle: string;
};

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  secondaryImages?: string[];
  category: Niche;
  costUSD: number;
  suggestedPriceUSD: number;
  shippingCostUSD: number;
  source: Source;
  sourceUrl?: string;
  targetCountry: string; // ISO-2 country code
  sellScore: number; // 0-100
  verdict: Verdict;
  pillars: ScorePillars;
  reasoning: ProductReasoning;
  demandTrend: number[]; // 30-day signal
  isFavorite: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  customerVoice?: CustomerVoice;
  enrichmentSources?: import("@/lib/scrapers/types").EnrichmentSources;
}

// ---------- Reddit-mined Voice of Customer ----------
export interface RedditQuote {
  quote: string;
  subreddit: string;
  upvotes: number;
  context: string; // 1-sentence summary of what the comment/post was about
  permalink?: string; // optional deep-link back to Reddit
}

export interface InferredAvatar {
  ageRange: string; // e.g. "28–42"
  occupation: string; // e.g. "white-collar WFH knowledge worker"
  lifestyle: string; // e.g. "sits 9+ hours/day, busy parent, occasional gym"
  emotionalState: string; // e.g. "tired, slightly self-conscious about posture, wants quick fix"
}

export interface AdAngleSuggestion {
  hook: string; // the spoken/written first 3 seconds of the ad
  whyItWorks: string; // 1-sentence justification grounded in the corpus
}

export interface CustomerVoice {
  topPains: string[]; // 5 verbatim or near-verbatim pain phrases
  topObjections: string[]; // 5 hesitations
  topDesiredOutcomes: string[]; // 3 specific outcomes
  commonPhrases: string[]; // 5 community-specific phrases/slang
  realQuotes: RedditQuote[]; // 3-5 verbatim quotes
  inferredAvatar: InferredAvatar;
  adAngleSuggestions: AdAngleSuggestion[]; // 3 hook ideas
  generatedAt: string; // ISO
  sourceSubreddits: string[];
  threadCount: number; // how many threads were analyzed (for display)
}

// ---------- Country ----------
export interface Country {
  code: string; // ISO-2
  name: string;
  flag: string; // emoji
  currency: string; // ISO-4217
  language: string; // ISO-639-1
  avgAOV: number; // EUR
  codPreference: number; // 0-10
  cardTrust: number; // 0-10
  shippingTolerance: number; // days
  topPlatform: AdPlatform;
  trendingNiches: Niche[];
  deadNiches: Niche[];
  cpmIndex: number; // US = 10 baseline
  returnRate: number; // 0-1
  population: number;
  ecommercePenetration: number; // 0-1
}

// ---------- Niche metadata ----------
export interface NicheMetadata {
  niche: Niche;
  label: string;
  icon: string; // lucide icon name
  color: string; // hex
  heat: number; // 0-100
  avgScore: number; // 0-100
}

// ---------- Activity feed ----------
export type ActivityType =
  | "scan_complete"
  | "favorite_added"
  | "trend_alert"
  | "milestone";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  message: string;
  productId?: string;
  timestamp: string; // ISO
  accentColor: string; // hex
}

// ---------- Filtering ----------
export type SortKey = "score" | "newest" | "margin" | "demand";

export interface FilterCriteria {
  niche?: Niche;
  verdict?: Verdict;
  country?: string;
  search?: string;
  sortBy?: SortKey;
  favoritesOnly?: boolean;
}

// ---------- Verdict helper ----------
export function verdictFromScore(score: number): Verdict {
  if (score >= 80) return "go";
  if (score >= 60) return "test";
  if (score >= 40) return "risky";
  return "skip";
}
