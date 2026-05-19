import { NextResponse } from "next/server";
import { scrapeProductFromUrl, detectSource } from "@/lib/scrapers/router";

export const runtime = "nodejs";
export const maxDuration = 45;

type Body = { url?: string; forceRefresh?: boolean };

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }
  const detected = detectSource(body.url);
  if (detected === "unknown") {
    return NextResponse.json(
      { error: "URL must be from AliExpress, Temu, or Amazon", code: "bad_url" },
      { status: 400 },
    );
  }
  const result = await scrapeProductFromUrl(body.url, {
    forceRefresh: body.forceRefresh,
  });
  if (!result.ok) {
    const status = result.code === "no_config" ? 503 : 502;
    return NextResponse.json(
      { error: result.error, code: result.code, source: detected },
      { status },
    );
  }
  return NextResponse.json({
    ...result.data,
    cached: result.cached,
    creditsUsed: result.creditsUsed,
    source: detected,
  });
}
