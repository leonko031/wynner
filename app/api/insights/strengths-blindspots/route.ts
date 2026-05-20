import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { geminiFlashJSON, isGeminiAvailable } from "@/lib/ai/gemini";
import {
  buildStrengthsBlindspotsPrompt,
  type StrengthsBlindspotsContext,
} from "@/lib/ai/prompts/insights-strengths-blindspots";
import {
  compactScanSchema,
  strengthsBlindspotsSchema,
  type StrengthsBlindspotsOutput,
} from "@/types/insights";
import type { Profile } from "@/types/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  scans: z.array(compactScanSchema).max(200),
  scansHash: z.string().min(1),
  overallAvg: z.number(),
  /** YYYY-MM-DD bounds — used to persist a useful period row in cache. */
  periodStart: z.string(),
  periodEnd: z.string(),
  regenerate: z.boolean().optional(),
});

type Payload = {
  strengths: StrengthsBlindspotsOutput["strengths"];
  blindspots: StrengthsBlindspotsOutput["blindspots"];
  cached: boolean;
  fellBack: boolean;
};

const FALLBACK: Payload = {
  strengths: [
    {
      category: "Keep scanning",
      label: "Building data",
      stat: "We need more scans to surface strengths",
      insight:
        "Once you've scored 10+ products, this card will show what you're great at picking.",
    },
  ],
  blindspots: [
    {
      category: "Coverage",
      label: "Try a new niche",
      gap: "Your sample is too thin for blindspot detection",
      insight:
        "Run a couple of scans across niches you haven't tried — the patterns reveal themselves quickly.",
      exploreUrl: "/scan",
    },
  ],
  cached: false,
  fellBack: true,
};

/**
 * POST /api/insights/strengths-blindspots
 *
 * Free for everyone — Gemini Flash. Cached by scansHash so repeated loads
 * within the same scan state don't re-call Gemini.
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
    return NextResponse.json<Payload>(FALLBACK);
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
      .from("strengths_blindspots")
      .select("strengths, blindspots, scans_hash, created_at")
      .eq("user_id", user.id)
      .eq("scans_hash", body.scansHash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cached) {
      const row = cached as { strengths: unknown; blindspots: unknown };
      const parsed = strengthsBlindspotsSchema.safeParse({
        strengths: row.strengths,
        blindspots: row.blindspots,
      });
      if (parsed.success) {
        return NextResponse.json<Payload>({
          strengths: parsed.data.strengths,
          blindspots: parsed.data.blindspots,
          cached: true,
          fellBack: false,
        });
      }
    }
  }

  if (!isGeminiAvailable() || body.scans.length < 3) {
    return NextResponse.json<Payload>(FALLBACK);
  }

  const ctx: StrengthsBlindspotsContext = {
    firstName,
    scans: body.scans,
    overallAvg: body.overallAvg,
  };

  let output: StrengthsBlindspotsOutput;
  let fellBack = false;
  try {
    const raw = await geminiFlashJSON<unknown>(
      buildStrengthsBlindspotsPrompt(ctx),
    );
    const parsed = strengthsBlindspotsSchema.safeParse(raw);
    if (!parsed.success) {
      output = { strengths: FALLBACK.strengths, blindspots: FALLBACK.blindspots };
      fellBack = true;
    } else {
      output = parsed.data;
    }
  } catch {
    output = { strengths: FALLBACK.strengths, blindspots: FALLBACK.blindspots };
    fellBack = true;
  }

  if (!fellBack) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("strengths_blindspots") as any).insert({
      user_id: user.id,
      scans_hash: body.scansHash,
      period_start: body.periodStart,
      period_end: body.periodEnd,
      strengths: output.strengths,
      blindspots: output.blindspots,
    });
  }

  return NextResponse.json<Payload>({
    strengths: output.strengths,
    blindspots: output.blindspots,
    cached: false,
    fellBack,
  });
}
