import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { geminiFlashJSON, isGeminiAvailable } from "@/lib/ai/gemini";
import {
  buildSemanticSearchPrompt,
  type GeminiProduct,
} from "@/lib/ai/prompts/vault";
import { semanticSearchOutputSchema } from "@/types/vault";
import type { Profile } from "@/types/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  query: z.string().min(1).max(400),
  mode: z.enum(["text", "semantic"]),
  /** Compressed product list the client sends. Products live in localStorage. */
  products: z.array(z.unknown()).max(200),
});

const SEMANTIC_COST = 1;

/**
 * POST /api/vault/search
 *
 * Two modes:
 *   • text       — server doesn't run anything; we return immediately and
 *                  the client filters locally. Kept here for API symmetry.
 *   • semantic   — calls Gemini Flash with the compressed product list.
 *                  Costs ✦ 1 credit (free for admins).
 *
 * Returns: { mode, matches, interpretation?, cost } — matches are productIds.
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

  if (body.mode === "text") {
    // No-op server-side path. The vault page filters locally for text mode.
    return NextResponse.json({ mode: "text", matches: [], cost: 0 });
  }

  // Semantic — needs Gemini + a credit spend.
  if (!isGeminiAvailable()) {
    return NextResponse.json(
      { error: "gemini_unavailable", message: "AI search isn't configured yet." },
      { status: 503 },
    );
  }

  // Auth + admin check
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
  const profile = (profileRow as Pick<Profile, "is_admin" | "credit_balance"> | null) ?? null;
  const isAdmin = profile?.is_admin === true;

  if (!isAdmin) {
    const balance = profile?.credit_balance ?? 0;
    if (balance < SEMANTIC_COST) {
      return NextResponse.json(
        {
          error: "insufficient_credits",
          needed: SEMANTIC_COST,
          balance,
        },
        { status: 402 },
      );
    }
    // Deduct via direct update (RLS allows users to update their own row).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("profiles") as any)
      .update({ credit_balance: balance - SEMANTIC_COST })
      .eq("id", user.id);
  }

  const products = body.products as GeminiProduct[];
  const prompt = buildSemanticSearchPrompt(body.query, products);

  try {
    const raw = await geminiFlashJSON<unknown>(prompt);
    const parsed = semanticSearchOutputSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({
        mode: "semantic",
        matches: [],
        interpretation: "I couldn't parse a clean result — try rephrasing the question.",
        cost: isAdmin ? 0 : SEMANTIC_COST,
        fellBack: true,
      });
    }
    return NextResponse.json({
      mode: "semantic",
      matches: parsed.data.matches,
      interpretation: parsed.data.interpretation,
      cost: isAdmin ? 0 : SEMANTIC_COST,
      fellBack: false,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "gemini_failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
