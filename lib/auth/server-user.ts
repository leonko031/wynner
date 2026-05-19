import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isAdminEmail, syncAdminFlag } from "./admin";
import type { Profile } from "@/types/profile";
import type { User } from "@supabase/supabase-js";

/**
 * Per-process throttle for admin-flag sync — admin status doesn't change
 * second-to-second, so we cap the sync to once per minute per user. Saves a
 * DB write on every server render.
 */
const ADMIN_SYNC_TTL_MS = 60_000;
const adminSyncTimestamps = new Map<string, number>();

function shouldSyncAdmin(userId: string): boolean {
  const last = adminSyncTimestamps.get(userId);
  if (last && Date.now() - last < ADMIN_SYNC_TTL_MS) return false;
  adminSyncTimestamps.set(userId, Date.now());
  return true;
}

export type ServerUserResult = {
  user: User | null;
  profile: Profile | null;
  /** When false, Supabase isn't configured — caller should treat as logged out. */
  configured: boolean;
};

/**
 * Read the current user + their profile row from the server-side cookie
 * session. Used by:
 *   - root layout (to hydrate the UserProvider)
 *   - server components that need to render based on identity
 *   - protected route handlers (callback, sync, etc.)
 *
 * Safe to call even when Supabase isn't configured — returns nulls.
 */
export async function getServerUser(): Promise<ServerUserResult> {
  if (!isSupabaseConfigured()) {
    return { user: null, profile: null, configured: false };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null, configured: true };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  // Safety net: reconcile is_admin if it's drifted from ADMIN_EMAILS.
  // Throttled to once per 60s per user; silently no-ops without the secret key.
  if (profile && shouldSyncAdmin(user.id)) {
    const expected = isAdminEmail(user.email);
    if (profile.is_admin !== expected) {
      const synced = await syncAdminFlag(user.id, user.email);
      if (synced !== null) profile.is_admin = synced;
    }
  }

  return { user, profile: profile ?? null, configured: true };
}
