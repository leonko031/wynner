import { err, ok, type GoogleTrendsData, type ScraperResult } from "@/lib/scrapers/types";
import { cacheGet, cacheSet } from "@/lib/scrapers/cache";

const CACHE_PREFIX = "gtrends:";

// google-trends-api has no published types; we import lazily and narrow.
type GTrendsApi = {
  interestOverTime: (opts: {
    keyword: string;
    startTime?: Date;
    endTime?: Date;
    geo?: string;
  }) => Promise<string>;
  relatedQueries: (opts: { keyword: string; geo?: string }) => Promise<string>;
};

let lib: GTrendsApi | null = null;
async function getLib(): Promise<GTrendsApi> {
  if (lib) return lib;
  const mod = (await import("google-trends-api")) as unknown as {
    default?: GTrendsApi;
  } & GTrendsApi;
  lib = (mod.default ?? mod) as GTrendsApi;
  return lib;
}

function computeVelocity(values: number[]): number {
  if (values.length < 8) return 0;
  // Compare last 4 weeks avg vs prior 4 weeks avg, normalize.
  const recent = values.slice(-4).reduce((s, n) => s + n, 0) / 4;
  const prior = values.slice(-8, -4).reduce((s, n) => s + n, 0) / 4;
  if (prior === 0) return recent > 0 ? 100 : 0;
  const pct = ((recent - prior) / prior) * 100;
  return Math.max(-100, Math.min(100, Math.round(pct)));
}

export async function getTrendData(
  keyword: string,
  countryCode: string,
  opts: { forceRefresh?: boolean } = {},
): Promise<ScraperResult<GoogleTrendsData>> {
  const kw = keyword.trim();
  if (!kw) return err("Empty keyword", "bad_input");
  const country = countryCode.toUpperCase();
  const cacheKey = `${CACHE_PREFIX}${country}:${kw.toLowerCase()}`;
  if (!opts.forceRefresh) {
    const cached = cacheGet<GoogleTrendsData>(cacheKey);
    if (cached) return ok(cached, { cached: true });
  }

  try {
    const api = await getLib();
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const interestRaw = await api.interestOverTime({
      keyword: kw,
      startTime: oneYearAgo,
      endTime: now,
      geo: country,
    });
    const interest = JSON.parse(interestRaw) as {
      default?: { timelineData?: { value?: number[]; formattedAxisTime?: string }[] };
    };
    const series = (interest.default?.timelineData ?? [])
      .map((d) => (Array.isArray(d.value) ? d.value[0] ?? 0 : 0))
      .filter((n): n is number => Number.isFinite(n));

    let related: string[] = [];
    try {
      const relRaw = await api.relatedQueries({ keyword: kw, geo: country });
      const rel = JSON.parse(relRaw) as {
        default?: { rankedList?: { rankedKeyword?: { query?: string }[] }[] };
      };
      related = (rel.default?.rankedList ?? [])
        .flatMap((rl) => rl.rankedKeyword ?? [])
        .map((rk) => rk.query)
        .filter((q): q is string => Boolean(q))
        .slice(0, 8);
    } catch {
      // Not always available
    }

    // Peak month
    let peakMonth: string | undefined;
    if (series.length > 0) {
      const maxIdx = series.reduce(
        (best, v, i) => (v > series[best] ? i : best),
        0,
      );
      const peakDate = new Date(
        oneYearAgo.getTime() + (maxIdx / series.length) * (now.getTime() - oneYearAgo.getTime()),
      );
      peakMonth = `${peakDate.getFullYear()}-${String(peakDate.getMonth() + 1).padStart(2, "0")}`;
    }

    const data: GoogleTrendsData = {
      keyword: kw,
      countryCode: country,
      interestOverTime: series,
      velocity: computeVelocity(series),
      peakMonth,
      relatedQueries: related,
    };
    cacheSet(cacheKey, data);
    return ok(data, { creditsUsed: 0 });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unknown error", "scrape_failed");
  }
}
