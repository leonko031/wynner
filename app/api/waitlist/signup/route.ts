import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(180),
  referralCode: z.string().max(32).optional(),
  source: z.string().max(64).optional(),
});

/* -------------------------------------------------------------------------- */
/* In-memory rate limit (per-IP, 5/hour)                                       */
/* -------------------------------------------------------------------------- */
/**
 * Lives only in the Node process — multi-instance deploys will see drift
 * but each instance still rejects bursts from the same IP. For tighter
 * guarantees plug in upstash/ratelimit; for a waitlist this is enough.
 */
const RL_MAX = 5;
const RL_WINDOW_MS = 60 * 60 * 1000;
const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
    return false;
  }
  if (bucket.count >= RL_MAX) return true;
  bucket.count += 1;
  return false;
}

/* -------------------------------------------------------------------------- */

type Payload = {
  success: true;
  position: number;
  referralCode: string;
  totalCount: number;
  alreadyOnList: boolean;
};

export async function POST(req: Request) {
  // ── Parse + validate ──────────────────────────────────────────────────────
  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_body",
            message:
              "Please enter a valid email address.",
            details: parsed.error.issues[0]?.message,
          },
        },
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_json", message: "Bad request." } },
      { status: 400 },
    );
  }

  // ── Rate-limit per IP ────────────────────────────────────────────────────
  const ipHeader =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "anon";
  const ip = ipHeader.split(",")[0]?.trim() ?? "anon";
  if (rateLimited(ip)) {
    return NextResponse.json(
      {
        error: {
          code: "rate_limited",
          message: "Whoa — slow down. Try again in an hour.",
        },
      },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "supabase_unavailable",
          message: "Waitlist is offline. Try again later.",
        },
      },
      { status: 503 },
    );
  }

  const email = body.email.trim().toLowerCase();
  const userAgent = req.headers.get("user-agent") ?? null;
  const source = body.source?.slice(0, 64) ?? null;

  const supabase = await createSupabaseServerClient();

  // ── Dedupe: already on the list? ────────────────────────────────────────
  const { data: existing } = await supabase
    .from("waitlist")
    .select("position, referral_code")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    const ex = existing as { position: number; referral_code: string };
    const { count } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true });
    const payload: Payload = {
      success: true,
      position: ex.position,
      referralCode: ex.referral_code,
      totalCount: count ?? 0,
      alreadyOnList: true,
    };
    return NextResponse.json(payload);
  }

  // ── Resolve referrer (if any) ──────────────────────────────────────────
  let referredById: string | null = null;
  if (body.referralCode) {
    const { data: ref } = await supabase
      .from("waitlist")
      .select("id, position, referrals_count")
      .eq("referral_code", body.referralCode.toLowerCase())
      .maybeSingle();
    if (ref) {
      referredById = (ref as { id: string }).id;
    }
  }

  // ── Insert (position auto-assigned by trigger) ─────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insertRes = await (supabase.from("waitlist") as any)
    .insert({
      email,
      referred_by: referredById,
      source,
      ip_address: ip,
      user_agent: userAgent,
    })
    .select("position, referral_code")
    .single();

  if (insertRes.error || !insertRes.data) {
    console.error("[waitlist/signup] insert failed", insertRes.error);
    return NextResponse.json(
      {
        error: {
          code: "insert_failed",
          message: "Couldn't add you to the list. Try again?",
        },
      },
      { status: 500 },
    );
  }

  const { position: newPosition, referral_code: newRefCode } =
    insertRes.data as { position: number; referral_code: string };

  // ── Bump referrer up by 5 (server-side, atomic-ish) ────────────────────
  // RLS allows updates only for admins, so we use the service-role client
  // when configured. Falls back to a no-op if not.
  if (referredById) {
    try {
      const { createSupabaseAdminClient, isSupabaseAdminConfigured } =
        await import("@/lib/supabase/admin");
      if (isSupabaseAdminConfigured()) {
        const admin = createSupabaseAdminClient();
        const { data: refRow } = await admin
          .from("waitlist")
          .select("position, referrals_count")
          .eq("id", referredById)
          .maybeSingle();
        if (refRow) {
          const r = refRow as { position: number; referrals_count: number };
          const newRefPosition = Math.max(1, r.position - 5);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin.from("waitlist") as any)
            .update({
              position: newRefPosition,
              referrals_count: (r.referrals_count ?? 0) + 1,
            })
            .eq("id", referredById);
        }
      }
    } catch (e) {
      // Don't fail the signup — referrer bump is best-effort.
      console.error("[waitlist/signup] referrer bump failed", e);
    }
  }

  // ── Trigger confirmation email (non-blocking) ─────────────────────────
  // Fire-and-forget; never block the user's success response on Resend.
  void (async () => {
    try {
      const origin = new URL(req.url).origin;
      await fetch(`${origin}/api/waitlist/send-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          position: newPosition,
          referralCode: newRefCode,
        }),
      });
    } catch {
      // No-op — email isn't a blocker.
    }
  })();

  // ── Final count for the "live counter" UI ──────────────────────────────
  const { count } = await supabase
    .from("waitlist")
    .select("*", { count: "exact", head: true });

  const payload: Payload = {
    success: true,
    position: newPosition,
    referralCode: newRefCode,
    totalCount: count ?? 0,
    alreadyOnList: false,
  };
  return NextResponse.json(payload);
}
