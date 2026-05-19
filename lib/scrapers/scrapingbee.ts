/**
 * Thin ScrapingBee fetch wrapper.
 *
 * Returns the raw HTML body plus credits-used (from `Spb-Cost` response header).
 * Throws a typed `ScrapingBeeError` on failure so the scraper modules can map
 * to their own `err()` shape.
 */

const ENDPOINT = "https://app.scrapingbee.com/api/v1/";
const USAGE_ENDPOINT = "https://app.scrapingbee.com/api/v1/usage";

export class ScrapingBeeError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function isScrapingBeeConfigured(): boolean {
  return Boolean(process.env.SCRAPINGBEE_API_KEY);
}

export type ScrapingBeeOptions = {
  url: string;
  renderJs?: boolean; // default false
  premiumProxy?: boolean; // default false
  countryCode?: string; // ISO-2, requires premium_proxy
  waitMs?: number; // wait_browser
  waitForSelector?: string;
  timeoutMs?: number; // request timeout, defaults to 30s
};

export type ScrapingBeeResponse = {
  html: string;
  status: number;
  creditsUsed: number;
};

export async function fetchScrapingBee(
  opts: ScrapingBeeOptions,
): Promise<ScrapingBeeResponse> {
  const key = process.env.SCRAPINGBEE_API_KEY;
  if (!key) {
    throw new ScrapingBeeError("SCRAPINGBEE_API_KEY missing", 401);
  }
  const params = new URLSearchParams({
    api_key: key,
    url: opts.url,
    render_js: opts.renderJs ? "true" : "false",
    premium_proxy: opts.premiumProxy ? "true" : "false",
  });
  if (opts.countryCode) params.set("country_code", opts.countryCode.toLowerCase());
  if (opts.waitMs) params.set("wait", String(opts.waitMs));
  if (opts.waitForSelector) params.set("wait_for", opts.waitForSelector);

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30_000);

  try {
    const resp = await fetch(`${ENDPOINT}?${params}`, { signal: controller.signal });
    const html = await resp.text();
    const creditsHeader = resp.headers.get("Spb-Cost") ?? resp.headers.get("spb-cost");
    const creditsUsed = creditsHeader ? Number(creditsHeader) : 0;
    if (!resp.ok) {
      throw new ScrapingBeeError(
        `ScrapingBee ${resp.status}: ${html.slice(0, 160)}`,
        resp.status,
      );
    }
    return { html, status: resp.status, creditsUsed };
  } catch (e) {
    if (e instanceof ScrapingBeeError) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new ScrapingBeeError("ScrapingBee request timed out", 408);
    }
    throw new ScrapingBeeError(
      e instanceof Error ? e.message : "Unknown ScrapingBee error",
      500,
    );
  } finally {
    clearTimeout(t);
  }
}

export type CreditUsage = {
  max: number;
  used: number;
  remaining: number;
  resetsOn?: string;
};

export async function getScrapingBeeUsage(): Promise<CreditUsage | null> {
  const key = process.env.SCRAPINGBEE_API_KEY;
  if (!key) return null;
  try {
    const resp = await fetch(`${USAGE_ENDPOINT}?api_key=${encodeURIComponent(key)}`, {
      cache: "no-store",
    });
    if (!resp.ok) return null;
    type UsageResp = {
      max_api_credits?: number;
      used_api_credit?: number;
      used_api_credits?: number;
      reset_at?: string;
    };
    const data = (await resp.json()) as UsageResp;
    const max = data.max_api_credits ?? 0;
    const used = data.used_api_credit ?? data.used_api_credits ?? 0;
    return {
      max,
      used,
      remaining: Math.max(0, max - used),
      resetsOn: data.reset_at,
    };
  } catch {
    return null;
  }
}
