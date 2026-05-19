import { NextResponse } from "next/server";
import { isGeminiAvailable } from "@/lib/ai/gemini";
import {
  getConfiguredUsername,
  isRedditConfigured,
} from "@/lib/scrapers/reddit/client";
import { isScrapingBeeConfigured } from "@/lib/scrapers/scrapingbee";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    gemini: { configured: isGeminiAvailable() },
    reddit: {
      configured: isRedditConfigured(),
      username: getConfiguredUsername(),
    },
    scrapingbee: { configured: isScrapingBeeConfigured() },
  });
}
