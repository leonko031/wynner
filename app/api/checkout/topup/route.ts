import { NextResponse } from "next/server";
import { TOPUP_PACKS } from "@/lib/credits/config";
import {
  STRIPE_TOPUP_PRICE_IDS,
  isStripeConfigured,
} from "@/lib/credits/stripe-config";

export const runtime = "nodejs";

type Body = { packId?: string };

/**
 * POST /api/checkout/topup
 *
 * Creates a Stripe Checkout session for a top-up pack (mode: "payment").
 * Dev-mode fallback returns `{ devGrant: true, packId }` so the client can
 * apply the credits locally without Stripe credentials.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const packId = body.packId;
  const pack = TOPUP_PACKS.find((p) => p.id === packId);

  if (!pack) {
    return NextResponse.json({ error: "invalid pack" }, { status: 400 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ devGrant: true, packId: pack.id });
  }

  const priceId = STRIPE_TOPUP_PRICE_IDS[pack.id];
  if (!priceId) {
    return NextResponse.json(
      { error: `Missing Stripe price for top-up ${pack.id}` },
      { status: 500 },
    );
  }

  // ---- Real Stripe checkout (uncomment after `npm install stripe`) -------
  // import Stripe from "stripe";
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  // const session = await stripe.checkout.sessions.create({
  //   mode: "payment",
  //   line_items: [{ price: priceId, quantity: 1 }],
  //   success_url: `${origin}/credits?checkout=success&topup=${pack.id}`,
  //   cancel_url: `${origin}/pricing?checkout=cancel#topups`,
  //   metadata: { packId: pack.id, kind: "topup" },
  // });
  // return NextResponse.json({ url: session.url });
  // ------------------------------------------------------------------------

  return NextResponse.json({ devGrant: true, packId: pack.id });
}
