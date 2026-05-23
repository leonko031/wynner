import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";
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
  const client = getClient();
  if (!client) {
    throw new Error("GEMINI_API_KEY missing");
  }

  let lastError: unknown;
  let lastFailureReason = "";
  // Two-attempt loop: first grounded call, then one corrective retry if the
  // response fails parse/validation. Network-level retries on top via
  // withRetry semantics would just multiply latency for an already-slow call.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const promptWithDiscipline =
        opts.prompt +
        (attempt === 0 ? JSON_DISCIPLINE_SUFFIX : correctiveSuffix(lastFailureReason));

      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: opts.systemInstruction,
        // CRITICAL: do NOT set responseMimeType or responseSchema here.
        // Structured-output mode + tools[] is a documented Gemini API
        // conflict — when both are present, the API rejects the request
        // with an unhelpful generic error. JSON discipline is enforced via
        // the prompt suffix above and the parseJson markdown-fence stripper.
        generationConfig: {
          temperature: 0.4,
        },
        // The SDK's TS types don't include the googleSearch tool. Per the
        // current Gemini docs (2.0+ models), the correct shape is
        // [{ googleSearch: {} }] — older 1.5 models used
        // [{ googleSearchRetrieval: {} }]. We're on 2.5, so googleSearch.
        tools: [{ googleSearch: {} }] as unknown as never,
      });

      gdebug(`${label} attempt ${attempt + 1} — calling`, {
        model: modelName,
        tools: ["googleSearch"],
        promptChars: promptWithDiscipline.length,
      });

      const result = await withTimeout(
        model.generateContent(promptWithDiscipline),
        GROUNDING_TIMEOUT_MS,
      );
      const text = result.response.text();
      gdebug(`${label} attempt ${attempt + 1} — raw response`, {
        chars: text.length,
        first200: text.slice(0, 200),
        last100: text.slice(-100),
      });

      // Parse + validate. Both can throw — we want to distinguish so the
      // corrective retry can tell Gemini what to fix.
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

      // Extract grounding metadata. The shape is documented at
      // https://ai.google.dev/api/generate-content#GroundingMetadata
      const candidate = (result.response as unknown as {
        candidates?: Array<{
          groundingMetadata?: {
            groundingChunks?: Array<{
              web?: { uri?: string; title?: string };
            }>;
            webSearchQueries?: string[];
          };
          finishReason?: string;
        }>;
        promptFeedback?: { blockReason?: string };
      }).candidates?.[0];

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
      gdebug(`${label} attempt ${attempt + 1} — exception`, {
        name: err instanceof Error ? err.name : "unknown",
        message: err instanceof Error ? err.message : String(err),
      });
      // First attempt failed — the loop's next iteration uses the
      // corrective suffix. Second attempt failed → fall through to the
      // ungrounded fallback below.
    }
  }

  // Both attempts failed. Log + fall back to ungrounded so the pipeline
  // continues. The orchestrator marks the section's confidence "low" and the
  // UI shows the "Offline mode for this stage" indicator.
  gdebug(`${label} — all grounded attempts failed, falling back to ungrounded`, {
    finalError: lastError instanceof Error ? lastError.message : String(lastError),
  });
  // eslint-disable-next-line no-console
  console.error(
    `[geminiWithGrounding] ${label}: all attempts failed, falling back to ungrounded`,
    lastError instanceof Error ? lastError.message : String(lastError),
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
  // Tell the model explicitly it's running ungrounded so it doesn't pretend
  // to have searched — mark sources as empty and confidence as low instead.
  const ungroundedPrompt =
    prompt +
    `\n\n---\nNote: This is a non-grounded response. Use your training knowledge.
Be honest about uncertainty by marking all sources arrays as empty and any
confidence field as "low". Respond ONLY with valid JSON — no markdown
fences, no preamble.`;
  try {
    const raw = await geminiJSON<unknown>(modelName, ungroundedPrompt);
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
