"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronRight, History, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/lib/auth/use-user";
import { useProductStore } from "@/lib/store/products";
import { useCreditsStore } from "@/lib/store/credits";
import { compressProducts } from "@/lib/ai/prompts/vault";
import { cn } from "@/lib/utils";

const ASK_COST = 2;
const STORAGE_KEY_OPEN = "wynner.vault.askwynner.open";

type Message = { id: string; role: "user" | "assistant"; content: string; timestamp: string };

const SUGGESTIONS = [
  "What's my strongest niche?",
  "Which products should I re-score?",
  "Find me products similar to my best winners",
  "Why are my Germany scores higher than my US ones?",
];

/**
 * Right-edge slide-out chat sidebar. Streams Gemini Flash responses via
 * SSE from /api/vault/ask, costs ✦ 2 per question (free for admins). Inline
 * [Product Name {score}] tags become clickable links to /product/{id}.
 */
export function AskWynnerSidebar() {
  const { user } = useUser();
  const products = useProductStore((s) => s.products);
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  const balance = useCreditsStore((s) => s.balance);
  const spend = useCreditsStore((s) => s.spend);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Persist + restore open state across reloads.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_OPEN);
      if (stored === "1") {
        const t = window.setTimeout(() => setOpen(true), 0);
        return () => window.clearTimeout(t);
      }
    } catch {
      // ignore
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_OPEN, open ? "1" : "0");
    } catch {
      // ignore
    }
  }, [open]);

  // Autoscroll to bottom on new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const t = window.setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }), 30);
    return () => window.clearTimeout(t);
  }, [messages]);

  async function send(question: string) {
    if (!question.trim() || streaming) return;
    if (!isAdmin && balance < ASK_COST) {
      toast.error("Not enough credits", {
        description: `Each question costs ✦ ${ASK_COST}. Top up to keep asking.`,
      });
      return;
    }
    const spendResult = spend("re_score", {
      cost: ASK_COST,
      description: `Ask Wynner — "${question.slice(0, 40)}"`,
    });
    if (!spendResult.success) {
      toast.error("Not enough credits");
      return;
    }
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };
    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      },
    ]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/vault/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          products: compressProducts(products),
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({ error: "Unknown" }));
        throw new Error(data.message ?? data.error ?? `request failed (${res.status})`);
      }

      // Parse SSE stream.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx = buffer.indexOf("\n\n");
        while (idx !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const lines = raw.split("\n");
          let event = "message";
          let dataStr = "";
          for (const line of lines) {
            if (line.startsWith(":")) continue;
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
          }
          if (!dataStr) {
            idx = buffer.indexOf("\n\n");
            continue;
          }
          let payload: { text?: string; message?: string } = {};
          try {
            payload = JSON.parse(dataStr);
          } catch {
            // skip malformed line
            idx = buffer.indexOf("\n\n");
            continue;
          }
          if (event === "chunk" && payload.text) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + payload.text }
                  : m,
              ),
            );
          } else if (event === "error") {
            throw new Error(payload.message ?? "Stream error");
          }
          idx = buffer.indexOf("\n\n");
        }
      }
    } catch (err) {
      // Strip the assistant placeholder if we never got any tokens.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && !m.content
            ? { ...m, content: "_(no response — try again)_" }
            : m,
        ),
      );
      toast.error("Ask Wynner failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setStreaming(false);
    }
  }

  // Collapsed strip
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Ask Wynner"
        className="fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 items-center gap-2 rounded-l-2xl border border-r-0 border-aurora-purple/40 bg-surface/80 px-3 py-4 backdrop-blur-xl transition-all hover:bg-surface md:flex"
        style={{ writingMode: "vertical-rl" }}
      >
        <Sparkles className="h-3.5 w-3.5 text-aurora-purple rotate-180" />
        <span className="font-mono text-[10px] uppercase tracking-[2px] text-text rotate-180">
          Ask Wynner
        </span>
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.aside
        key="ask-wynner"
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[400px] flex-col border-l border-border-soft bg-surface/95 backdrop-blur-xl"
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-2 border-b border-border-soft px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-aurora-purple" />
            <h2 className="font-serif text-base text-text">Ask Wynner about your vault</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-surface-elevated hover:text-text"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <EmptyChatState onPick={(q) => void send(q)} signedIn={!!user} />
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} streaming={streaming && m.role === "assistant"} />
              ))}
            </ul>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="border-t border-border-soft px-4 py-3"
        >
          <div className="flex items-center gap-2 rounded-full border border-border-soft bg-surface/80 px-3 py-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your vault…"
              disabled={streaming}
              className="h-7 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-dim"
            />
            <button
              type="submit"
              disabled={!input.trim() || streaming}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full px-3 text-xs font-medium text-white",
                input.trim() && !streaming
                  ? "hover:brightness-110"
                  : "opacity-50",
              )}
              style={{
                background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              }}
            >
              {streaming ? "…" : "Ask"}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-text-dim">
            <span className="font-mono uppercase tracking-wider">
              {isAdmin ? "Free for you" : `✦ ${ASK_COST} per question`}
            </span>
            <button
              type="button"
              onClick={() => setMessages([])}
              className="inline-flex items-center gap-1 hover:text-text"
            >
              <History className="h-3 w-3" />
              Clear conversation
            </button>
          </div>
        </form>
      </motion.aside>
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/* Bubble + inline product tag rendering                                       */
/* -------------------------------------------------------------------------- */

function ChatBubble({
  message,
  streaming,
}: {
  message: Message;
  streaming?: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <li
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-md bg-aurora-blue/12 text-text"
            : "rounded-tl-md bg-surface/80 text-text border border-border-soft",
        )}
      >
        {isUser ? (
          <span>{message.content}</span>
        ) : (
          <>
            <RichAssistantContent text={message.content} />
            {streaming && message.content && (
              <span
                aria-hidden
                className="ml-0.5 inline-block h-3.5 w-1 align-middle"
                style={{ background: "#A788FF", animation: "pulse-glow 1s ease-in-out infinite" }}
              />
            )}
            {streaming && !message.content && (
              <span className="text-xs text-text-dim">…thinking</span>
            )}
          </>
        )}
      </div>
    </li>
  );
}

/**
 * Render an assistant message that may contain [Product Name {score}] tags
 * as clickable links. We resolve each tag by name against the local product
 * store at click time.
 *
 * The render strategy: split the raw text on the tag regex and inject
 * <ProductTag> components in place of matches. Everything else is plain
 * paragraph text (line breaks honored via whitespace-pre-line).
 */
function RichAssistantContent({ text }: { text: string }) {
  const regex = /\[([^\]\n]+?)\s\{(\d{1,3})\}\]/g;
  const products = useProductStore((s) => s.products);

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const name = match[1]!.trim();
    const score = Number(match[2]);
    const p =
      products.find(
        (pr) => pr.name.toLowerCase() === name.toLowerCase() && pr.sellScore === score,
      ) ?? products.find((pr) => pr.name.toLowerCase() === name.toLowerCase());
    if (p) {
      parts.push(
        <Link
          key={`tag-${key++}`}
          href={`/product/${p.id}`}
          className="mx-0.5 inline-flex items-center gap-1 rounded-md border border-aurora-purple/45 bg-aurora-purple/10 px-1.5 py-0.5 text-[12px] text-aurora-purple hover:bg-aurora-purple/20"
        >
          {name}
          <span className="font-mono text-[10px] text-text-dim">{score}</span>
        </Link>,
      );
    } else {
      // No match — render as a soft pill that's not a link.
      parts.push(
        <span
          key={`tag-${key++}`}
          className="mx-0.5 inline-flex items-center gap-1 rounded-md border border-border-soft bg-surface/60 px-1.5 py-0.5 text-[12px] text-text-muted"
        >
          {name}
          <span className="font-mono text-[10px] text-text-dim">{score}</span>
        </span>,
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return <p className="whitespace-pre-line">{parts}</p>;
}

function EmptyChatState({
  onPick,
  signedIn,
}: {
  onPick: (q: string) => void;
  signedIn: boolean;
}) {
  return (
    <div>
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(91,141,255,0.18), rgba(167,136,255,0.22), rgba(255,137,197,0.18))",
          border: "1px solid rgba(167,136,255,0.40)",
        }}
      >
        <Sparkles className="h-6 w-6 text-aurora-purple" />
      </div>
      <h3 className="text-center font-serif text-lg text-text">
        Your private vault analyst
      </h3>
      <p className="mt-1 text-center text-xs text-text-muted">
        {signedIn
          ? "Ask anything about your products. I see your whole vault."
          : "Sign in to enable AI chat over your vault."}
      </p>
      <div className="mt-5 space-y-1.5">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="w-full rounded-xl border border-border-soft bg-surface/70 px-3 py-2 text-left text-xs text-text hover:border-aurora-purple/45 hover:bg-surface"
          >
            {q}
          </button>
        ))}
      </div>
      <X className="invisible" />
    </div>
  );
}
