import { NextResponse } from "next/server";
import { z } from "zod";
import { buildWaitlistConfirmationEmail } from "@/lib/email/waitlist-confirmation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  position: z.number().int().min(1),
  referralCode: z.string().min(1),
});

/**
 * POST /api/waitlist/send-confirmation
 *
 * Internal endpoint called by /api/waitlist/signup. Sends the confirmation
 * email via Resend if RESEND_API_KEY is configured; gracefully no-ops
 * otherwise so the signup flow doesn't depend on email infrastructure.
 *
 * Never returns an error to the caller — failures are logged + swallowed
 * since this is fire-and-forget from the signup path.
 */
export async function POST(req: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, skipped: "invalid_body" }, { status: 200 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ ok: false, skipped: "invalid_json" }, { status: 200 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("[waitlist/send-confirmation] RESEND_API_KEY not set — skipping email");
    return NextResponse.json({ ok: true, skipped: "no_resend_key" });
  }

  const from = process.env.RESEND_FROM ?? "Wynner <onboarding@resend.dev>";
  const origin = new URL(req.url).origin;
  const email = buildWaitlistConfirmationEmail({
    email: body.email,
    position: body.position,
    referralCode: body.referralCode,
    origin,
  });

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const res = await resend.emails.send({
      from,
      to: body.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    if ((res as { error?: unknown }).error) {
      console.error("[waitlist/send-confirmation] resend error", res);
      return NextResponse.json({ ok: false, error: "resend_failed" }, { status: 200 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[waitlist/send-confirmation] exception", e);
    return NextResponse.json({ ok: false, error: "exception" }, { status: 200 });
  }
}
