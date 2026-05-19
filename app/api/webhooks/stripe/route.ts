import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/credits/stripe-config";

// Stripe webhooks need the raw request body for signature verification — using
// Node runtime gives us access to `req.text()` cleanly.
export const runtime = "nodejs";

/**
 * POST /api/webhooks/stripe
 *
 * Stripe → server notification. Verifies the signature, then on
 * `checkout.session.completed` looks up the user from session.metadata and
 * grants credits / activates a subscription.
 *
 * In dev-mode this is a no-op stub. The full implementation is documented
 * below and ready to uncomment once you `npm install stripe` and set the
 * required env vars.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    // Dev: just acknowledge so external "test webhook" tools don't error
    return NextResponse.json({ received: true, devMode: true });
  }

  // ---- Real Stripe webhook (uncomment after `npm install stripe`) --------
  // import Stripe from "stripe";
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const signature = req.headers.get("stripe-signature") ?? "";
  // const payload = await req.text();
  //
  // let event: Stripe.Event;
  // try {
  //   event = stripe.webhooks.constructEvent(
  //     payload,
  //     signature,
  //     process.env.STRIPE_WEBHOOK_SECRET!,
  //   );
  // } catch (err) {
  //   return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  // }
  //
  // if (event.type === "checkout.session.completed") {
  //   const session = event.data.object as Stripe.Checkout.Session;
  //   const meta = session.metadata ?? {};
  //   // TODO: look up the user from session.client_reference_id or
  //   // session.customer and grant credits via your DB layer.
  //   //   if (meta.kind === "subscription") { ... grant monthly credits ... }
  //   //   if (meta.kind === "topup")        { ... add the pack's credits ... }
  // }
  //
  // return NextResponse.json({ received: true });
  // ------------------------------------------------------------------------

  // Stub response for now
  return NextResponse.json({ received: true });
}
