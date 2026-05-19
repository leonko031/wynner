import { NextResponse } from "next/server";
import { extractCustomerVoice, VoiceError } from "@/lib/scrapers/reddit/extract-voice";
import { getCountry } from "@/lib/data/countries";
import { NICHE_KEYS, type Niche } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60; // up to 60s for voice mining

type Body = {
  product: {
    name: string;
    description: string;
    category: string;
  };
  countryCode: string;
};

function validate(body: Body): string | null {
  if (!body?.product?.name?.trim()) return "product.name required";
  if (!(NICHE_KEYS as readonly string[]).includes(body.product.category))
    return "product.category invalid";
  if (!getCountry(body.countryCode)) return "countryCode invalid";
  return null;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ error: "invalid json" }, { status: 400 });
  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const country = getCountry(body.countryCode)!;
  try {
    const voice = await extractCustomerVoice({
      product: {
        name: body.product.name,
        description: body.product.description ?? "",
        category: body.product.category as Niche,
      },
      country,
    });
    return NextResponse.json(voice);
  } catch (e) {
    if (e instanceof VoiceError) {
      const status =
        e.code === "reddit_not_configured" || e.code === "ai_not_configured"
          ? 503
          : e.code === "no_results"
            ? 404
            : 500;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown error", code: "extract_failed" },
      { status: 500 },
    );
  }
}
