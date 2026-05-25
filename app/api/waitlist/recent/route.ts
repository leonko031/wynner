import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
// Refreshed every 30s — matches the count poll cadence. Cheap query.
export const revalidate = 30;

/**
 * GET /api/waitlist/recent
 *
 * Public. Returns the 8 most recent signups, anonymized:
 *   • email  → first char + *** + @domain   ("m***@gmail.com")
 *   • source → country code if discoverable, otherwise "organic"
 *   • createdAt → ISO, the UI formats as relative time
 *
 * No personal info leaks — only enough signal to populate the activity
 * ticker on the waitlist page. Returns an empty array when no signups
 * exist yet (the page hides the ticker in that case).
 */
function anonymizeEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  const first = local[0] ?? "*";
  return `${first}***@${domain}`;
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ rows: [] });
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("waitlist")
      .select("email, source, created_at")
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw error;
    const rows = ((data ?? []) as { email: string; source: string | null; created_at: string }[])
      .map((r) => ({
        email: anonymizeEmail(r.email),
        source: r.source ?? "organic",
        createdAt: r.created_at,
      }));
    return NextResponse.json({ rows });
  } catch (e) {
    console.error("[waitlist/recent] failed", e);
    return NextResponse.json({ rows: [] });
  }
}
