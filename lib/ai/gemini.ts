import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";

const TIMEOUT_MS = 30_000;
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
