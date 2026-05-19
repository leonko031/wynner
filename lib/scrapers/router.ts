import {
  isAliExpressUrl,
  scrapeAliExpressProduct,
} from "./aliexpress";
import { isTemuUrl, scrapeTemuProduct } from "./temu";
import { isAmazonUrl, scrapeAmazonProduct } from "./amazon";
import {
  err,
  type ScrapedProduct,
  type ScraperResult,
} from "./types";

export type DetectedSource = "aliexpress" | "temu" | "amazon" | "unknown";

export function detectSource(url: string): DetectedSource {
  const u = url.trim();
  if (isAliExpressUrl(u)) return "aliexpress";
  if (isTemuUrl(u)) return "temu";
  if (isAmazonUrl(u)) return "amazon";
  return "unknown";
}

export async function scrapeProductFromUrl(
  url: string,
  opts: { forceRefresh?: boolean } = {},
): Promise<ScraperResult<ScrapedProduct>> {
  switch (detectSource(url)) {
    case "aliexpress":
      return scrapeAliExpressProduct(url, opts);
    case "temu":
      return scrapeTemuProduct(url, opts);
    case "amazon":
      return scrapeAmazonProduct(url, opts);
    default:
      return err(
        "URL doesn't match a supported source (AliExpress / Temu / Amazon)",
        "bad_url",
      );
  }
}
