import { runDeepResearch, type RunResearchInput } from "@/lib/ai/research-engine";
import { isGeminiAvailable } from "@/lib/ai/gemini";
import { researchModeSchema } from "@/types/research";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// SSE streaming requires Node runtime — Edge doesn't support all the same
// generator/stream APIs predictably in Next 16.
export const runtime = "nodejs";
// Disable any caching layer in front of the stream.
export const dynamic = "force-dynamic";

/**
 * Per-user concurrent scan guard. In-memory map keyed by user id (or IP in
 * demo mode). Decrements on stream close. Survives only within a single
 * Node process — in a multi-instance deploy this won't be perfectly
 * consistent, but it's enough to stop a single user spamming the engine
 * with parallel scans from the same tab.
 */
const MAX_CONCURRENT_PER_USER = 3;
const activeByUser = new Map<string, number>();

function acquire(key: string): boolean {
  const current = activeByUser.get(key) ?? 0;
  if (current >= MAX_CONCURRENT_PER_USER) return false;
  activeByUser.set(key, current + 1);
  return true;
}

function release(key: string): void {
  const current = activeByUser.get(key) ?? 0;
  if (current <= 1) activeByUser.delete(key);
  else activeByUser.set(key, current - 1);
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",
  Connection: "keep-alive",
};

function encodeEvent(event: string, data: unknown): Uint8Array {
  // SSE format: `event: <name>\ndata: <json>\n\n`
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(payload);
}

/**
 * POST /api/research/stream
 *
 * Body: { product, countryCode, mode, userContext? }
 *
 * Streams Server-Sent Events as the research engine works. Event names:
 *   - "progress": every ResearchProgressEvent
 *   - "report":   the final DeepResearchReport JSON (on success)
 *   - "error":    fatal error (engine could not run at all)
 *   - "done":     terminal event so the client knows to close the stream
 *
 * The client persists the report to its local Zustand store on receiving the
 * "report" event, then navigates to /product/[id]?fresh=true.
 */
export async function POST(req: Request) {
  if (!isGeminiAvailable()) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY is missing — research engine is offline." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: RunResearchInput;
  try {
    body = (await req.json()) as RunResearchInput;
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const modeCheck = researchModeSchema.safeParse(body.mode);
  if (!modeCheck.success) {
    return new Response(JSON.stringify({ error: "invalid mode" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Identify the user for the concurrency guard. Falls back to remote address
  // when Supabase isn't configured (demo mode).
  let userKey = "anonymous";
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) userKey = `u:${user.id}`;
  }
  if (userKey === "anonymous") {
    const fwd = req.headers.get("x-forwarded-for");
    userKey = `ip:${fwd?.split(",")[0]?.trim() ?? "local"}`;
  }

  if (!acquire(userKey)) {
    return new Response(
      JSON.stringify({
        error: "too_many_concurrent_scans",
        message: `You already have ${MAX_CONCURRENT_PER_USER} scans running. Wait for one to finish.`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "30",
        },
      },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Heartbeat keeps proxies from killing the connection on long stages.
      // 15s interval is conservative — the longest stage is ~30s timeout.
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": ping\n\n"));
        } catch {
          // Stream already closed — interval will be cleared in finally.
        }
      }, 15_000);

      try {
        const gen = runDeepResearch(body);
        // Manual iteration so we can capture the return value (final report).
        let finalReport;
        while (true) {
          const r = await gen.next();
          if (r.done) {
            finalReport = r.value;
            break;
          }
          controller.enqueue(encodeEvent("progress", r.value));
        }
        controller.enqueue(encodeEvent("report", finalReport));
        controller.enqueue(encodeEvent("done", { ok: true }));
      } catch (err) {
        controller.enqueue(
          encodeEvent("error", {
            message: err instanceof Error ? err.message : "Research failed",
          }),
        );
        controller.enqueue(encodeEvent("done", { ok: false }));
      } finally {
        clearInterval(heartbeat);
        release(userKey);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
    cancel() {
      release(userKey);
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
