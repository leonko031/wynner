import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { geminiFlashJSON, isGeminiAvailable } from "@/lib/ai/gemini";
import {
  buildProfileTagsPrompt,
  type ProfileTagsContext,
} from "@/lib/ai/prompts/insights-profile-tags";
import {
  compactScanSchema,
  profileTagsSchema,
  tierFromLevel,
  LEVEL_TIERS,
  type ProfileTagsOutput,
} from "@/types/insights";
import type { Profile } from "@/types/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  scans: z.array(compactScanSchema).max(120),
  scansHash: z.string().min(1),
  totalScans: z.number().int().min(0),
  avgScore: z.number(),
  winRate: z.number(),
  operatorLevel: z.number().int().min(0).max(100),
  regenerate: z.boolean().optional(),
});

type Payload = {
  tags: ProfileTagsOutput["tags"];
  cached: boolean;
  fellBack: boolean;
};

const FALLBACK_TAGS: ProfileTagsOutput["tags"] = [
  { kind: "niche", label: "Multi-niche scout", emoji: "🧭" },
  { kind: "country", label: "Multi-market", emoji: "🌍" },
  { kind: "pickiness", label: "Balanced caller", emoji: "⚖️" },
  { kind: "pace", label: "Weekly researcher", emoji: "📅" },
];

/**
 * POST /api/insights/profile-tags
 *
 * Free for everyone — Gemini Flash is cheap and we want the hero card to
 * feel personal on every visit. Cached by scansHash so repeated loads
 * don't re-call Gemini.
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

  // Supabase not configured → return fallback tags so the UI still renders.
  if (!isSupabaseConfigured()) {
    return NextResponse.json<Payload>({
      tags: FALLBACK_TAGS,
      cached: false,
      fellBack: true,
    });
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
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const profile = (profileRow as Pick<Profile, "display_name"> | null) ?? null;
  const firstName =
    (profile?.display_name ?? user.email?.split("@")[0] ?? "there")
      .trim()
      .split(/\s+/)[0] ?? "there";

  // -------------------- Cache lookup ----------------------------------------
  if (!body.regenerate) {
    const { data: cached } = await supabase
      .from("operator_profile_tags")
      .select("tags, scans_hash, created_at")
      .eq("user_id", user.id)
      .eq("scans_hash", body.scansHash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cached) {
      const row = cached as { tags: unknown };
      const parsed = profileTagsSchema.safeParse({ tags: row.tags });
      if (parsed.success) {
        return NextResponse.json<Payload>({
          tags: parsed.data.tags,
          cached: true,
          fellBack: false,
        });
      }
    }
  }

  // -------------------- Call Gemini (fallback on any failure) --------------
  if (!isGeminiAvailable() || body.scans.length === 0) {
    return NextResponse.json<Payload>({
      tags: FALLBACK_TAGS,
      cached: false,
      fellBack: true,
    });
  }

  const ctx: ProfileTagsContext = {
    firstName,
    scans: body.scans,
    totalScans: body.totalScans,
    avgScore: body.avgScore,
    winRate: body.winRate,
  };
  let tags: ProfileTagsOutput["tags"];
  let fellBack = false;
  try {
    const raw = await geminiFlashJSON<unknown>(buildProfileTagsPrompt(ctx));
    const parsed = profileTagsSchema.safeParse(raw);
    if (!parsed.success) {
      tags = FALLBACK_TAGS;
      fellBack = true;
    } else {
      tags = parsed.data.tags;
    }
  } catch {
    tags = FALLBACK_TAGS;
    fellBack = true;
  }

  // Persist only successful generations. If user already has a row for this
  // scans_hash (cache miss earlier means none), insert; otherwise leave alone.
  if (!fellBack) {
    const levelTier = tierFromLevel(body.operatorLevel);
    if (LEVEL_TIERS.includes(levelTier)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("operator_profile_tags") as any).insert({
        user_id: user.id,
        scans_hash: body.scansHash,
        tags,
        operator_level: body.operatorLevel,
        level_tier: levelTier,
      });
    }
  }

  return NextResponse.json<Payload>({ tags, cached: false, fellBack });
}
