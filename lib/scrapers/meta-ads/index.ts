import * as cheerio from "cheerio";
import {
  err,
  ok,
  type MetaAdsResult,
  type MetaAdSample,
  type ScraperResult,
} from "@/lib/scrapers/types";
import {
  fetchScrapingBee,
  isScrapingBeeConfigured,
  ScrapingBeeError,
} from "@/lib/scrapers/scrapingbee";
import { cacheGet, cacheSet } from "@/lib/scrapers/cache";

const CACHE_PREFIX = "metaads:";

export type MetaAdsInput = { query: string; countryCode: string; limit?: number };

function parseNumber(s: string | undefined | null): number | undefined {
  if (!s) return undefined;
  const cleaned = s.replace(/[^\d.,]/g, "").replace(/,/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

export async function scrapeMetaAds(
  input: MetaAdsInput,
  opts: { forceRefresh?: boolean } = {},
): Promise<ScraperResult<MetaAdsResult>> {
  if (!isScrapingBeeConfigured()) {
    return err("ScrapingBee not configured", "no_config");
  }
  const q = input.query.trim();
  if (!q) return err("Empty query", "bad_input");
  const country = input.countryCode.toUpperCase();
  const cacheKey = `${CACHE_PREFIX}${country}:${q.toLowerCase()}`;
  if (!opts.forceRefresh) {
    const cached = cacheGet<MetaAdsResult>(cacheKey);
    if (cached) return ok(cached, { cached: true });
  }

  const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${encodeURIComponent(country)}&q=${encodeURIComponent(q)}&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped`;

  try {
    const { html, creditsUsed } = await fetchScrapingBee({
      url,
      renderJs: true,
      premiumProxy: true,
      countryCode: country,
      waitMs: 5_000,
      timeoutMs: 35_000,
    });
    const $ = cheerio.load(html);

    // Total result count — appears in the page header. Selectors drift; try a
    // few patterns.
    const totalText =
      $("div[role='heading']")
        .filter((_, el) => /result/i.test($(el).text()))
        .first()
        .text() ||
      $("div:contains('~') :first-child").first().text() ||
      "";
    const totalActiveAds = parseNumber(totalText) ?? 0;

    // Advertiser cards: collect page name + ad-count clusters.
    type Advert = { pageName: string; pageUrl?: string; adCount: number };
    const advertMap = new Map<string, Advert>();

    $("a[href*='/ads/library/?id='], a[href*='facebook.com/'][role='link']").each(
      (_, el) => {
        const $el = $(el);
        const name = $el.text().trim();
        if (!name || name.length > 60) return;
        const href = $el.attr("href");
        const existing = advertMap.get(name);
        if (existing) {
          existing.adCount += 1;
        } else {
          advertMap.set(name, {
            pageName: name,
            pageUrl: href ?? undefined,
            adCount: 1,
          });
        }
      },
    );
    const topAdvertisers = Array.from(advertMap.values())
      .sort((a, b) => b.adCount - a.adCount)
      .slice(0, 5);

    // Sample ad bodies — Meta's Ad Library renders ad copy in spans with a
    // distinctive container. Fall back to any reasonably long text block.
    const sampleAds: MetaAdSample[] = [];
    $('div[role="article"], div[data-pagelet*="Ad"]').each((_, el) => {
      const $el = $(el);
      const body = $el.find('div[dir="auto"]').first().text().trim();
      if (!body || body.length < 30 || body.length > 600) return;
      const advertiser = $el.find('a[role="link"]').first().text().trim();
      const cta = $el.find('a[role="button"]').first().text().trim() || undefined;
      const img = $el.find("img").first().attr("src") || undefined;
      sampleAds.push({
        advertiser,
        adCopy: body,
        ctaType: cta,
        imageUrl: img,
      });
      if (sampleAds.length >= (input.limit ?? 6)) return false;
    });

    const result: MetaAdsResult = {
      query: q,
      countryCode: country,
      totalActiveAds,
      avgAdAge: 0, // Ad Library hides exact dates in DOM; left at 0 for now.
      topAdvertisers,
      sampleAds,
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
