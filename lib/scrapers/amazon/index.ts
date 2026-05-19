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

const CACHE_PREFIX = "amzn:";

export function isAmazonUrl(url: string): boolean {
  return /(?:^|\/\/)([\w-]+\.)?amazon\.[\w.]+\//i.test(url);
}

function parseNumber(s: string | undefined | null): number | undefined {
  if (!s) return undefined;
  const cleaned = s.replace(/[^\d.,]/g, "").replace(/,/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function asin(url: string): string | null {
  const m =
    url.match(/\/dp\/([A-Z0-9]{10})/i) ||
    url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  return m ? m[1] : null;
}

export async function scrapeAmazonProduct(
  url: string,
  opts: { forceRefresh?: boolean } = {},
): Promise<ScraperResult<ScrapedProduct>> {
  if (!isScrapingBeeConfigured()) {
    return err("ScrapingBee not configured", "no_config");
  }
  if (!isAmazonUrl(url)) return err("Not an Amazon URL", "bad_url");

  const id = asin(url) ?? url;
  const cacheKey = `${CACHE_PREFIX}${id}`;
  if (!opts.forceRefresh) {
    const cached = cacheGet<ScrapedProduct>(cacheKey);
    if (cached) return ok(cached, { cached: true });
  }

  try {
    // Amazon usually renders fine without JS.
    const { html, creditsUsed } = await fetchScrapingBee({
      url,
      renderJs: false,
      premiumProxy: true,
      timeoutMs: 30_000,
    });
    const $ = cheerio.load(html);

    const title =
      $("#productTitle").first().text().trim() ||
      $("h1").first().text().trim() ||
      "Amazon product";

    const description =
      $("#feature-bullets ul").first().text().trim().replace(/\s+/g, " ") ||
      $("#productDescription").first().text().trim() ||
      $('meta[name="description"]').attr("content") ||
      "";

    const priceText =
      $(".a-price .a-offscreen").first().text() ||
      $("#priceblock_ourprice").first().text() ||
      $("#priceblock_dealprice").first().text();
    const priceUSD = parseNumber(priceText) ?? 0;

    const originalPriceUSD = parseNumber(
      $("span.priceBlockStrikePriceString").first().text() ||
        $(".a-text-price .a-offscreen").first().text(),
    );

    const images: string[] = [];
    const hi = $("#landingImage").attr("data-old-hires") || $("#landingImage").attr("src");
    if (hi) images.push(hi);
    $("#altImages img").each((_, el) => {
      const src = $(el).attr("src");
      if (src && images.length < 6) images.push(src.replace(/_S[XY]\d+_/g, "_SL800_"));
    });

    const reviewCount = parseNumber(
      $("#acrCustomerReviewText").first().text() ||
        $("[data-hook='total-review-count']").first().text(),
    );
    const avgRating = parseNumber(
      $("span.a-icon-alt").first().text() ||
        $("[data-hook='rating-out-of-text']").first().text(),
    );

    const sellerName =
      $("#sellerProfileTriggerId").first().text().trim() ||
      $("#bylineInfo").first().text().trim() ||
      undefined;

    const product: ScrapedProduct = {
      source: "amazon",
      url,
      title,
      description: description.slice(0, 600),
      priceUSD,
      originalPriceUSD,
      imageUrls: Array.from(new Set(images)).slice(0, 5),
      reviewCount,
      avgRating,
      sellerName,
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
