import { NextResponse } from "next/server";
import { runScore } from "@/lib/scoring";
import { isGeminiAvailable } from "@/lib/ai/gemini";
import { getCountry } from "@/lib/data/countries";
import { NICHE_KEYS, SOURCES, type Niche } from "@/types";
import type { EnrichmentBundle } from "@/lib/scrapers/types";
import { scrapeMetaAds } from "@/lib/scrapers/meta-ads";
import { scrapeTikTokHashtag } from "@/lib/scrapers/tiktok";
import { getTrendData } from "@/lib/scrapers/google-trends";

export const runtime = "nodejs";
export const maxDuration = 90;

type ProductInput = {
  name: string;
  description: string;
  image: string;
  category: string;
  costUSD: number;
  suggestedPriceUSD: number;
  shippingCostUSD: number;
  source: string;
};

type EnrichToggles = {
  metaAds?: boolean;
  tiktok?: boolean;
  googleTrends?: boolean;
};

type Body = {
  productInput: ProductInput;
  countryCode: string;
  enrich?: EnrichToggles;
};

function validate(body: Body): { ok: true } | { ok: false; error: string } {
  const p = body?.productInput;
  if (!p) return { ok: false, error: "productInput missing" };
  if (!p.name?.trim()) return { ok: false, error: "name required" };
  if (!Number.isFinite(p.costUSD) || p.costUSD < 0)
    return { ok: false, error: "costUSD must be a number ≥ 0" };
  if (!Number.isFinite(p.suggestedPriceUSD) || p.suggestedPriceUSD <= 0)
    return { ok: false, error: "suggestedPriceUSD must be > 0" };
  if (!Number.isFinite(p.shippingCostUSD) || p.shippingCostUSD < 0)
    return { ok: false, error: "shippingCostUSD must be ≥ 0" };
  if (!(NICHE_KEYS as readonly string[]).includes(p.category))
    return { ok: false, error: "category invalid" };
  if (!(SOURCES as readonly string[]).includes(p.source))
    return { ok: false, error: "source invalid" };
  if (!getCountry(body.countryCode))
    return { ok: false, error: "countryCode invalid" };
  return { ok: true };
}

function hashtagFromProduct(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(/\s+/)
    .slice(0, 3)
    .join("");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ error: "invalid json" }, { status: 400 });

  const v = validate(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const country = getCountry(body.countryCode)!;
  const toggles = body.enrich ?? {};

  // Gather enrichment in parallel — every scraper degrades to undefined on failure
  // so the score always completes.
  const [metaAdsR, tiktokR, trendsR] = await Promise.all([
    toggles.metaAds
      ? scrapeMetaAds({ query: body.productInput.name, countryCode: country.code })
      : Promise.resolve(null),
    toggles.tiktok
      ? scrapeTikTokHashtag(hashtagFromProduct(body.productInput.name))
      : Promise.resolve(null),
    toggles.googleTrends
      ? getTrendData(body.productInput.name, country.code)
      : Promise.resolve(null),
  ]);

  const enrichment: EnrichmentBundle = {
    metaAds: metaAdsR && metaAdsR.ok ? metaAdsR.data : undefined,
    tiktok: tiktokR && tiktokR.ok ? tiktokR.data : undefined,
    googleTrends: trendsR && trendsR.ok ? trendsR.data : undefined,
  };

  const result = await runScore(
    {
      product: {
        name: body.productInput.name,
        description: body.productInput.description ?? "",
        image: body.productInput.image ?? "",
        category: body.productInput.category as Niche,
        costUSD: body.productInput.costUSD,
        suggestedPriceUSD: body.productInput.suggestedPriceUSD,
        shippingCostUSD: body.productInput.shippingCostUSD,
        source: body.productInput.source as
          | "aliexpress"
          | "temu"
          | "amazon"
          | "manual",
      },
      country,
    },
    enrichment,
  );

  return NextResponse.json({
    ...result,
    aiUsed: isGeminiAvailable(),
    enrichmentAttempted: toggles,
    enrichmentResolved: {
      metaAds: Boolean(enrichment.metaAds),
      tiktok: Boolean(enrichment.tiktok),
      googleTrends: Boolean(enrichment.googleTrends),
    },
  });
}
