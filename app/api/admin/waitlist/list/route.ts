import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/waitlist/list
 *
 * Paginated waitlist listing for the admin dashboard. requireAdmin() throws
 * a redirect for non-admins so the route always either returns data or
 * redirects to /auth — never leaks data to a non-admin.
 *
 * Query params:
 *   page=1, limit=50, search=string, source=string,
 *   sortBy=newest|oldest|referrals, confirmed=all|true|false,
 *   from=YYYY-MM-DD, to=YYYY-MM-DD
 */
export async function GET(req: Request) {
  await requireAdmin();
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: { code: "no_admin_client", message: "Service role key missing" } },
      { status: 503 },
    );
  }
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? "50")));
  const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
  const source = (url.searchParams.get("source") ?? "").trim();
  const sortBy = url.searchParams.get("sortBy") ?? "newest";
  const confirmed = url.searchParams.get("confirmed") ?? "all";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const admin = createSupabaseAdminClient();
  let q = admin
    .from("waitlist")
    .select(
      "id, email, position, referral_code, referrals_count, source, email_confirmed, email_confirmed_at, created_at, referred_by",
      { count: "exact" },
    );
  if (search) q = q.ilike("email", `%${search}%`);
  if (source) q = q.eq("source", source);
  if (confirmed === "true") q = q.eq("email_confirmed", true);
  if (confirmed === "false") q = q.eq("email_confirmed", false);
  if (from) q = q.gte("created_at", `${from}T00:00:00Z`);
  if (to) q = q.lte("created_at", `${to}T23:59:59Z`);

  if (sortBy === "oldest") q = q.order("created_at", { ascending: true });
  else if (sortBy === "referrals") q = q.order("referrals_count", { ascending: false });
  else q = q.order("created_at", { ascending: false });

  const start = (page - 1) * limit;
  const end = start + limit - 1;
  q = q.range(start, end);

  const { data, error, count } = await q;
  if (error) {
    return NextResponse.json(
      { error: { code: "db_error", message: error.message } },
      { status: 500 },
    );
  }

  // Top-of-page stats — total + today + week + top source.
  const [{ count: total }, today, week, sources] = await Promise.all([
    admin.from("waitlist").select("*", { count: "exact", head: true }),
    admin
      .from("waitlist")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    admin
      .from("waitlist")
      .select("created_at")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    admin.from("waitlist").select("source"),
  ]);

  // Build last-7-day sparkline buckets (UTC day).
  const days: number[] = Array.from({ length: 7 }, () => 0);
  const nowDay = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  for (const row of (week.data ?? []) as { created_at: string }[]) {
    const t = new Date(row.created_at).getTime();
    const d = Math.floor(t / (24 * 60 * 60 * 1000));
    const offset = 6 - (nowDay - d);
    if (offset >= 0 && offset < 7) days[offset]++;
  }

  // Source breakdown.
  const sourceCounts = new Map<string, number>();
  for (const row of (sources.data ?? []) as { source: string | null }[]) {
    const s = row.source ?? "organic";
    sourceCounts.set(s, (sourceCounts.get(s) ?? 0) + 1);
  }
  const sourceBreakdown = [...sourceCounts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    rows: data ?? [],
    total: count ?? 0,
    page,
    limit,
    stats: {
      total: total ?? 0,
      today: today.count ?? 0,
      week: (week.data ?? []).length,
      weekSparkline: days,
      sourceBreakdown,
    },
  });
}
