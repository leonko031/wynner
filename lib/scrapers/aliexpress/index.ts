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

const CACHE_PREFIX = "ali:";

/**
 * AliExpress product scraper. Normalizes regional domains so we always go to
 * the .com version, which has the most-stable selectors and English fields.
 */
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Force aliexpress.com; redirect-safe (the page renders product fine).
    u.hostname = "www.aliexpress.com";
    // Drop tracking params except item id
    const item = u.pathname.match(/item\/([^/]+)\.html/i)?.[1];
    if (item) {
      u.pathname = `/item/${item}.html`;
    }
    u.search = "";
    return u.toString();
  } catch {
    return url;
  }
}

function parseNumber(s: string | undefined | null): number | undefined {
  if (!s) return undefined;
  const cleaned = s.replace(/[^\d.,]/g, "").replace(/,/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function extractJsonLd($: cheerio.CheerioAPI): Record<string, unknown> | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const raw = $(scripts[i]).contents().text();
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed && (parsed["@type"] === "Product" || Array.isArray(parsed["@graph"]))) {
        return parsed;
      }
    } catch {
      // skip
    }
  }
  return null;
}

export function isAliExpressUrl(url: string): boolean {
  return /(?:^|\/\/)([\w-]+\.)?aliexpress\.[\w.]+\//i.test(url);
}

export async function scrapeAliExpressProduct(
  url: string,
  opts: { forceRefresh?: boolean } = {},
): Promise<ScraperResult<ScrapedProduct>> {
  if (!isScrapingBeeConfigured()) {
    return err("ScrapingBee not configured", "no_config");
  }
  if (!isAliExpressUrl(url)) {
    return err("Not an AliExpress URL", "bad_url");
  }
  const canonical = normalizeUrl(url);
  const cacheKey = `${CACHE_PREFIX}${canonical}`;
  if (!opts.forceRefresh) {
    const cached = cacheGet<ScrapedProduct>(cacheKey);
    if (cached) return ok(cached, { cached: true });
  }

  try {
    const { html, creditsUsed } = await fetchScrapingBee({
      url: canonical,
      renderJs: true,
      premiumProxy: true,
      waitForSelector: "h1",
      timeoutMs: 30_000,
    });
    const $ = cheerio.load(html);

    // Prefer JSON-LD when present.
    const ld = extractJsonLd($);
    const ldOffer =
      ld && typeof ld === "object" && "offers" in ld
        ? ((ld as { offers?: unknown }).offers as Record<string, unknown>)
        : null;

    const title =
      (ld?.name as string | undefined) ||
      $("h1").first().text().trim() ||
      $("[data-pl='product-title']").first().text().trim() ||
      "AliExpress product";

    const description =
      (ld?.description as string | undefined) ||
      $('meta[name="description"]').attr("content") ||
      "";

    const priceUSD =
      (ldOffer && parseNumber(String((ldOffer.price as string | number | undefined) ?? ""))) ||
      parseNumber($('[class*="product-price-value"]').first().text()) ||
      parseNumber($('[class*="price--current"]').first().text()) ||
      0;

    const originalPriceUSD = parseNumber(
      $('[class*="product-price-original"]').first().text() ||
        $('[class*="price--original"]').first().text(),
    );

    const images: string[] = [];
    $('img[src*="alicdn"]').each((_, el) => {
      const src = $(el).attr("src");
      if (src && src.startsWith("http") && images.length < 6) images.push(src);
    });
    if (ld?.image) {
      const arr = Array.isArray(ld.image) ? ld.image : [ld.image];
      for (const src of arr) if (typeof src === "string") images.unshift(src);
    }

    const ratingText =
      $('[class*="overview-rating"]').first().text() ||
      $('[class*="reviewer-reviews"]').first().text() ||
      ($("script:contains('avgStar')").first().text().match(/avgStar":(\d+(?:\.\d+)?)/)?.[1] ?? "");
    const avgRating = parseNumber(ratingText);

    const reviewCount =
      parseNumber($('[class*="reviewer-reviews"]').first().text()) ||
      parseNumber($("[class*='Reviews']").first().text());

    const ordersText =
      $('[class*="product-reviewer-sold"]').first().text() ||
      $("span:contains('sold')").first().text();
    const ordersCount = parseNumber(ordersText);

    const sellerName =
      $('[class*="store-name"]').first().text().trim() ||
      $('a[href*="/store/"]').first().text().trim() ||
      undefined;

    const product: ScrapedProduct = {
      source: "aliexpress",
      url: canonical,
      title,
      description: description.slice(0, 600),
      priceUSD,
      originalPriceUSD,
      imageUrls: Array.from(new Set(images)).slice(0, 5),
      reviewCount,
      avgRating,
      ordersCount,
      sellerName,
    };

    cacheSet(cacheKey, product);
    return ok(product, { creditsUsed });
  } catch (e) {
    if (e instanceof ScrapingBeeError) {
      return err(e.message, e.status === 401 ? "no_config" : "scrape_failed");
    }
    return err(e instanceof Error ? e.message : "Unknown scrape error", "scrape_failed");
  }
}
