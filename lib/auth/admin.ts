import "server-only";
import {
  createSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";

/**
 * Admin role helpers.
 *
 * Single source of truth for who is an admin is the ADMIN_EMAILS env var
 * (server-only — never imported in client code). We sync that into
 * `profiles.is_admin` so RLS policies + UI components can check it cheaply
 * without re-reading env on every request.
 */

/**
 * Returns the lowercase, deduped admin email list from env.
 * SERVER ONLY — never expose to the browser.
 */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const list = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(list));
}

/** Case-insensitive check against the ADMIN_EMAILS list. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/**
 * Syncs `profiles.is_admin` to match what the env list says.
 *
 * Idempotent and cheap: only writes if the flag has actually drifted from the
 * desired state. Returns the resolved admin status (true/false), or `null`
 * when the service role key is missing — callers should treat null as "don't
 * know, assume non-admin and warn in logs".
 *
 * Uses the service role client because `is_admin` is locked from
 * authenticated writes by RLS — only service role can flip it.
 */
export async function syncAdminFlag(
  userId: string,
  email: string | null | undefined,
): Promise<boolean | null> {
  if (!isSupabaseAdminConfigured()) {
    // Without the service role key we can't write is_admin from server code.
    // The flag stays at whatever it was last set to. Log once per process so
    // it's obvious in dev but doesn't spam.
    warnOnce(
      "[admin] SUPABASE_SECRET_KEY missing — admin sync skipped. Set it in .env.local so the admin flag stays in sync with ADMIN_EMAILS.",
    );
    return null;
  }

  const shouldBeAdmin = isAdminEmail(email);
  const supabase = createSupabaseAdminClient();

  const { data: profile, error: readErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (readErr) {
    // Probably "no rows" — profile may not exist yet (trigger races on signup).
    // Caller can retry on next signin; not fatal.
    return null;
  }

  // Only write if state has drifted — saves a write on most signins.
  if (profile && (profile as { is_admin: boolean }).is_admin !== shouldBeAdmin) {
    // The supabase-js typings reject updates without generated DB types,
    // so cast the table reference to `any` for this one write. We know the
    // column exists (migration 003), and the service-role client bypasses
    // RLS so the write is authorized.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("profiles") as any)
      .update({ is_admin: shouldBeAdmin })
      .eq("id", userId);
  }

  return shouldBeAdmin;
}

// ---------------------------------------------------------------------------
// Once-per-process console warning helper. Keeps logs clean.
// ---------------------------------------------------------------------------
const warned = new Set<string>();
function warnOnce(message: string): void {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}
