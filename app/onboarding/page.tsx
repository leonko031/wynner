import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server-user";
import { OnboardingWizard } from "./onboarding-wizard";

/**
 * /onboarding — 3-step wizard new users see right after their first sign-in.
 *
 * If they've already completed it (or aren't signed in but Supabase is
 * configured), we redirect to /dashboard. When Supabase isn't configured at
 * all we still render so designers can preview the flow.
 */
export default async function OnboardingPage() {
  const { user, profile, configured } = await getServerUser();
  if (configured) {
    if (!user) redirect("/auth?redirect=/onboarding");
    if (profile?.onboarding_completed) redirect("/dashboard");
  }
  return <OnboardingWizard />;
}
