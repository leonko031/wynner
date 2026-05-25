import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
// Cached for 30 seconds — the waitlist page polls every 30s, this keeps the
// DB load to ~2 queries/minute across all visitors per Vercel instance.
export const revalidate = 30;

/**
 * GET /api/waitlist/count
 *
 * Public. Returns the current waitlist size. Cached server-side via the
 * `revalidate` export so simultaneous polls hit the cache, not Supabase.
 *
 * Falls back to 0 when Supabase isn't configured (demo / staging).
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ count: 0, updatedAt: new Date().toISOString() });
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return NextResponse.json({
      count: count ?? 0,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[waitlist/count] failed", e);
    // Never break the page — fall back to 0 + a stale timestamp.
    return NextResponse.json(
      { count: 0, updatedAt: new Date().toISOString() },
      { status: 200 },
    );
  }
}
