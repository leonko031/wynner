import * as cheerio from "cheerio";
import {
  err,
  ok,
  type ScraperResult,
  type TikTokTrendData,
  type TikTokVideoSummary,
} from "@/lib/scrapers/types";
import {
  fetchScrapingBee,
  isScrapingBeeConfigured,
  ScrapingBeeError,
} from "@/lib/scrapers/scrapingbee";
import { cacheGet, cacheSet } from "@/lib/scrapers/cache";

const CACHE_PREFIX = "tiktok:";

function parseCompact(s: string | undefined | null): number | undefined {
  if (!s) return undefined;
  const trimmed = s.replace(/[, ]/g, "").trim();
  const m = trimmed.match(/^([\d.]+)\s*([KMB])?$/i);
  if (!m) {
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
  }
  const base = Number(m[1]);
  if (!Number.isFinite(base)) return undefined;
  const mult =
    m[2]?.toUpperCase() === "K"
      ? 1_000
      : m[2]?.toUpperCase() === "M"
        ? 1_000_000
        : m[2]?.toUpperCase() === "B"
          ? 1_000_000_000
          : 1;
  return base * mult;
}

export async function scrapeTikTokHashtag(
  hashtag: string,
  opts: { forceRefresh?: boolean } = {},
): Promise<ScraperResult<TikTokTrendData>> {
  if (!isScrapingBeeConfigured()) {
    return err("ScrapingBee not configured", "no_config");
  }
  const tag = hashtag.replace(/^#/, "").trim();
  if (!tag) return err("Empty hashtag", "bad_input");
  const cacheKey = `${CACHE_PREFIX}${tag.toLowerCase()}`;
  const prev = cacheGet<TikTokTrendData>(cacheKey);
  if (!opts.forceRefresh && prev) return ok(prev, { cached: true });

  try {
    const { html, creditsUsed } = await fetchScrapingBee({
      url: `https://www.tiktok.com/tag/${encodeURIComponent(tag)}`,
      renderJs: true,
      premiumProxy: true,
      waitMs: 4_000,
      timeoutMs: 35_000,
    });
    const $ = cheerio.load(html);

    // Header stats: total views / video count appear as compact numbers
    // ("4.2B views"). Selectors drift; try several patterns.
    const headerText = $("h2, h3, strong, span")
      .map((_, el) => $(el).text())
      .get()
      .join("\n");

    const viewsMatch = headerText.match(/([\d.,]+\s*[KMB]?)\s*views?/i);
    const totalViews = parseCompact(viewsMatch?.[1]) ?? 0;

    const videoCountMatch = headerText.match(/([\d.,]+\s*[KMB]?)\s*(videos|posts)?/i);
    const videoCount = parseCompact(videoCountMatch?.[1]) ?? 0;

    const recentTopVideos: TikTokVideoSummary[] = [];
    $('a[href*="/video/"]').each((_, el) => {
      const href = $(el).attr("href");
      if (!href || recentTopVideos.length >= 6) return;
      const url = href.startsWith("http") ? href : `https://www.tiktok.com${href}`;
      const v = $(el)
        .find('[data-e2e="video-views"], strong')
        .first()
        .text()
        .trim();
      const creator = url.match(/@([\w.-]+)\//)?.[1];
      recentTopVideos.push({
        url,
        views: parseCompact(v) ?? 0,
        likes: 0,
        creator,
      });
    });

    // Velocity: compare today's views with the cached value (delta per day).
    let velocity = 0;
    if (prev) {
      const deltaViews = totalViews - prev.totalViews;
      // We don't know exact age of the cached value; assume the cache TTL window (1d).
      velocity = Math.round(deltaViews);
    }

    const result: TikTokTrendData = {
      hashtag: tag,
      totalViews,
      videoCount,
      recentTopVideos,
      currentVelocity: velocity,
    };
    cacheSet(cacheKey, result);
    return ok(result, { creditsUsed });
  } catch (e) {
    if (e instanceof ScrapingBeeError) {
      return err(e.message, e.status === 401 ? "no_config" : "scrape_failed");
    }
    return err(e instanceof Error ? e.message : "Unknown error", "scrape_failed");
  }
}
