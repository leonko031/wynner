import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { geminiFlashJSON, isGeminiAvailable } from "@/lib/ai/gemini";
import {
  buildDailyBriefingPrompt,
  type BriefingContext,
} from "@/lib/ai/prompts/daily-briefing";
import {
  dailyBriefingSchema,
  fallbackBriefing,
  type BriefingRow,
  type DailyBriefing,
} from "@/types/briefing";
import type { Profile } from "@/types/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ResponsePayload = {
  briefing: DailyBriefing;
  cached: boolean;
  fellBack: boolean;
  date: string;
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function firstNameFrom(profile: Profile | null, fallback: string): string {
  const dn = (profile?.display_name ?? "").trim();
  if (!dn) return fallback;
  // Use the first space-separated token.
  return dn.split(/\s+/)[0]!;
}

/**
 * GET  /api/dashboard/briefing            — returns today's briefing (cached or fresh)
 * POST /api/dashboard/briefing            — body { regenerate: true }; deletes today's row + regenerates
 *
 * Costs nothing on a cache hit. A miss calls Gemini Flash once.
 *
 * Falls back gracefully when:
 *   • Supabase isn't configured (returns a templated briefing, no caching)
 *   • Gemini key is missing or call fails / validates wrong
 */
export async function GET(req: Request) {
  return handle(req, { regenerate: false });
}

export async function POST(req: Request) {
  let body: { regenerate?: boolean } = {};
  try {
    body = (await req.json()) as { regenerate?: boolean };
  } catch {
    // ignore — POST with empty body is fine, treated as regenerate intent
  }
  return handle(req, { regenerate: body.regenerate !== false });
}

async function handle(
  _req: Request,
  opts: { regenerate: boolean },
): Promise<NextResponse> {
  const date = todayISO();

  // If Supabase isn't configured we can't load context — render a generic
  // fallback and bail.
  if (!isSupabaseConfigured()) {
    const briefing = fallbackBriefing("there");
    const payload: ResponsePayload = { briefing, cached: false, fellBack: true, date };
    return NextResponse.json(payload);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Load profile (for personalization + display name)
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const profile = (profileRow as Profile | null) ?? null;
  const firstName = firstNameFrom(profile, "there");

  // Cache check — unless regenerate flag is on.
  if (!opts.regenerate) {
    const { data: cachedRow } = await supabase
      .from("daily_briefings")
      .select("paragraphs, chips, date")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle();

    if (cachedRow) {
      const cached = cachedRow as Pick<BriefingRow, "paragraphs" | "chips" | "date">;
      const parsed = dailyBriefingSchema.safeParse({
        paragraphs: cached.paragraphs,
        chips: cached.chips,
      });
      if (parsed.success) {
        const payload: ResponsePayload = {
          briefing: parsed.data,
          cached: true,
          fellBack: false,
          date,
        };
        return NextResponse.json(payload);
      }
      // If a stored row somehow fails validation, fall through and regenerate.
    }
  } else {
    // Regenerating — clear today's row so the insert below succeeds.
    await supabase
      .from("daily_briefings")
      .delete()
      .eq("user_id", user.id)
      .eq("date", date);
  }

  // No usable cache — generate fresh.
  if (!isGeminiAvailable()) {
    const briefing = fallbackBriefing(firstName);
    return NextResponse.json({ briefing, cached: false, fellBack: true, date });
  }

  const ctx = await buildBriefingContext({ user, profile, firstName, supabase });
  const prompt = buildDailyBriefingPrompt(ctx);

  let briefing: DailyBriefing;
  let fellBack = false;
  try {
    const raw = await geminiFlashJSON<unknown>(prompt);
    const parsed = dailyBriefingSchema.safeParse(raw);
    if (!parsed.success) {
      briefing = fallbackBriefing(firstName);
      fellBack = true;
    } else {
      briefing = parsed.data;
    }
  } catch {
    briefing = fallbackBriefing(firstName);
    fellBack = true;
  }

  // Cache it — only when we got real (non-fallback) content, otherwise we'd
  // serve the templated copy all day.
  if (!fellBack) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("daily_briefings") as any).insert({
      user_id: user.id,
      date,
      paragraphs: briefing.paragraphs,
      chips: briefing.chips,
    });
  }

  const payload: ResponsePayload = { briefing, cached: false, fellBack, date };
  return NextResponse.json(payload);
}

/* -------------------------------------------------------------------------- */
/* Context assembly                                                            */
/* -------------------------------------------------------------------------- */

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function buildBriefingContext({
  profile,
  firstName,
}: {
  user: { id: string };
  profile: Profile | null;
  firstName: string;
  supabase: SupabaseClient;
}): Promise<BriefingContext> {
  // We don't (yet) have a `scans` table in Supabase — everyone's scan
  // history lives client-side. So the SERVER-side context is shallow on
  // purpose: profile preferences + a sample of the seed top products for
  // market flavor.
  //
  // If/when scans move to Postgres, we'll join here and the briefings get
  // sharper without changing the prompt.

  const { SEED_PRODUCTS } = await import("@/lib/data/seed");
  const topProducts = [...SEED_PRODUCTS]
    .sort((a, b) => b.sellScore - a.sellScore)
    .slice(0, 6)
    .map((p) => ({
      name: p.name,
      category: p.category,
      targetCountry: p.targetCountry,
      sellScore: p.sellScore,
      verdict: p.verdict,
    }));

  // Naive market vibe — avg of top 50 seed scores into 4 buckets.
  const sample = [...SEED_PRODUCTS]
    .sort((a, b) => b.sellScore - a.sellScore)
    .slice(0, 50);
  const avg = sample.reduce((s, p) => s + p.sellScore, 0) / Math.max(1, sample.length);
  const marketVibe: BriefingContext["marketVibe"] =
    avg >= 78 ? "hot" : avg >= 70 ? "active" : avg >= 60 ? "steady" : "quiet";

  return {
    firstName,
    preferredCountry: profile?.preferred_country ?? null,
    preferredNiches: (profile?.preferred_niches ?? []) as BriefingContext["preferredNiches"],
    experienceLevel: profile?.experience_level ?? null,
    daysSinceLastScan: profile?.last_scan_at
      ? Math.floor(
          (Date.now() - new Date(profile.last_scan_at).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null,
    recentScans: [], // server can't see local-only scan history yet
    topProducts,
    marketVibe,
  };
}
