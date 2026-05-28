import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";
// New SDK used specifically for grounded calls. The old SDK's
// GoogleSearchRetrievalTool expects { googleSearchRetrieval: {} } (Gemini
// 1.5 era); for 2.5+ models the correct tool key is { googleSearch: {} },
// which is what the new SDK exposes. Keeping both SDKs side-by-side
// minimizes churn — only the grounding wrapper migrated.
import { GoogleGenAI } from "@google/genai";
import type { ZodSchema } from "zod";
import type {
  GroundedCallResult,
  GroundingSource,
} from "@/types/grounding";

const TIMEOUT_MS = 30_000;
// Grounded calls (Google Search tool) routinely take 30-60s. Allow 90 so
// long Pro-tier scrapes don't time out before the model finishes browsing.
const GROUNDING_TIMEOUT_MS = 90_000;
const RETRIES = 2;

/**
 * Verbose grounding logging — flip on by setting GEMINI_DEBUG=true or running
 * in NODE_ENV=development. Output is prefixed [GEMINI_GROUNDING_DEBUG] so it's
 * trivially greppable in Vercel/local logs. Capture instructions are in
 * /docs/GROUNDING_DEBUG_LOG.md.
 */
function isGroundingDebug(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    (process.env.GEMINI_DEBUG ?? "").toLowerCase() === "true"
  );
}
function gdebug(...args: unknown[]) {
  if (!isGroundingDebug()) return;
  // eslint-disable-next-line no-console
  console.error("[GEMINI_GROUNDING_DEBUG]", ...args);
}

export const FLASH_MODEL = "gemini-2.5-flash";
export const PRO_MODEL = "gemini-2.5-pro";

let cachedClient: GoogleGenerativeAI | null = null;

/** New SDK client — used only by geminiWithGrounding (correct googleSearch tool support). */
let cachedGenAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (cachedGenAI) return cachedGenAI;
  cachedGenAI = new GoogleGenAI({ apiKey: key });
  return cachedGenAI;
}

function getClient(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (cachedClient) return cachedClient;
  cachedClient = new GoogleGenerativeAI(key);
  return cachedClient;
}

export function isGeminiAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Grounding (Google Search tool) is OPT-IN as of the v3 stability pass.
 * Reason: grounding requires a paid-tier Gemini key + working billing setup,
 * and silently fails with cryptic 400s when the key/billing isn't right —
 * making scans look "broken" even though the ungrounded path works fine.
 *
 * Set GEMINI_GROUNDING_ENABLED=true in Vercel to flip it on once you've
 * confirmed grounding works for your account (see docs/GROUNDING_DEBUG_LOG.md
 * for verification steps).
 *
 * Default off → every "grounded" call goes straight to ungroundedFallback,
 * which calls Gemini in plain JSON mode. Works with ANY Gemini key. Scans
 * complete reliably with verdicts, hook angles, and the full pipeline —
 * just without cited live web sources.
 */
export function isGroundingEnabled(): boolean {
  return (process.env.GEMINI_GROUNDING_ENABLED ?? "false").toLowerCase() === "true";
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini timed out after ${ms}ms`)), ms),
    ),
  ]);
}

async function withRetry<T>(fn: () => Promise<T>, retries = RETRIES): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await withTimeout(fn(), TIMEOUT_MS);
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        // Exponential backoff: 1s, 3s (per Deep Research spec)
        const wait = attempt === 0 ? 1_000 : 3_000;
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

function jsonConfig(schema?: object): GenerationConfig {
  const cfg: GenerationConfig = {
    temperature: 0.4,
    responseMimeType: schema ? "application/json" : "text/plain",
  };
  if (schema) {
    // @ts-expect-error — responseSchema is supported but typed loosely in some SDK versions
    cfg.responseSchema = schema;
  }
  return cfg;
}

function parseJson<T>(raw: string): T {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(trimmed) as T;
}

export async function geminiFlash<T>(
  prompt: string,
  schema?: object,
): Promise<T> {
  const client = getClient();
  if (!client) throw new Error("GEMINI_API_KEY missing");
  return withRetry(async () => {
    const model = client.getGenerativeModel({
      model: FLASH_MODEL,
      generationConfig: jsonConfig(schema),
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return schema ? parseJson<T>(text) : (text as unknown as T);
  });
}

export async function geminiPro<T>(
  prompt: string,
  schema?: object,
): Promise<T> {
  const client = getClient();
  if (!client) throw new Error("GEMINI_API_KEY missing");
  return withRetry(async () => {
    const model = client.getGenerativeModel({
      model: PRO_MODEL,
      generationConfig: jsonConfig(schema),
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return schema ? parseJson<T>(text) : (text as unknown as T);
  });
}

/**
 * JSON-mode wrappers used by the research engine. Always set
 * responseMimeType: "application/json" so Gemini emits raw JSON, but skip the
 * strict responseSchema — Zod validates the shape on the client side, which
 * gives us richer error reporting + graceful fallbacks.
 */
async function geminiJSON<T>(modelName: string, prompt: string): Promise<T> {
  const client = getClient();
  if (!client) throw new Error("GEMINI_API_KEY missing");
  return withRetry(async () => {
    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseJson<T>(text);
  });
}

export function geminiFlashJSON<T>(prompt: string): Promise<T> {
  return geminiJSON<T>(FLASH_MODEL, prompt);
}

export function geminiProJSON<T>(prompt: string): Promise<T> {
  return geminiJSON<T>(PRO_MODEL, prompt);
}

/* -------------------------------------------------------------------------- */
/* Google-Search grounded calls                                                */
/* -------------------------------------------------------------------------- */

/**
 * Run a grounded Gemini call with the Google Search tool enabled. Returns
 * both the parsed JSON response and the grounding metadata (sources,
 * search queries actually run, token usage, etc).
 *
 * Behavior:
 *   • Schema is validated with the caller's Zod schema; on validation
 *     failure we throw a typed error so the orchestrator can decide whether
 *     to fall back.
 *   • 60s timeout (much longer than ungrounded — grounding is slow).
 *   • 2 retries with exponential backoff (1s, 3s).
 *   • If grounding is disabled or all retries fail, we fall back to a plain
 *     ungrounded call and set `fellBackToUngrounded: true`. The caller
 *     should mark that section's confidence as "low" downstream.
 *
 * NOTE on the SDK: @google/generative-ai@0.24 surfaces `tools` via the
 * model's `generateContent` config. We pass `[{ googleSearch: {} }]`. The
 * SDK is loose on typing here so the array is cast through `unknown`.
 */
/**
 * The "return only JSON" suffix appended to grounded prompts. Grounding
 * tools[] is incompatible with structured-output mode (responseMimeType:
 * "application/json" or responseSchema), so we have to coerce JSON via
 * prompt instructions instead. See parseJson() — it strips ```json fences.
 */
const JSON_DISCIPLINE_SUFFIX = `\n\n---\nCRITICAL OUTPUT RULES:
1. Respond ONLY with valid JSON conforming to the schema described above.
2. NO markdown code fences (no \`\`\`json, no \`\`\`).
3. NO preamble, NO explanation, NO trailing commentary.
4. Begin your response with { and end with }.
5. If a field's value is unknown, use null or [] — never omit required fields.`;

/**
 * Second-attempt suffix added when the first response failed parse/validation.
 * Gemini is good at self-correcting when told exactly what went wrong.
 */
function correctiveSuffix(reason: string): string {
  return `\n\n---\nYour previous response failed schema validation: ${reason}
Return ONLY valid JSON now. No markdown fences, no preamble. Begin with { and end with }.`;
}

export async function geminiWithGrounding<T>(opts: {
  prompt: string;
  systemInstruction?: string;
  schema: ZodSchema<T>;
  model?: "gemini-2.5-pro" | "gemini-2.5-flash";
  /** Optional label so debug logs can identify which call this is. */
  label?: string;
}): Promise<GroundedCallResult<T>> {
  const modelName = opts.model ?? FLASH_MODEL;
  const started = Date.now();
  const label = opts.label ?? "unlabeled";

  if (!isGroundingEnabled()) {
    gdebug(`${label} — grounding disabled, using ungrounded fallback`);
    return ungroundedFallback<T>(modelName, opts.prompt, opts.schema, started, "grounding_disabled");
  }
  const ai = getGenAI();
  if (!ai) {
    throw new Error("GEMINI_API_KEY missing");
  }

  let lastError: unknown;
  let lastFailureReason = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const promptWithDiscipline =
        opts.prompt +
        (attempt === 0 ? JSON_DISCIPLINE_SUFFIX : correctiveSuffix(lastFailureReason));

      gdebug(`${label} attempt ${attempt + 1} — calling (new SDK)`, {
        model: modelName,
        tools: ["googleSearch"],
        promptChars: promptWithDiscipline.length,
      });

      // NEW SDK call. The shape is:
      //   ai.models.generateContent({ model, contents, config: { tools, ... } })
      // The new SDK accepts { googleSearch: {} } natively for 2.5+ models —
      // unlike the old SDK which silently dropped the unknown key when we
      // tried to pass it through its typed Tool interface (which uses the
      // older googleSearchRetrieval name for 1.5 models).
      //
      // CRITICAL: still no responseMimeType / responseSchema. Tools[] and
      // structured-output mode are mutually exclusive — JSON discipline
      // stays on the prompt side.
      const result = await withTimeout(
        ai.models.generateContent({
          model: modelName,
          contents: promptWithDiscipline,
          config: {
            temperature: 0.4,
            ...(opts.systemInstruction
              ? { systemInstruction: opts.systemInstruction }
              : {}),
            tools: [{ googleSearch: {} }],
          },
        }),
        GROUNDING_TIMEOUT_MS,
      );

      // New SDK exposes a `text` getter on the response. Fall back to
      // walking candidates[0].content.parts in case the getter is empty.
      const text =
        result.text ??
        (result.candidates?.[0]?.content?.parts ?? [])
          .map((p) => (typeof p === "object" && p && "text" in p ? (p as { text?: string }).text ?? "" : ""))
          .join("");

      gdebug(`${label} attempt ${attempt + 1} — raw response`, {
        chars: text.length,
        first200: text.slice(0, 200),
        last100: text.slice(-100),
      });

      if (!text || text.length === 0) {
        lastFailureReason = "empty_response_text";
        throw new Error(lastFailureReason);
      }

      let parsedJson: unknown;
      try {
        parsedJson = parseJson<unknown>(text);
      } catch (parseErr) {
        lastFailureReason = `JSON parse failed: ${
          parseErr instanceof Error ? parseErr.message : String(parseErr)
        }`;
        gdebug(`${label} attempt ${attempt + 1} — parse failed`, {
          reason: lastFailureReason,
          text: text.slice(0, 500),
        });
        throw new Error(lastFailureReason);
      }

      const validated = opts.schema.safeParse(parsedJson);
      if (!validated.success) {
        const firstIssue = validated.error.issues[0];
        lastFailureReason = firstIssue
          ? `${firstIssue.path.join(".") || "(root)"}: ${firstIssue.message}`
          : "unknown schema mismatch";
        gdebug(`${label} attempt ${attempt + 1} — schema failed`, {
          reason: lastFailureReason,
          issues: validated.error.issues.slice(0, 5),
          parsedJson: JSON.stringify(parsedJson).slice(0, 500),
        });
        throw new Error(`schema_validation_failed: ${lastFailureReason}`);
      }

      const candidate = result.candidates?.[0];
      gdebug(`${label} attempt ${attempt + 1} — succeeded`, {
        finishReason: candidate?.finishReason,
        sourceCount: candidate?.groundingMetadata?.groundingChunks?.length ?? 0,
        queryCount: candidate?.groundingMetadata?.webSearchQueries?.length ?? 0,
      });

      const metadata = candidate?.groundingMetadata;
      const sources: GroundingSource[] = (metadata?.groundingChunks ?? [])
        .map((chunk, i): GroundingSource | null => {
          const uri = chunk.web?.uri;
          if (!uri) return null;
          let domain = "";
          try {
            domain = new URL(uri).hostname.replace(/^www\./, "");
          } catch {
            domain = uri.split("/")[2] ?? uri.slice(0, 60);
          }
          return {
            index: i,
            uri,
            title: chunk.web?.title ?? domain,
            domain,
            retrievedAt: new Date().toISOString(),
          };
        })
        .filter((x): x is GroundingSource => x !== null);

      const searchQueries: string[] = metadata?.webSearchQueries ?? [];
      const usage = result.usageMetadata;

      return {
        data: validated.data,
        sources,
        searchQueries,
        tokens: {
          input: usage?.promptTokenCount ?? null,
          output: usage?.candidatesTokenCount ?? null,
        },
        durationMs: Date.now() - started,
        fellBackToUngrounded: false,
      };
    } catch (err) {
      lastError = err;
      gdebug(`${label} attempt ${attempt + 1} — exception`, {
        name: err instanceof Error ? err.name : "unknown",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // All grounded attempts failed. Log once + fall back to ungrounded so the
  // pipeline ALWAYS produces a usable result. The orchestrator marks the
  // section's confidence "low" and the UI shows a neutral "Analyzed offline"
  // label. Critical invariant: this wrapper must NEVER throw — every code
  // path returns a valid GroundedCallResult so scans complete end-to-end.
  // eslint-disable-next-line no-console
  console.error(
    `[geminiWithGrounding] ${label}: grounded attempts failed, using ungrounded fallback. err=${(
      lastError instanceof Error ? lastError.message : String(lastError)
    ).slice(0, 300)}`,
  );
  return ungroundedFallback<T>(modelName, opts.prompt, opts.schema, started, "retries_exhausted");
}

/* Removed: free-tier classifier + chunked diagnostic logging.
 * They were diagnostic scaffolding that made things worse — throwing on
 * permission errors prevented the ungrounded fallback from running,
 * leaving stages with null data. With grounding now OPT-IN (default
 * false), the failure path is rarely hit anyway. */

async function ungroundedFallback<T>(
  modelName: string,
  prompt: string,
  schema: ZodSchema<T>,
  started: number,
  _reason: string,
): Promise<GroundedCallResult<T>> {
  // Tell the model explicitly it's running ungrounded so it doesn't pretend
  // to have searched — mark sources as empty and confidence as low instead.
  const ungroundedPrompt =
    prompt +
    `\n\n---\nNote: This is a non-grounded response. Use your training knowledge.
Be honest about uncertainty by marking all sources arrays as empty and any
confidence field as "low". Respond ONLY with valid JSON — no markdown
fences, no preamble.`;

  // CRITICAL INVARIANT: this function MUST return a valid GroundedCallResult.
  // It must NEVER throw. If grounding is disabled or fails, this is the only
  // path that produces stage data — if it throws, every stage shows "Offline
  // mode" and scans produce no output. We try increasingly forgiving paths
  // and ultimately return data: null rather than propagating an exception.
  try {
    const raw = await geminiJSON<unknown>(modelName, ungroundedPrompt);

    // Try strict schema first.
    const strict = schema.safeParse(raw);
    if (strict.success) {
      return {
        data: strict.data,
        sources: [],
        searchQueries: [],
        tokens: { input: null, output: null },
        durationMs: Date.now() - started,
        fellBackToUngrounded: true,
      };
    }

    // Schema validation failed but we have parsed JSON. Some downstream code
    // can work with a partial / extra-field shape — pass the raw through and
    // let the consumer Zod-validate at use-site. If they need strict, they'll
    // get null and handle it; if they're permissive, they get useful data.
    // eslint-disable-next-line no-console
    console.error(
      `[ungroundedFallback] schema mismatch — passing raw JSON through. First issue: ${
        strict.error.issues[0]?.message ?? "unknown"
      }`,
    );
    return {
      // Returning raw cast as T is intentional: it preserves the model's
      // output for permissive consumers. Strict consumers should safeParse.
      data: raw as T,
      sources: [],
      searchQueries: [],
      tokens: { input: null, output: null },
      durationMs: Date.now() - started,
      fellBackToUngrounded: true,
    };
  } catch (e) {
    // geminiJSON itself failed (network, 4xx, parse, timeout). Don't throw —
    // return data: null and let the orchestrator decide how to render the
    // missing stage. The pipeline keeps going for the other stages.
    // eslint-disable-next-line no-console
    console.error(
      `[ungroundedFallback] hard failure: ${(e instanceof Error ? e.message : String(e)).slice(0, 300)}`,
    );
    return {
      data: null as unknown as T,
      sources: [],
      searchQueries: [],
      tokens: { input: null, output: null },
      durationMs: Date.now() - started,
      fellBackToUngrounded: true,
    };
  }
}

export async function geminiVision<T>(
  prompt: string,
  imageUrl: string,
  schema?: object,
): Promise<T> {
  const client = getClient();
  if (!client) throw new Error("GEMINI_API_KEY missing");
  return withRetry(async () => {
    const model = client.getGenerativeModel({
      model: FLASH_MODEL,
      generationConfig: jsonConfig(schema),
    });
    // Fetch image and convert to inline base64 part
    const resp = await fetch(imageUrl);
    if (!resp.ok) throw new Error(`image fetch ${resp.status}`);
    const buf = await resp.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    const mime = resp.headers.get("content-type") ?? "image/jpeg";
    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: b64, mimeType: mime } },
    ]);
    const text = result.response.text();
    return schema ? parseJson<T>(text) : (text as unknown as T);
  });
}
