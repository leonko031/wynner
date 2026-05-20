import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isGeminiAvailable, geminiProJSON } from "@/lib/ai/gemini";
import {
  buildJudgeVerdictPrompt,
  type CompactProduct,
} from "@/lib/ai/prompts/judge-verdict";
import {
  judgeVerdictSchema,
  type JudgeVerdict,
} from "@/types/compare";
import type { Profile } from "@/types/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERDICT_COST = 3;
const REGENERATE_COST = 3;

const compactProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  niche: z.string(),
  country: z.string(),
  countryName: z.string(),
  cost: z.number(),
  price: z.number(),
  marginUsd: z.number(),
  markup: z.number(),
  score: z.number(),
  verdict: z.string(),
  pillars: z.object({
    margin: z.number(),
    marketFit: z.number(),
    demand: z.number(),
    competition: z.number(),
    creative: z.number(),
  }),
  topAngle: z.string(),
  redFlags: z.array(z.string()),
});

const bodySchema = z.object({
  products: z.array(compactProductSchema).min(2).max(4),
  /** Deterministic hash of (sorted productId:score) pairs — drives cache invalidation. */
  scoresHash: z.string().min(1),
  /** When true, ignore cache and call Gemini again. Charges credits. */
  regenerate: z.boolean().optional(),
});

type Payload = {
  verdict: JudgeVerdict;
  cached: boolean;
  cost: number;
};

/**
 * POST /api/compare/verdict
 *
 * Hand-rolled cache lookup: keyed by (user_id, productIds set, scoresHash).
 * Re-scoring any participant changes the hash → cache miss → fresh Gemini Pro
 * call. Costs ✦ 3 per generation (free for admins). On Gemini error we
 * automatically refund.
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

  if (!isGeminiAvailable()) {
    return NextResponse.json(
      { error: "gemini_unavailable", message: "Verdict generation isn't configured yet." },
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
    .select("is_admin, credit_balance")
    .eq("id", user.id)
    .maybeSingle();
  const profile =
    (profileRow as Pick<Profile, "is_admin" | "credit_balance"> | null) ?? null;
  const isAdmin = profile?.is_admin === true;

  const productIds = body.products.map((p) => p.id);
  const sortedIds = [...productIds].sort();

  // -------------------- Cache lookup ----------------------------------------
  if (!body.regenerate) {
    const { data: cached } = await supabase
      .from("comparison_verdicts")
      .select("*")
      .eq("user_id", user.id)
      .eq("scores_hash", body.scoresHash)
      .order("created_at", { ascending: false });
    type CachedRow = {
      product_ids: string[];
      winner_product_id: string;
      declaration: string;
      why_bullets: string[];
      tradeoff_bullets: string[];
      recommendation: string;
      confidence_level: "low" | "medium" | "high";
    };
    const rows = (cached ?? []) as CachedRow[];
    const hit = rows.find((row) => {
      // Compare as sets — order independence.
      if (!Array.isArray(row.product_ids) || row.product_ids.length !== sortedIds.length) {
        return false;
      }
      const a = [...row.product_ids].sort();
      return a.every((x, i) => x === sortedIds[i]);
    });
    if (hit) {
      const cachedVerdict: JudgeVerdict = {
        winnerProductId: hit.winner_product_id,
        declaration: hit.declaration,
        whyBullets: hit.why_bullets,
        tradeoffBullets: hit.tradeoff_bullets,
        recommendation: hit.recommendation,
        confidenceLevel: hit.confidence_level,
      };
      const payload: Payload = { verdict: cachedVerdict, cached: true, cost: 0 };
      return NextResponse.json(payload);
    }
  }

  // -------------------- Charge credits up front ----------------------------
  if (!isAdmin) {
    const cost = body.regenerate ? REGENERATE_COST : VERDICT_COST;
    const balance = profile?.credit_balance ?? 0;
    if (balance < cost) {
      return NextResponse.json(
        { error: "insufficient_credits", needed: cost, balance },
        { status: 402 },
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("profiles") as any)
      .update({ credit_balance: balance - cost })
      .eq("id", user.id);
  }

  // -------------------- Call Gemini ---------------------------------------
  const prompt = buildJudgeVerdictPrompt(body.products as CompactProduct[]);
  let verdict: JudgeVerdict;
  try {
    const raw = await geminiProJSON<unknown>(prompt);
    const parsed = judgeVerdictSchema.safeParse(raw);
    if (!parsed.success) {
      // Refund on validation failure — the user shouldn't pay for garbage.
      await refund(supabase, user.id, isAdmin, body.regenerate ? REGENERATE_COST : VERDICT_COST);
      return NextResponse.json(
        {
          error: "gemini_invalid",
          message:
            "The judge returned an unparseable verdict. We refunded your credits — try again in a moment.",
        },
        { status: 502 },
      );
    }
    verdict = parsed.data;

    // Validate the winner ID was one of the inputs (Gemini can still
    // hallucinate even with strict instructions).
    if (!productIds.includes(verdict.winnerProductId)) {
      await refund(supabase, user.id, isAdmin, body.regenerate ? REGENERATE_COST : VERDICT_COST);
      return NextResponse.json(
        {
          error: "gemini_invalid",
          message:
            "The judge picked a winner that wasn't in this comparison. Your credits were refunded — try again.",
        },
        { status: 502 },
      );
    }
  } catch (err) {
    await refund(supabase, user.id, isAdmin, body.regenerate ? REGENERATE_COST : VERDICT_COST);
    return NextResponse.json(
      {
        error: "gemini_failed",
        message: err instanceof Error ? err.message : "Verdict generation failed",
      },
      { status: 500 },
    );
  }

  // -------------------- Persist + return -----------------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("comparison_verdicts") as any).insert({
    user_id: user.id,
    product_ids: productIds,
    scores_hash: body.scoresHash,
    winner_product_id: verdict.winnerProductId,
    declaration: verdict.declaration,
    why_bullets: verdict.whyBullets,
    tradeoff_bullets: verdict.tradeoffBullets,
    recommendation: verdict.recommendation,
    confidence_level: verdict.confidenceLevel,
  });

  const payload: Payload = {
    verdict,
    cached: false,
    cost: isAdmin ? 0 : body.regenerate ? REGENERATE_COST : VERDICT_COST,
  };
  return NextResponse.json(payload);
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
