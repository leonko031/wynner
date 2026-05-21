import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";
import type { ZodSchema } from "zod";
import type {
  GroundedCallResult,
  GroundingSource,
} from "@/types/grounding";

const TIMEOUT_MS = 30_000;
const GROUNDING_TIMEOUT_MS = 60_000;
const RETRIES = 2;

export const FLASH_MODEL = "gemini-2.5-flash";
export const PRO_MODEL = "gemini-2.5-pro";

let cachedClient: GoogleGenerativeAI | null = null;

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
 * Grounding (Google Search tool) is opt-out. Costs ~$0.035 per grounded call
 * and adds 5-15s of latency, so we expose a flag for the rare situations
 * where the operator wants to fall back to ungrounded behavior (e.g. a
 * development environment where they're spamming scans).
 */
export function isGroundingEnabled(): boolean {
  return (process.env.GEMINI_GROUNDING_ENABLED ?? "true").toLowerCase() !== "false";
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
export async function geminiWithGrounding<T>(opts: {
  prompt: string;
  systemInstruction?: string;
  schema: ZodSchema<T>;
  model?: "gemini-2.5-pro" | "gemini-2.5-flash";
}): Promise<GroundedCallResult<T>> {
  const modelName = opts.model ?? FLASH_MODEL;
  const started = Date.now();

  if (!isGroundingEnabled()) {
    return ungroundedFallback<T>(modelName, opts.prompt, opts.schema, started, "grounding_disabled");
  }
  const client = getClient();
  if (!client) {
    throw new Error("GEMINI_API_KEY missing");
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: opts.systemInstruction,
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
        // The SDK's TS types don't include the googleSearch tool yet —
        // it's documented for v1beta but missing from this version's
        // GenerativeModel options. Cast through unknown to set it.
        tools: [{ googleSearch: {} }] as unknown as never,
      });
      const result = await withTimeout(
        model.generateContent(opts.prompt),
        GROUNDING_TIMEOUT_MS,
      );
      const text = result.response.text();
      const parsedJson = parseJson<unknown>(text);
      const validated = opts.schema.safeParse(parsedJson);
      if (!validated.success) {
        throw new Error(
          `grounding_validation_failed: ${validated.error.issues[0]?.message ?? "unknown"}`,
        );
      }

      // Pull groundingMetadata out of the SDK response. Shape per
      // https://ai.google.dev/api/generate-content#GroundingMetadata
      const candidate = (result.response as unknown as {
        candidates?: Array<{
          groundingMetadata?: {
            groundingChunks?: Array<{
              web?: { uri?: string; title?: string };
            }>;
            webSearchQueries?: string[];
          };
        }>;
      }).candidates?.[0];
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
      const usage = (result.response as unknown as {
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      }).usageMetadata;

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
      if (attempt < RETRIES) {
        const wait = attempt === 0 ? 1_000 : 3_000;
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }

  // All retries exhausted — fall back to an ungrounded call so the pipeline
  // continues. The orchestrator will mark this section's confidence "low".
  console.error(
    `[geminiWithGrounding] all retries failed, falling back to ungrounded`,
    lastError,
  );
  return ungroundedFallback<T>(modelName, opts.prompt, opts.schema, started, "retries_exhausted");
}

async function ungroundedFallback<T>(
  modelName: string,
  prompt: string,
  schema: ZodSchema<T>,
  started: number,
  _reason: string,
): Promise<GroundedCallResult<T>> {
  try {
    const raw = await geminiJSON<unknown>(modelName, prompt);
    const validated = schema.safeParse(raw);
    if (!validated.success) {
      throw new Error(
        `ungrounded_validation_failed: ${validated.error.issues[0]?.message ?? "unknown"}`,
      );
    }
    return {
      data: validated.data,
      sources: [],
      searchQueries: [],
      tokens: { input: null, output: null },
      durationMs: Date.now() - started,
      fellBackToUngrounded: true,
    };
  } catch (e) {
    // Re-throw — the orchestrator's per-stage fallback will catch this.
    throw e instanceof Error ? e : new Error(String(e));
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
