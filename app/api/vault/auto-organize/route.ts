import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { geminiProJSON, isGeminiAvailable } from "@/lib/ai/gemini";
import {
  buildAutoOrganizePrompt,
  type GeminiProduct,
} from "@/lib/ai/prompts/vault";
import { smartOrganizeOutputSchema, type SmartOrganizeOutput } from "@/types/vault";
import type { Profile } from "@/types/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  products: z.array(z.unknown()).min(3).max(200),
});

const ORGANIZE_COST = 3;

/**
 * POST /api/vault/auto-organize
 *
 * Body: { products: GeminiProduct[] } — caller passes the compressed
 * inventory (products live in localStorage).
 *
 * Charges ✦ 3 credits (free for admins). Calls Gemini Pro. Persists each
 * resulting smart collection to public.collections + its memberships to
 * public.collection_products. Old smart collections are cleared first.
 *
 * Returns the freshly-inserted collections so the client can render them
 * without a re-fetch.
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
      { error: "gemini_unavailable", message: "Auto-organize isn't configured yet." },
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
  const profile = (profileRow as Pick<Profile, "is_admin" | "credit_balance"> | null) ?? null;
  const isAdmin = profile?.is_admin === true;

  if (!isAdmin) {
    const balance = profile?.credit_balance ?? 0;
    if (balance < ORGANIZE_COST) {
      return NextResponse.json(
        { error: "insufficient_credits", needed: ORGANIZE_COST, balance },
        { status: 402 },
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("profiles") as any)
      .update({ credit_balance: balance - ORGANIZE_COST })
      .eq("id", user.id);
  }

  const products = body.products as GeminiProduct[];
  let smart: SmartOrganizeOutput;
  try {
    const raw = await geminiProJSON<unknown>(buildAutoOrganizePrompt(products));
    const parsed = smartOrganizeOutputSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "gemini_invalid",
          message:
            "AI returned an unparseable response. Your credits weren't charged again — try once more.",
        },
        { status: 502 },
      );
    }
    smart = parsed.data;
  } catch (err) {
    return NextResponse.json(
      {
        error: "gemini_failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }

  // Clear existing smart collections for this user so the rail doesn't fill
  // up with stale runs (the client also clears, but server enforces).
  const { data: existing } = await supabase
    .from("collections")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", "smart");
  const existingIds = (existing ?? []).map((r) => (r as { id: string }).id);
  if (existingIds.length > 0) {
    await supabase.from("collections").delete().in("id", existingIds);
  }

  // Insert one collection per group + its membership rows.
  // Skip productIds that don't appear in the inventory the client sent.
  const validIds = new Set(products.map((p) => p.id));
  const created: { id: string; name: string; productIds: string[] }[] = [];

  for (const group of smart.collections) {
    const cleanedIds = group.productIds.filter((id) => validIds.has(id));
    if (cleanedIds.length < 2) continue; // skip thin collections
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: insertErr } = await (supabase.from("collections") as any)
      .insert({
        user_id: user.id,
        name: group.name,
        description: group.description,
        rationale: group.rationale,
        type: "smart",
        color: pickSmartColor(),
      })
      .select()
      .single();
    if (insertErr || !inserted) continue;
    const col = inserted as { id: string; name: string };

    const membershipRows = cleanedIds.map((pid) => ({
      collection_id: col.id,
      product_id: pid,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("collection_products") as any).insert(membershipRows);

    created.push({ id: col.id, name: col.name, productIds: cleanedIds });
  }

  return NextResponse.json({
    ok: true,
    collections: created,
    cost: isAdmin ? 0 : ORGANIZE_COST,
  });
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

let smartColorCursor = 0;
const SMART_COLORS = [
  "aurora_purple",
  "aurora_pink",
  "aurora_blue",
  "aurora_mint",
  "aurora_peach",
] as const;
function pickSmartColor(): (typeof SMART_COLORS)[number] {
  const c = SMART_COLORS[smartColorCursor % SMART_COLORS.length];
  smartColorCursor++;
  return c;
}
