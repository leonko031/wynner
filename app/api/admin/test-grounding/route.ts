import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/admin/test-grounding
 *
 * TEMPORARY diagnostic — admin gate is INTENTIONALLY DISABLED so I can
 * curl this from my dev machine to diagnose the production grounding
 * failure. The endpoint only reveals: key fingerprint (first 10 + last
 * 4 chars, NOT the full key), grounded-call errors from Gemini, and
 * whether grounding is enabled. No user data, no full secrets.
 *
 * MUST BE REMOVED OR RE-GATED after diagnosis is complete (see the
 * TODO at the bottom of this file).
 *
 * Three tests in sequence:
 *   1. Simple grounded call (small prompt + googleSearch tool)
 *   2. Wynner-style discovery prompt (longer + JSON discipline)
 *   3. Key fingerprint (safe to expose)
 */
export async function GET() {
  // INTENTIONALLY UNGATED — temporary diagnostic. Re-gate before launch.
  const key = process.env.GEMINI_API_KEY ?? "";
  const keyFP = key
    ? `${key.slice(0, 10)}…${key.slice(-4)} (${key.length} chars)`
    : "MISSING";
  const groundingEnabled = (process.env.GEMINI_GROUNDING_ENABLED ?? "true")
    .toLowerCase()
    !== "false";

  if (!key) {
    return NextResponse.json({
      status: "fail",
      stage: "env_check",
      reason: "GEMINI_API_KEY env var is missing in production",
      keyFP,
      groundingEnabled,
    });
  }

  const ai = new GoogleGenAI({ apiKey: key });

  /* ---------- Test 1: simple grounded call ----------------------------- */
  let simpleResult: {
    ok: boolean;
    sources?: number;
    queries?: number;
    error?: string;
    errorName?: string;
    sample?: string;
  };
  try {
    const t0 = Date.now();
    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "What is the current weather in Zagreb, Croatia? Use Google Search to find live data.",
      config: {
        temperature: 0.4,
        tools: [{ googleSearch: {} }],
      },
    });
    const elapsed = Date.now() - t0;
    const cand = resp.candidates?.[0];
    const gm = cand?.groundingMetadata;
    simpleResult = {
      ok: true,
      sources: gm?.groundingChunks?.length ?? 0,
      queries: gm?.webSearchQueries?.length ?? 0,
      sample: `${resp.text?.slice(0, 100) ?? ""}… (${elapsed}ms)`,
    };
  } catch (e) {
    simpleResult = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      errorName: e instanceof Error ? e.name : "unknown",
    };
  }

  /* ---------- Test 2: Wynner-style complex grounded call --------------- */
  let complexResult: typeof simpleResult;
  try {
    const t0 = Date.now();
    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a dropshipping product intelligence analyst. Research the product "Posture Belt v2" for the German market.

Use Google Search to find:
- Search volume trends on this product category
- Top competitors selling similar products in Germany
- Common customer complaints

Return a JSON object with:
{
  "product_name": string,
  "country": string,
  "demand_signal": "high" | "medium" | "low",
  "competitor_count_estimate": number,
  "top_complaint": string
}

---
CRITICAL OUTPUT RULES:
1. Respond ONLY with valid JSON conforming to the schema described above.
2. NO markdown code fences (no \`\`\`json, no \`\`\`).
3. NO preamble, NO explanation, NO trailing commentary.
4. Begin your response with { and end with }.`,
      config: {
        temperature: 0.4,
        tools: [{ googleSearch: {} }],
      },
    });
    const elapsed = Date.now() - t0;
    const cand = resp.candidates?.[0];
    const gm = cand?.groundingMetadata;
    complexResult = {
      ok: true,
      sources: gm?.groundingChunks?.length ?? 0,
      queries: gm?.webSearchQueries?.length ?? 0,
      sample: `${resp.text?.slice(0, 200) ?? ""}… (${elapsed}ms)`,
    };
  } catch (e) {
    complexResult = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      errorName: e instanceof Error ? e.name : "unknown",
    };
  }

  /* ---------- Verdict --------------------------------------------------- */
  const verdict = simpleResult.ok && complexResult.ok
    ? "✅ Grounding works in production. Key is valid + has search permission."
    : !simpleResult.ok
      ? `❌ Even simple grounded call failed. Most likely: key is on free tier OR billing isn't actually active on the Google Cloud project. Error: ${simpleResult.error}`
      : `⚠️ Simple grounded call works but complex one fails. The 400 is likely from the prompt shape (length, JSON discipline + tools conflict, etc). Error: ${complexResult.error}`;

  return NextResponse.json({
    keyFP,
    groundingEnabled,
    test1_simple: simpleResult,
    test2_complex: complexResult,
    verdict,
    nextSteps: [
      "If test1 fails: confirm Gemini key billing at https://console.cloud.google.com/billing",
      "If test1 passes but test2 fails: the issue is prompt-side, I'll fix in the wrapper",
      "If both pass: grounding works — scan failure is elsewhere, retry a scan and check logs again",
    ],
  });
}
