import { MarketingLanding } from "@/components/marketing/full-landing-page";
import { WaitlistPage } from "@/components/waitlist/waitlist-page";

/**
 * Root `/` page.
 *
 * Two modes, controlled by NEXT_PUBLIC_WAITLIST_MODE:
 *
 *   "true" (default)  → renders the pre-launch waitlist page
 *   "false"           → renders the full marketing landing
 *
 * Both branches are client components — this server component is just a
 * cheap env-gated switch so we don't ship both bundles when only one runs.
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
