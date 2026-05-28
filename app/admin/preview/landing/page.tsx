import { MarketingLanding } from "@/components/marketing/full-landing-page";
import { requireAdmin } from "@/lib/auth/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /admin/preview/landing
 *
 * Admin-only preview of the full marketing landing page. Public visitors
 * still only see the waitlist at `/` (gated by NEXT_PUBLIC_WAITLIST_MODE).
 * Signed-in admins can hit this URL to see exactly what the landing will
 * look like when we flip the flag for public launch.
 *
 * requireAdmin() throws via Next's redirect():
 *   - Not signed in → /auth?redirect=/admin/preview/landing
 *   - Signed in, not admin → /dashboard?error=admin_only
 *
 * Renders the same MarketingLanding component the public `/` would render
 * when WAITLIST_MODE=false, so what you see here is a 1:1 preview.
 */
export default async function MarketingLandingPreview() {
  await requireAdmin({ from: "/admin/preview/landing" });
  return <MarketingLanding />;
}
