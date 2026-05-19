import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isGeminiAvailable } from "@/lib/ai/gemini";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FLASH_MODEL } from "@/lib/ai/gemini";
import {
  buildVaultChatPrompt,
  type ChatTurn,
  type GeminiProduct,
} from "@/lib/ai/prompts/vault";
import type { Profile } from "@/types/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASK_COST = 2;

const bodySchema = z.object({
  question: z.string().min(1).max(800),
  products: z.array(z.unknown()).max(200),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(20),
});

/**
 * POST /api/vault/ask
 *
 * Streams a Gemini chat response back as Server-Sent Events. Each chunk is
 * sent as `event: chunk\ndata: <json>\n\n`. On completion `event: done`.
 *
 * Cost: ✦ 2 per question (free for admins).
 *
 * The streaming pattern mirrors /api/research/stream — the client reads via
 * fetch + ReadableStream and renders typewriter-style.
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

  if (!isGeminiAvailable()) {
    return NextResponse.json(
      { error: "gemini_unavailable", message: "AI chat isn't configured yet." },
      { status: 503 },
    );
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
    .select("is_admin, credit_balance, display_name")
    .eq("id", user.id)
    .maybeSingle();
  const profile =
    (profileRow as Pick<Profile, "is_admin" | "credit_balance" | "display_name"> | null) ?? null;
  const isAdmin = profile?.is_admin === true;

  if (!isAdmin) {
    const balance = profile?.credit_balance ?? 0;
    if (balance < ASK_COST) {
      return NextResponse.json(
        { error: "insufficient_credits", needed: ASK_COST, balance },
        { status: 402 },
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("profiles") as any)
      .update({ credit_balance: balance - ASK_COST })
      .eq("id", user.id);
  }

  const firstName =
    (profile?.display_name?.trim().split(/\s+/)[0]) ??
    user.email?.split("@")[0] ??
    "there";

  const prompt = buildVaultChatPrompt(
    body.question,
    body.products as GeminiProduct[],
    body.history as ChatTurn[],
    firstName,
  );

  // Stream from Gemini SDK using generateContentStream.
  const apiKey = process.env.GEMINI_API_KEY!;
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: FLASH_MODEL,
    generationConfig: { temperature: 0.5 },
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        const result = await model.generateContentStream(prompt);
        let full = "";
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            full += text;
            send("chunk", { text });
          }
        }
        send("done", { fullText: full, cost: isAdmin ? 0 : ASK_COST });
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : "Stream failed",
        });
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
