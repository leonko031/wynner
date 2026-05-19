import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { syncAdminFlag } from "@/lib/auth/admin";
import type { Profile } from "@/types/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /auth/callback?code=...&redirect=...
 *
 * Entry point for:
 *   • OAuth (Google) — Supabase redirects here with `code`
 *   • Email confirmation — the link in the welcome email
 *   • Magic link sign-in
 *
 * Exchanges the code for a session, then routes the user to:
 *   • /onboarding         if their profile.onboarding_completed === false
 *   • the `redirect` query param if provided
 *   • /dashboard otherwise
 *
 * Errors gracefully redirect to /auth?error=oauth_failed so the form picks
 * up the toast on next load.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedRedirect = url.searchParams.get("redirect");

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/auth?error=oauth_failed", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth?error=oauth_failed", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL("/auth?error=oauth_failed", request.url));
  }

  // Decide where to send the user. New profiles get the onboarding wizard;
  // returning users land where they were trying to go.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    // Reconcile admin flag for this user — covers Google OAuth, magic link,
    // and email-confirmation sign-ins. Idempotent + cheap.
    await syncAdminFlag(user.id, user.email);

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();
    const typed = profile as Pick<Profile, "onboarding_completed"> | null;
    if (typed && !typed.onboarding_completed) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  const target = requestedRedirect && requestedRedirect.startsWith("/") ? requestedRedirect : "/dashboard";
  return NextResponse.redirect(new URL(target, request.url));
}
