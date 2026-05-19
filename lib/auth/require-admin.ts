import "server-only";
import { redirect } from "next/navigation";
import { getServerUser } from "./server-user";
import type { Profile } from "@/types/profile";
import type { User } from "@supabase/supabase-js";

/**
 * Server-side guard for admin-only pages and route handlers.
 *
 * Behavior:
 *   • No user signed in → throws by redirecting to /auth?redirect=...
 *   • Signed in but not admin → throws by redirecting to /dashboard with
 *     ?error=admin_only so the dashboard can flash a toast
 *   • Admin → returns { user, profile }
 *
 * Call as:
 *   const { user, profile } = await requireAdmin();
 *
 * (Throws via Next's `redirect()` so the call site doesn't need try/catch —
 * the redirect propagates as a render-time exception that Next handles.)
 */
export async function requireAdmin(opts?: { from?: string }): Promise<{
  user: User;
  profile: Profile;
}> {
  const { user, profile } = await getServerUser();

  if (!user) {
    const redirectParam = encodeURIComponent(opts?.from ?? "/admin");
    redirect(`/auth?redirect=${redirectParam}`);
  }

  if (!profile?.is_admin) {
    redirect("/dashboard?error=admin_only");
  }

  return { user, profile };
}
