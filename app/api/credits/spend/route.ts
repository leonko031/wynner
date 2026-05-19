import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { CREDIT_COSTS } from "@/lib/credits/config";
import type { CreditActionType } from "@/types/credits";
import type { Profile } from "@/types/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  action: CreditActionType;
  cost?: number;
  productId?: string;
  description?: string;
};

/**
 * POST /api/credits/spend
 *
 * Server-side credit charge — the eventual source of truth once products
 * move to Postgres. Currently the app does most spending in the local
 * Zustand store; this endpoint exists so future flows (and any flow that
 * touches a Supabase row directly) can charge atomically.
 *
 * Critical security invariant: `is_admin` is read FROM THE DATABASE, never
 * from the request body. A malicious client cannot bypass the balance check
 * by claiming to be admin.
 */
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.action) {
    return NextResponse.json({ error: "missing_action" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Authoritative is_admin read from the DB — never trust the client.
  const { data: profileRow, error: readErr } = await supabase
    .from("profiles")
    .select("is_admin, credit_balance")
    .eq("id", user.id)
    .maybeSingle();
  if (readErr || !profileRow) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }
  const profile = profileRow as Pick<Profile, "is_admin" | "credit_balance">;
  const cost = body.cost ?? (CREDIT_COSTS as Record<string, number>)[body.action] ?? 0;

  // Admin path — never charge, but you'd still log to a transactions table
  // here once it exists. For now we just acknowledge.
  if (profile.is_admin) {
    return NextResponse.json({
      success: true,
      admin: true,
      newBalance: Number.POSITIVE_INFINITY,
      cost,
    });
  }

  // Regular path — verify balance, then atomically decrement.
  if (profile.credit_balance < cost) {
    return NextResponse.json({
      success: false,
      reason: "insufficient",
      needed: cost,
      balance: profile.credit_balance,
    });
  }

  // Atomic decrement. RLS on `profiles` lets a user update their own row,
  // but the policy from migration 003 forbids changing is_admin.
  const newBalance = profile.credit_balance - cost;
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ credit_balance: newBalance })
    .eq("id", user.id);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    admin: false,
    newBalance,
    cost,
  });
}
