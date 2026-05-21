import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { geminiFlashJSON, isGeminiAvailable } from "@/lib/ai/gemini";
import {
  buildStrategicBriefPrompt,
  type StrategicBriefContext,
} from "@/lib/ai/prompts/strategic-brief";
import {
  compactScanSchema,
  strategicBriefSchema,
  type StrategicBrief,
} from "@/types/insights";
import type { Profile } from "@/types/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Brief runs on Gemini Flash now (was Pro). Pro added depth but doubled
// latency and cost — Flash gives the user a usable brief in ~2-3 seconds at
// 1/5 the credit price.
const BRIEF_COST = 1;

const bodySchema = z.object({
  scans: z.array(compactScanSchema).max(120),
  scansHash: z.string().min(1),
  periodLabel: z.string().min(1).max(40),
  periodStart: z.string(),
  periodEnd: z.string(),
  operatorLevel: z.number().int().min(0).max(100),
  operatorTier: z.string().min(1),
  favoritesCount: z.number().int().min(0),
  comparisonsCount: z.number().int().min(0),
  regenerate: z.boolean().optional(),
  /**
   * Read-only mode. When true, return the cached brief if one exists, or 204
   * with { cached: false, brief: null } if not. Never spends credits, never
   * calls Gemini. This is what the page uses on initial mount so /insights
   * stays free to open.
   */
  cacheOnly: z.boolean().optional(),
});

type Payload = {
  brief: StrategicBrief;
  cached: boolean;
  cost: number;
  briefId: string | null;
};

/**
 * POST /api/insights/brief
 *
 * Costs ✦ 5 (free for admins). Cached per (user, scansHash, period). Stored
 * in `strategic_briefs` so the user can browse past briefs.
 *
 * On Gemini failure or invalid schema → automatic refund.
 */
export async function POST(req: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "supabase_unavailable" },
      { status: 503 },
    );
  }
  if (!isGeminiAvailable()) {
    return NextResponse.json(
      {
        error: "gemini_unavailable",
        message: "Strategic briefs aren't configured yet.",
      },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("is_admin, credit_balance, display_name")
    .eq("id", user.id)
    .maybeSingle();
  const profile =
    (profileRow as Pick<
      Profile,
      "is_admin" | "credit_balance" | "display_name"
    > | null) ?? null;
  const isAdmin = profile?.is_admin === true;
  const firstName =
    (profile?.display_name ?? user.email?.split("@")[0] ?? "there")
      .trim()
      .split(/\s+/)[0] ?? "there";

  // -------------------- Cache lookup ----------------------------------------
  if (!body.regenerate) {
    const { data: cached } = await supabase
      .from("strategic_briefs")
      .select(
        "id, portrait, whats_working, needs_attention, hypothesis, plan, period_start, period_end, scans_hash",
      )
      .eq("user_id", user.id)
      .eq("scans_hash", body.scansHash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cached) {
      const row = cached as {
        id: string;
        portrait: string;
        whats_working: unknown;
        needs_attention: unknown;
        hypothesis: string;
        plan: unknown;
      };
      const parsed = strategicBriefSchema.safeParse({
        portrait: row.portrait,
        whatsWorking: row.whats_working,
        needsAttention: row.needs_attention,
        hypothesis: row.hypothesis,
        planForNextMonth: row.plan,
      });
      if (parsed.success) {
        return NextResponse.json<Payload>({
          brief: parsed.data,
          cached: true,
          cost: 0,
          briefId: row.id,
        });
      }
    }
    // Cache miss + cacheOnly request → bail without charging.
    if (body.cacheOnly) {
      return NextResponse.json(
        { brief: null, cached: false, cost: 0, briefId: null },
        { status: 200 },
      );
    }
  }

  // -------------------- Charge credits up front -----------------------------
  if (!isAdmin) {
    const balance = profile?.credit_balance ?? 0;
    if (balance < BRIEF_COST) {
      return NextResponse.json(
        { error: "insufficient_credits", needed: BRIEF_COST, balance },
        { status: 402 },
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("profiles") as any)
      .update({ credit_balance: balance - BRIEF_COST })
      .eq("id", user.id);
  }

  // -------------------- Call Gemini Pro -------------------------------------
  const ctx: StrategicBriefContext = {
    firstName,
    scans: body.scans,
    periodLabel: body.periodLabel,
    periodStart: body.periodStart,
    periodEnd: body.periodEnd,
    operatorLevel: body.operatorLevel,
    operatorTier: body.operatorTier,
    favoritesCount: body.favoritesCount,
    comparisonsCount: body.comparisonsCount,
  };

  let brief: StrategicBrief;
  try {
    const raw = await geminiFlashJSON<unknown>(buildStrategicBriefPrompt(ctx));
    const parsed = strategicBriefSchema.safeParse(raw);
    if (!parsed.success) {
      await refund(supabase, user.id, isAdmin, BRIEF_COST);
      return NextResponse.json(
        {
          error: "gemini_invalid",
          message:
            "The brief came back unparseable. We refunded your credits — try again in a moment.",
        },
        { status: 502 },
      );
    }
    brief = parsed.data;
  } catch (err) {
    await refund(supabase, user.id, isAdmin, BRIEF_COST);
    return NextResponse.json(
      {
        error: "gemini_failed",
        message: err instanceof Error ? err.message : "Brief generation failed",
      },
      { status: 500 },
    );
  }

  // -------------------- Persist + return ------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted } = await (supabase.from("strategic_briefs") as any)
    .insert({
      user_id: user.id,
      period_start: body.periodStart,
      period_end: body.periodEnd,
      scans_hash: body.scansHash,
      portrait: brief.portrait,
      whats_working: brief.whatsWorking,
      needs_attention: brief.needsAttention,
      hypothesis: brief.hypothesis,
      plan: brief.planForNextMonth,
    })
    .select("id")
    .single();
  const briefId = (inserted as { id?: string } | null)?.id ?? null;

  return NextResponse.json<Payload>({
    brief,
    cached: false,
    cost: isAdmin ? 0 : BRIEF_COST,
    briefId,
  });
}

/* -------------------------------------------------------------------------- */
/* GET — list saved briefs (for the history browser)                          */
/* -------------------------------------------------------------------------- */

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ briefs: [] });
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data } = await supabase
    .from("strategic_briefs")
    .select(
      "id, period_start, period_end, saved_label, created_at, portrait, whats_working, needs_attention, hypothesis, plan",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);
  return NextResponse.json({ briefs: data ?? [] });
}

/* -------------------------------------------------------------------------- */

async function refund(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  isAdmin: boolean,
  amount: number,
): Promise<void> {
  if (isAdmin) return;
  const { data: row } = await supabase
    .from("profiles")
    .select("credit_balance")
    .eq("id", userId)
    .maybeSingle();
  const balance = (row as { credit_balance?: number } | null)?.credit_balance ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("profiles") as any)
    .update({ credit_balance: balance + amount })
    .eq("id", userId);
}
