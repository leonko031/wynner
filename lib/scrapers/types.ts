/**
 * Common scraper interface + result shape.
 *
 * Every scraper module exports a top-level `run`-style function that returns a
 * ScraperResult. Callers never need try/catch: failures are returned as
 * `{ ok: false }` so the scoring orchestrator can degrade cleanly.
 */

export type ScraperPlan = "free" | "pro" | "killer";

export type ScraperConfig = {
  id: ScraperId;
  label: string;
  requiresPlan: ScraperPlan; // currently all "free" for personal use
  envHint: string;
};

export type ScraperId =
  | "aliexpress"
  | "temu"
  | "amazon"
  | "metaAds"
  | "tiktok"
  | "googleTrends";

export const SCRAPER_CONFIG: Record<ScraperId, ScraperConfig> = {
  aliexpress: {
    id: "aliexpress",
    label: "AliExpress",
    requiresPlan: "free",
    envHint: "SCRAPINGBEE_API_KEY",
  },
  temu: {
    id: "temu",
    label: "Temu",
    requiresPlan: "free",
    envHint: "SCRAPINGBEE_API_KEY",
  },
  amazon: {
    id: "amazon",
    label: "Amazon",
    requiresPlan: "free",
    envHint: "SCRAPINGBEE_API_KEY",
  },
  metaAds: {
    id: "metaAds",
    label: "Meta Ad Library",
    requiresPlan: "free",
    envHint: "SCRAPINGBEE_API_KEY",
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok hashtag trends",
    requiresPlan: "free",
    envHint: "SCRAPINGBEE_API_KEY",
  },
  googleTrends: {
    id: "googleTrends",
    label: "Google Trends",
    requiresPlan: "free",
    envHint: "no key required",
  },
};

export type Ok<T> = { ok: true; data: T; cached: boolean; creditsUsed: number };
export type Err = { ok: false; error: string; code?: string };
export type ScraperResult<T> = Ok<T> | Err;

export function ok<T>(data: T, opts: { cached?: boolean; creditsUsed?: number } = {}): Ok<T> {
  return { ok: true, data, cached: opts.cached ?? false, creditsUsed: opts.creditsUsed ?? 0 };
}
export function err(error: string, code?: string): Err {
  return { ok: false, error, code };
}

// ---------- Scraped product data ----------
export type ScrapedProduct = {
  source: "aliexpress" | "temu" | "amazon" | "manual";
  url: string;
  title: string;
  description: string;
  priceUSD: number;
  originalPriceUSD?: number;
  shippingCostUSD?: number;
  shippingDays?: number;
  imageUrls: string[];
  category?: string;
  reviewCount?: number;
  avgRating?: number;
  ordersCount?: number;
  sellerName?: string;
  variants?: { name: string; values: string[] }[];
};

// ---------- Meta Ad Library ----------
export type MetaAdSample = {
  advertiser: string;
  adCopy: string;
  ctaType?: string;
  imageUrl?: string;
  runtimeDays?: number;
};
export type MetaAdsResult = {
  query: string;
  countryCode: string;
  totalActiveAds: number;
  avgAdAge: number; // days
  topAdvertisers: { pageName: string; pageUrl?: string; adCount: number; oldestAdDate?: string }[];
  sampleAds: MetaAdSample[];
};

// ---------- TikTok hashtag ----------
export type TikTokVideoSummary = {
  url: string;
  views: number;
  likes: number;
  postedDate?: string;
  creator?: string;
};
export type TikTokTrendData = {
  hashtag: string;
  totalViews: number;
  videoCount: number;
  recentTopVideos: TikTokVideoSummary[];
  hashtagAgeDays?: number;
  currentVelocity: number; // views/day rough estimate
};

// ---------- Google Trends ----------
export type GoogleTrendsData = {
  keyword: string;
  countryCode: string;
  interestOverTime: number[]; // last ~52 weeks
  velocity: number; // -100..100, slope-normalized
  peakMonth?: string; // ISO yyyy-mm
  relatedQueries: string[];
};

// ---------- Enrichment bundle passed to scoring ----------
export type EnrichmentBundle = {
  product?: ScrapedProduct;
  metaAds?: MetaAdsResult;
  tiktok?: TikTokTrendData;
  googleTrends?: GoogleTrendsData;
};

export type EnrichmentSources = {
  productScrape?: { source: "aliexpress" | "temu" | "amazon"; scrapedAt: string };
  metaAds?: { scrapedAt: string; totalActiveAds: number };
  tiktok?: { scrapedAt: string; totalViews: number };
  googleTrends?: { scrapedAt: string; velocity: number };
};
