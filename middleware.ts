import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

/**
 * Match every request except Next internals, static assets, and the OG image.
 * Auth + redirects are decided per-path inside updateSession().
 */
export const config = {
  matcher: [
    /*
     * Skip:
     *   _next/static — bundled static files
     *   _next/image  — image optimisation requests
     *   favicon.ico  — browser-served
     *   /api/        — handled directly (Supabase routes do their own auth)
     *   common static file extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
