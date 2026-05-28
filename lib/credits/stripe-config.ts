/**
 * Stripe price ID configuration.
 *
 * Real Stripe integration requires:
 *   1. `npm install stripe @stripe/stripe-js`
 *   2. Create the prices below in your Stripe dashboard
 *   3. Set the env vars (one per price + the secret/publishable/webhook keys)
 *
 * When STRIPE_SECRET_KEY is unset (dev / personal-use mode), the checkout
 * routes fall back to "dev grant" — credits are added directly via the client
 * with a friendly toast, so the full UX is testable without Stripe.
 */

import type { BillingInterval, PlanTier } from "@/types/credits";

export const STRIPE_PRICE_IDS: Record<PlanTier, Record<BillingInterval, string | undefined>> = {
  starter: { monthly: undefined, yearly: undefined }, // free
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  operator: {
    monthly: process.env.STRIPE_PRICE_OPERATOR_MONTHLY,
    yearly: process.env.STRIPE_PRICE_OPERATOR_YEARLY,
  },
  agency: {
    monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY,
    yearly: process.env.STRIPE_PRICE_AGENCY_YEARLY,
  },
};

export const STRIPE_TOPUP_PRICE_IDS: Record<string, string | undefined> = {
  small: process.env.STRIPE_PRICE_TOPUP_SMALL,
  medium: process.env.STRIPE_PRICE_TOPUP_MEDIUM,
  large: process.env.STRIPE_PRICE_TOPUP_LARGE,
  mega: process.env.STRIPE_PRICE_TOPUP_MEGA,
};

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
