import * as cheerio from "cheerio";
import {
  err,
  ok,
  type ScrapedProduct,
  type ScraperResult,
} from "@/lib/scrapers/types";
import {
  fetchScrapingBee,
  isScrapingBeeConfigured,
  ScrapingBeeError,
} from "@/lib/scrapers/scrapingbee";
import { cacheGet, cacheSet } from "@/lib/scrapers/cache";

const CACHE_PREFIX = "temu:";

export function isTemuUrl(url: string): boolean {
  return /(?:^|\/\/)([\w-]+\.)?temu\.[\w.]+\//i.test(url);
}

function parseNumber(s: string | undefined | null): number | undefined {
  if (!s) return undefined;
  const cleaned = s.replace(/[^\d.,]/g, "").replace(/,/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

export async function scrapeTemuProduct(
  url: string,
  opts: { forceRefresh?: boolean } = {},
): Promise<ScraperResult<ScrapedProduct>> {
  if (!isScrapingBeeConfigured()) {
    return err("ScrapingBee not configured", "no_config");
  }
  if (!isTemuUrl(url)) return err("Not a Temu URL", "bad_url");

  const cacheKey = `${CACHE_PREFIX}${url}`;
  if (!opts.forceRefresh) {
    const cached = cacheGet<ScrapedProduct>(cacheKey);
    if (cached) return ok(cached, { cached: true });
  }

  try {
    const { html, creditsUsed } = await fetchScrapingBee({
      url,
      renderJs: true,
      premiumProxy: true,
      waitForSelector: "h1",
      timeoutMs: 30_000,
    });
    const $ = cheerio.load(html);

    const title =
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      "Temu product";

    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    const priceUSD =
      parseNumber($('div[class*="price"]').first().text()) ||
      parseNumber($('[data-tooltip="Price"]').first().text()) ||
      0;

    const originalPriceUSD = parseNumber(
      $('span[class*="OriginalPrice"]').first().text() ||
        $('span:contains("List Price")').next().text(),
    );

    const images: string[] = [];
    $('img').each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && /temu|kwcdn/.test(src) && images.length < 6) images.push(src);
    });
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) images.unshift(ogImage);

    const reviewCount = parseNumber($("span:contains('Reviews')").first().text());
    const avgRating = parseNumber($("div[class*='Star'] + span").first().text());

    const product: ScrapedProduct = {
      source: "temu",
      url,
      title,
      description: description.slice(0, 600),
      priceUSD,
      originalPriceUSD,
      imageUrls: Array.from(new Set(images)).slice(0, 5),
      reviewCount,
      avgRating,
    };

    cacheSet(cacheKey, product);
    return ok(product, { creditsUsed });
  } catch (e) {
    if (e instanceof ScrapingBeeError) {
      return err(e.message, e.status === 401 ? "no_config" : "scrape_failed");
    }
    return err(e instanceof Error ? e.message : "Unknown error", "scrape_failed");
  }
}
