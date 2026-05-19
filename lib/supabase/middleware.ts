import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "./env";

/**
 * Routes that require authentication. Anything under these prefixes triggers
 * a redirect to /auth?redirect=<originalPath> for unauthenticated visitors.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/product",
  "/scan",
  "/vault",
  "/compare",
  "/credits",
  "/settings",
  "/insights",
];

/** Subset of PROTECTED_PREFIXES that ALSO require admin status. */
const ADMIN_PREFIXES = ["/admin"];

/** Routes auth'd users shouldn't see (we bounce them home). */
const AUTH_ONLY_PREFIXES = ["/auth"];
/** ...with these /auth sub-paths excluded (callback, verify, reset). */
const AUTH_PASS_THROUGH = [
  "/auth/callback",
  "/auth/verify",
  "/auth/reset",
  "/auth/reset/confirm",
];

function isProtected(pathname: string): boolean {
  return (
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthOnly(pathname: string): boolean {
  if (AUTH_PASS_THROUGH.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  return AUTH_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refreshes the Supabase session cookie on every request, then enforces the
 * route-access rules above. Must run in middleware (not a layout) because the
 * cookie write needs the NextResponse.
 *
 * If Supabase env vars aren't set, this is a no-op so the app still works
 * in "demo mode".
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    // Demo mode — no auth enforcement.
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touch the session so the cookie gets refreshed if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protected route + no session → redirect to /auth, remember where they were
  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Admin route + signed-in non-admin → bounce to /dashboard with a flash.
  // We check is_admin from profiles. The dashboard reads ?error=admin_only
  // and surfaces a friendly toast.
  if (user && isAdminRoute(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    const isAdmin = (profile as { is_admin?: boolean } | null)?.is_admin === true;
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      url.searchParams.set("error", "admin_only");
      return NextResponse.redirect(url);
    }
  }

  // Authenticated + visiting an auth page → bounce to /dashboard
  if (user && isAuthOnly(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
