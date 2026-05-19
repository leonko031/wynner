import { NextResponse } from "next/server";
import { testRedditConnection } from "@/lib/scrapers/reddit/client";

export const runtime = "nodejs";

export async function POST() {
  const result = await testRedditConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
