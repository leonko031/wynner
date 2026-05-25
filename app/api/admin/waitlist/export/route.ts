import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/waitlist/export?confirmed=true|false
 *
 * Streams a CSV download of every waitlist row.
 *
 * Admin-only — requireAdmin() throws redirect for non-admins, the response
 * never reaches a non-admin client.
 */
export async function GET(req: Request) {
  await requireAdmin();
  if (!isSupabaseAdminConfigured()) {
    return new Response("Service role key missing", { status: 503 });
  }
  const url = new URL(req.url);
  const confirmedFilter = url.searchParams.get("confirmed");

  const admin = createSupabaseAdminClient();
  let q = admin
    .from("waitlist")
    .select(
      "position, email, referral_code, referrals_count, source, email_confirmed, email_confirmed_at, created_at, ip_address",
    )
    .order("position", { ascending: true });
  if (confirmedFilter === "true") q = q.eq("email_confirmed", true);
  if (confirmedFilter === "false") q = q.eq("email_confirmed", false);

  const { data, error } = await q;
  if (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }

  const rows = (data ?? []) as Array<{
    position: number;
    email: string;
    referral_code: string;
    referrals_count: number;
    source: string | null;
    email_confirmed: boolean;
    email_confirmed_at: string | null;
    created_at: string;
    ip_address: string | null;
  }>;

  // Escape CSV cells.
  const esc = (v: string | number | boolean | null) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header =
    "position,email,referral_code,referrals_count,source,email_confirmed,email_confirmed_at,created_at,ip_address";
  const lines = rows.map((r) =>
    [
      r.position,
      r.email,
      r.referral_code,
      r.referrals_count,
      r.source,
      r.email_confirmed,
      r.email_confirmed_at,
      r.created_at,
      r.ip_address,
    ]
      .map(esc)
      .join(","),
  );
  const csv = [header, ...lines].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wynner-waitlist-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
