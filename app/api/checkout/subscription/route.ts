import { NextResponse } from "next/server";
import { PLANS } from "@/lib/credits/config";
import {
  STRIPE_PRICE_IDS,
  isStripeConfigured,
} from "@/lib/credits/stripe-config";
import type { BillingInterval, PlanTier } from "@/types/credits";

// Node runtime — Stripe SDK is Node-only; also matches the convention used
// elsewhere in this app for routes that might call out to third parties.
export const runtime = "nodejs";

type Body = { plan?: PlanTier; interval?: BillingInterval };

/**
 * POST /api/checkout/subscription
 *
 * Creates a Stripe Checkout session for the requested plan + interval.
 * When STRIPE_SECRET_KEY is unset, returns `{ devGrant: true }` and the client
 * applies the upgrade locally — keeps the demo loop tight without requiring
 * Stripe keys.
 *
 * To enable real Stripe:
 *   1. npm install stripe
 *   2. Set STRIPE_SECRET_KEY in .env.local
 *   3. Set STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_YEARLY,
 *      STRIPE_PRICE_OPERATOR_MONTHLY, STRIPE_PRICE_OPERATOR_YEARLY
 *   4. Set NEXT_PUBLIC_APP_URL for redirects
 *   5. Uncomment the Stripe block below.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const plan = body.plan;
  const interval = body.interval ?? "monthly";

  if (!plan || !(plan in PLANS)) {
    return NextResponse.json({ error: "invalid plan" }, { status: 400 });
  }
  if (PLANS[plan].priceMonthly === 0) {
    return NextResponse.json({ error: "free plan does not require checkout" }, { status: 400 });
  }

  // Dev/personal-use mode — no Stripe configured. Tell the client to grant locally.
  if (!isStripeConfigured()) {
    return NextResponse.json({ devGrant: true, plan });
  }

  const priceId = STRIPE_PRICE_IDS[plan][interval];
  if (!priceId) {
    return NextResponse.json(
      { error: `Missing Stripe price for ${plan}/${interval}` },
      { status: 500 },
    );
  }

  // ---- Real Stripe checkout (uncomment after `npm install stripe`) -------
  // import Stripe from "stripe";
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  // const session = await stripe.checkout.sessions.create({
  //   mode: "subscription",
  //   line_items: [{ price: priceId, quantity: 1 }],
  //   success_url: `${origin}/credits?checkout=success&plan=${plan}`,
  //   cancel_url: `${origin}/pricing?checkout=cancel`,
  //   metadata: { plan, interval, kind: "subscription" },
  //   allow_promotion_codes: true,
  // });
  // return NextResponse.json({ url: session.url });
  // ------------------------------------------------------------------------

  // Until the Stripe block is uncommented, behave like dev mode even if keys exist.
  return NextResponse.json({ devGrant: true, plan });
}
