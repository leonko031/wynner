import { MarketingLanding } from "@/components/marketing/full-landing-page";
import { WaitlistPage } from "@/components/waitlist/waitlist-page";

/**
 * Root `/` page.
 *
 * Two modes, controlled by NEXT_PUBLIC_WAITLIST_MODE:
 *
 *   "true" (default)  → renders the pre-launch waitlist page (current public face)
 *   "false"           → renders the full marketing landing (flip when ready)
 *
 * Public visitors only see the waitlist while WAITLIST_MODE=true. To preview
 * the marketing landing as an operator without flipping the public default,
 * sign in as admin and visit /admin/preview/landing.
 *
 * Note on NEXT_PUBLIC_*: this env var is inlined at build time. Flipping
 * the value in Vercel without redeploying won't change which page renders.
 * Trigger a redeploy after toggling.
 */
export default function RootPage() {
  const mode = process.env.NEXT_PUBLIC_WAITLIST_MODE ?? "true";
  if (mode.toLowerCase() === "false") {
    return <MarketingLanding />;
  }
  return <WaitlistPage />;
}
