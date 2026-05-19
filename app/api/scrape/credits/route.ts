import { NextResponse } from "next/server";
import {
  getScrapingBeeUsage,
  isScrapingBeeConfigured,
} from "@/lib/scrapers/scrapingbee";

export const runtime = "nodejs";

export async function GET() {
  if (!isScrapingBeeConfigured()) {
    return NextResponse.json(
      { configured: false, error: "SCRAPINGBEE_API_KEY missing" },
      { status: 503 },
    );
  }
  const usage = await getScrapingBeeUsage();
  if (!usage) {
    return NextResponse.json(
      { configured: true, error: "Could not fetch usage from ScrapingBee" },
      { status: 502 },
    );
  }
  return NextResponse.json({ configured: true, ...usage });
}
