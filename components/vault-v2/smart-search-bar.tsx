"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useProductStore } from "@/lib/store/products";
import { useCreditsStore } from "@/lib/store/credits";
import { compressProducts } from "@/lib/ai/prompts/vault";
import { semanticSearchOutputSchema } from "@/types/vault";
import { cn } from "@/lib/utils";

const ROTATING_PLACEHOLDERS = [
  "Search products, niches, countries...",
  "Try: posture products in Germany under €30",
  "Try: high-margin wellness winners",
  "Try: what should I scan next?",
];

const SUGGESTED_QUERIES = [
  "Top scorers this month",
  "Underperformers worth revisiting",
  "GO verdicts I haven't acted on",
  "Wellness niche in Europe",
];

const SEMANTIC_COST = 1;
const RECENT_KEY = "wynner.vault.recentSearches";
const MAX_RECENT = 5;

export type SmartSearchResult = {
  productIds: string[];
  interpretation: string | null;
  ranks: Map<string, number>; // productId → relevance (semantic only)
  reasons: Map<string, string>; // productId → reason (semantic only)
};

export type SmartSearchBarProps = {
  /** Current text-mode query (controlled). */
  query: string;
  onQueryChange: (q: string) => void;
  /** Called whenever a semantic search completes (or is cleared). */
  onSemanticResult: (result: SmartSearchResult | null) => void;
};

/**
 * Smart vault search. Two modes:
 *
 *   • text     — fires onQueryChange on every keystroke; the page filters
 *                locally. Default.
 *   • semantic — pressing Enter sends the query + the user's product list
 *                to /api/vault/search and returns ranked productIds + a
 *                short interpretation. Costs ✦ 1 credit per submission
 *                (free for admins).
 */
export function SmartSearchBar({
  query,
  onQueryChange,
  onSemanticResult,
}: SmartSearchBarProps) {
  const products = useProductStore((s) => s.products);
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  const balance = useCreditsStore((s) => s.balance);
  const spend = useCreditsStore((s) => s.spend);

  const [aiMode, setAiMode] = useState(false);
  const [running, setRunning] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Hydrate recent searches from localStorage. Deferred via setTimeout(0)
  // so React 19's strict purity rule doesn't flag this as in-effect setState.
  useEffect(() => {
    let cancelled = false;
    let parsed: string[] | null = null;
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as unknown;
        if (Array.isArray(arr)) {
          parsed = arr.filter((s): s is string => typeof s === "string").slice(0, MAX_RECENT);
        }
      }
    } catch {
      // ignore
    }
    const t = parsed && parsed.length > 0
      ? window.setTimeout(() => {
          if (!cancelled) setRecent(parsed!);
        }, 0)
      : null;
    return () => {
      cancelled = true;
      if (t !== null) window.clearTimeout(t);
    };
  }, []);

  // Rotate the placeholder every 3s when the input is empty.
  useEffect(() => {
    if (query) return;
    const t = window.setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % ROTATING_PLACEHOLDERS.length);
    }, 3000);
    return () => window.clearInterval(t);
  }, [query]);

  function persistRecent(q: string) {
    setRecent((cur) => {
      const next = [q, ...cur.filter((x) => x !== q)].slice(0, MAX_RECENT);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function clearRecent() {
    setRecent([]);
    try {
      window.localStorage.removeItem(RECENT_KEY);
    } catch {
      // ignore
    }
  }

  async function runSemantic(q: string) {
    if (!q.trim()) return;
    // Credit gate.
    if (!isAdmin && balance < SEMANTIC_COST) {
      toast.error("Not enough credits", {
        description: "AI search costs ✦ 1. Top up to keep searching.",
      });
      return;
    }
    const spendResult = spend("re_score", {
      cost: SEMANTIC_COST,
      description: `AI vault search — "${q.slice(0, 40)}"`,
    });
    if (!spendResult.success) {
      toast.error("Not enough credits");
      return;
    }
    setRunning(true);
    try {
      const res = await fetch("/api/vault/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          mode: "semantic",
          products: compressProducts(products),
        }),
      });
      const data = await res.json();
      const parsed = semanticSearchOutputSchema.safeParse(data);
      if (!parsed.success) {
        toast.warning("AI couldn't parse a clean result", {
          description: "Try rephrasing the question — your credits aren't refunded.",
        });
        onSemanticResult(null);
        return;
      }
      const ranks = new Map<string, number>();
      const reasons = new Map<string, string>();
      for (const m of parsed.data.matches) {
        ranks.set(m.productId, m.relevance);
        reasons.set(m.productId, m.reason);
      }
      onSemanticResult({
        productIds: parsed.data.matches.map((m) => m.productId),
        interpretation: parsed.data.interpretation,
        ranks,
        reasons,
      });
      persistRecent(q);
    } catch (err) {
      toast.error("Search failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
      onSemanticResult(null);
    } finally {
      setRunning(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (aiMode) {
      void runSemantic(query);
    } else if (query) {
      persistRecent(query);
    }
  }

  const placeholder = useMemo(() => ROTATING_PLACEHOLDERS[placeholderIdx]!, [placeholderIdx]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <form onSubmit={handleSubmit}>
        <div
          className="glass relative flex h-16 items-center gap-3 rounded-2xl px-4"
          style={{
            boxShadow:
              "0 0 0 1px rgba(167,136,255,0.18), inset 0 1px 0 0 var(--surface-glass-highlight)",
          }}
        >
          <Search className="h-5 w-5 shrink-0 text-text-dim" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="h-full flex-1 bg-transparent text-lg text-text outline-none placeholder:text-text-dim/70"
            aria-label="Search vault"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                onQueryChange("");
                onSemanticResult(null);
              }}
              aria-label="Clear search"
              className="flex h-7 w-7 items-center justify-center rounded-full text-text-dim hover:bg-surface-elevated hover:text-text"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setAiMode((v) => !v)}
            aria-pressed={aiMode}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-all",
              aiMode
                ? "text-white shadow-[0_8px_20px_-6px_rgba(167,136,255,0.55)]"
                : "border border-border-soft bg-surface/70 text-text-muted hover:border-aurora-purple/45",
            )}
            style={
              aiMode
                ? { background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)" }
                : undefined
            }
            title={aiMode ? "AI mode on — submit to run a semantic search" : "Switch to AI semantic search"}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI{aiMode ? "" : "?"}
          </button>
          {aiMode && (
            <span className="hidden font-mono text-[10px] uppercase tracking-wider text-text-dim sm:inline">
              {isAdmin ? "free for you" : `✦ ${SEMANTIC_COST}/search`}
            </span>
          )}
        </div>

        {/* Loading shimmer */}
        <AnimatePresence>
          {running && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-1.5 h-0.5 origin-left rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #A788FF, transparent)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s linear infinite",
              }}
            />
          )}
        </AnimatePresence>
      </form>

      {/* Recent + suggested chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {recent.length > 0 && (
          <>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Recent
            </span>
            {recent.map((q) => (
              <ChipButton
                key={`r-${q}`}
                onClick={() => {
                  onQueryChange(q);
                  if (aiMode) void runSemantic(q);
                }}
                muted
              >
                {q}
              </ChipButton>
            ))}
            <button
              type="button"
              onClick={clearRecent}
              className="text-[11px] text-text-dim underline-offset-2 hover:text-text-muted hover:underline"
            >
              Clear
            </button>
            <span className="mx-1 h-3 w-px bg-border-soft" aria-hidden />
          </>
        )}
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          Try
        </span>
        {SUGGESTED_QUERIES.map((q) => (
          <ChipButton
            key={`s-${q}`}
            onClick={() => {
              setAiMode(true);
              onQueryChange(q);
              void runSemantic(q);
            }}
          >
            {q}
          </ChipButton>
        ))}
      </div>
    </motion.section>
  );
}

function ChipButton({
  children,
  onClick,
  muted,
}: {
  children: React.ReactNode;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] transition-all hover:-translate-y-0.5",
        muted
          ? "border-border-soft/60 bg-surface/40 text-text-muted hover:bg-surface/70"
          : "border-border-soft bg-surface/70 text-text hover:border-aurora-purple/45",
      )}
    >
      {children}
    </button>
  );
}
