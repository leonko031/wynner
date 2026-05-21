"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useProductStore } from "@/lib/store/products";
import { useResearchStore } from "@/lib/store/research";
import { useCreditsStore } from "@/lib/store/credits";
import {
  RESEARCH_MODE_META,
  STAGE_LABELS,
  type DeepResearchReport,
  type ResearchMode,
  type ResearchProgressEvent,
  type ResearchStageId,
} from "@/types/research";
import type { Niche, Product, Source } from "@/types";
import { COUNTRIES } from "@/lib/data/countries";
import { AiOrb } from "./ai-orb";
import { LiveThinkingFeed } from "./live-thinking-feed";
import { StageProgressCard, type StageState } from "./stage-progress-card";
import type { GroundingSource } from "@/types/grounding";
import { ExternalLink } from "lucide-react";

export type LiveResearchInput = {
  mode: ResearchMode;
  product: {
    name: string;
    description: string;
    image: string;
    category: Niche;
    costUSD: number;
    suggestedPriceUSD: number;
    shippingCostUSD: number;
    source: Source;
    sourceUrl?: string;
  };
  countryCode: string;
  userContext?: string;
};

type Thought = { id: string; text: string };

/**
 * Full-screen takeover that runs the SSE research stream and animates the
 * "AI is thinking" experience. Once the report event arrives, persists
 * everything to local stores, charges credits, and navigates to the result.
 */
export function LiveResearchExperience({ input }: { input: LiveResearchInput }) {
  const router = useRouter();
  const addProduct = useProductStore((s) => s.addProduct);
  const addReport = useResearchStore((s) => s.addReport);
  const spend = useCreditsStore((s) => s.spend);
  const grant = useCreditsStore((s) => s.grant);
  const noteScanDay = useCreditsStore((s) => s.noteScanDay);

  const meta = RESEARCH_MODE_META[input.mode];
  const country = COUNTRIES[input.countryCode];

  // Stage state — one entry per stage in this mode
  const [stages, setStages] = useState<StageState[]>(() =>
    meta.stages.map((id) => ({ id, status: "pending" as const })),
  );
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  /** Live count of distinct sources discovered across all phase-1 calls. */
  const [discoveredSources, setDiscoveredSources] = useState<GroundingSource[]>([]);
  /** Distinct grounded search queries the engine has fired. */
  const [runQueries, setRunQueries] = useState<Set<string>>(new Set());
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  // Lazy useState — initializer runs exactly once and is allowed to read
  // Date.now() at mount time. This is the React 19 strict-mode-safe pattern
  // for "remember when the component mounted".
  const [startedAt] = useState<number>(() => Date.now());
  const abortRef = useRef<AbortController | null>(null);
  const spendTxRef = useRef<string | null>(null);

  const completedCount = stages.filter((s) => s.status === "completed" || s.status === "failed").length;
  const progressPct = Math.round((completedCount / stages.length) * 100);

  // Elapsed timer (visual only)
  useEffect(() => {
    if (completed) return;
    const t = window.setInterval(() => {
      setSecondsElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => window.clearInterval(t);
  }, [completed, startedAt]);

  // Kick off the research stream on mount.
  useEffect(() => {
    let cancelled = false;

    async function go() {
      // Charge credits up front
      const allOn = input.mode === "deep";
      const spendKind = allOn ? "full_power_scan" : "basic_scan";
      const r = spend(spendKind, {
        cost: meta.creditCost,
        description: `${meta.label} — ${input.product.name}`,
      });
      if (!r.success) {
        toast.error("Not enough credits");
        router.replace("/pricing#topups");
        return;
      }
      spendTxRef.current = r.transaction.id;
      noteScanDay();

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      let res: Response;
      try {
        res = await fetch("/api/research/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: {
              name: input.product.name,
              description: input.product.description,
              image: input.product.image,
              category: input.product.category,
              costUSD: input.product.costUSD,
              suggestedPriceUSD: input.product.suggestedPriceUSD,
              shippingCostUSD: input.product.shippingCostUSD,
            },
            countryCode: input.countryCode,
            userContext: input.userContext,
            mode: input.mode,
          }),
          signal: ctrl.signal,
        });
      } catch (err) {
        if (!cancelled) {
          handleFatal(err instanceof Error ? err.message : "Network error");
        }
        return;
      }

      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => ({ error: "Unknown" }))) as { error?: string };
        handleFatal(body.error ?? `Request failed (${res.status})`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          // SSE messages are separated by double-newline. Parse each complete
          // message out of the buffer; leave any partial trailing chunk.
          let nlIdx = buffer.indexOf("\n\n");
          while (nlIdx !== -1) {
            const raw = buffer.slice(0, nlIdx);
            buffer = buffer.slice(nlIdx + 2);
            handleSseMessage(raw);
            nlIdx = buffer.indexOf("\n\n");
          }
        }
      } catch (err) {
        if (!cancelled) handleFatal(err instanceof Error ? err.message : "Stream error");
      }
    }

    function handleSseMessage(raw: string) {
      const lines = raw.split("\n");
      let event = "message";
      let dataStr = "";
      for (const line of lines) {
        if (line.startsWith(":")) continue; // comment / heartbeat
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
      }
      if (!dataStr) return;
      let payload: unknown;
      try {
        payload = JSON.parse(dataStr);
      } catch {
        return;
      }
      if (event === "progress") onProgress(payload as ResearchProgressEvent);
      else if (event === "report") onReport(payload as DeepResearchReport);
      else if (event === "error") {
        const err = payload as { message?: string };
        handleFatal(err.message ?? "Unknown server error");
      }
    }

    function onProgress(ev: ResearchProgressEvent) {
      // Phase events — sentinels in the thinking feed.
      if (ev.type === "phase_started") {
        const label =
          ev.phase === 1 ? "Phase 1 — researching the web" :
          ev.phase === 2 ? "Phase 2 — synthesizing findings" :
          "Phase 3 — computing verdict";
        setThoughts((prev) => [...prev, { id: nanoid(6), text: label }]);
        return;
      }
      if (ev.type === "phase_completed") {
        return; // no-op, the next phase's start covers it
      }

      // Search-query + source events — real-time grounded research signal.
      if (ev.type === "search_query_started") {
        setRunQueries((prev) => {
          if (prev.has(ev.query)) return prev;
          const next = new Set(prev);
          next.add(ev.query);
          return next;
        });
        setThoughts((prev) => [
          ...prev,
          { id: nanoid(6), text: `🔍 Searching: "${ev.query}"` },
        ]);
        return;
      }
      if (ev.type === "search_query_completed") {
        // Already had a started message — skip duplicate noise.
        return;
      }
      if (ev.type === "source_discovered") {
        setDiscoveredSources((prev) => {
          if (prev.some((s) => s.uri === ev.source.uri)) return prev;
          return [...prev, ev.source];
        });
        setThoughts((prev) => [
          ...prev,
          { id: nanoid(6), text: `📄 Reading: ${ev.source.domain}` },
        ]);
        return;
      }

      if ("stage" in ev) {
        const stageId = ev.stage as ResearchStageId;
        setStages((prev) =>
          prev.map((s) => {
            if (s.id !== stageId) return s;
            if (ev.type === "stage_started") {
              return { ...s, status: "active", detail: STAGE_LABELS[stageId] };
            }
            if (ev.type === "stage_thinking") {
              return { ...s, status: "active", detail: ev.thought };
            }
            if (ev.type === "stage_completed") {
              return {
                ...s,
                status: "completed",
                detail: ev.preview,
                durationMs: ev.durationMs,
              };
            }
            if (ev.type === "stage_failed") {
              return {
                ...s,
                status: "failed",
                detail: `Recovered with fallback`,
                usedFallback: ev.usedFallback,
              };
            }
            return s;
          }),
        );
        if (ev.type === "stage_thinking") {
          setThoughts((prev) => [...prev, { id: nanoid(6), text: ev.thought }]);
        }
        if (ev.type === "stage_started") {
          setThoughts((prev) => [
            ...prev,
            { id: nanoid(6), text: `⏵ ${STAGE_LABELS[ev.stage as ResearchStageId]}` },
          ]);
        }
      }
    }

    function onReport(report: DeepResearchReport) {
      if (cancelled) return;

      // Build a Product record from the snapshot + verdict so this report
      // shows up in the dashboard / vault and product detail pages work.
      const productId = `wp-${nanoid(8)}`;
      const v = report.finalVerdict;
      const product: Product = {
        id: productId,
        name: input.product.name,
        description: input.product.description,
        image: input.product.image,
        category: input.product.category,
        costUSD: input.product.costUSD,
        suggestedPriceUSD: input.product.suggestedPriceUSD,
        shippingCostUSD: input.product.shippingCostUSD,
        source: input.product.source,
        sourceUrl: input.product.sourceUrl,
        targetCountry: input.countryCode,
        sellScore: v.sellScore,
        verdict: v.verdict,
        pillars: v.pillars,
        reasoning: {
          topAngle: v.topAngle,
          whyTest: [v.summary],
          redFlags: report.riskAnalysis?.redFlags.map((f) => f.description) ?? [],
        },
        demandTrend: trendFromScore(v.sellScore),
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addProduct(product);

      // Persist the rich report, indexed by the new product id.
      const persistedReport: DeepResearchReport = { ...report, productId };
      addReport(persistedReport);

      setCompleted(true);
      setCelebrate(true);

      toast.success(`${meta.label} complete`, {
        description: `Verdict: ${v.verdict.toUpperCase()} · Score ${v.sellScore}`,
      });

      // Brief celebration before navigating.
      window.setTimeout(() => {
        if (!cancelled) router.push(`/product/${productId}?fresh=true`);
      }, 1400);
    }

    function handleFatal(message: string) {
      // Refund credits if we charged at the start
      if (spendTxRef.current !== null) {
        grant(meta.creditCost, "topup_purchase", `Refund — research failed (${message.slice(0, 40)})`);
        spendTxRef.current = null;
      }
      toast.error("Research failed", {
        description: `${message} — your credits were refunded.`,
      });
      router.replace("/scan");
    }

    go();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSeconds = meta.estimatedSeconds;
  const remaining = Math.max(0, totalSeconds - secondsElapsed);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[2fr_3fr]">
        {/* LEFT — orb + thinking feed (sticky) */}
        <div className="md:sticky md:top-24 md:self-start">
          <div className="glass-strong rounded-3xl p-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-glow rounded-full bg-aurora-blue/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-aurora-blue" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                  {completed ? "Research complete" : "Wynner is researching…"}
                </span>
              </div>
              <h1 className="mt-2 text-balance text-lg font-medium tracking-tight text-text md:text-xl">
                {input.product.name}
              </h1>
              <p className="mt-0.5 text-xs text-text-muted">
                {country?.flag} {country?.name} · {meta.label}
              </p>
            </div>

            <div className="mt-6 flex justify-center">
              <AiOrb
                size={200}
                intensity={Math.max(0.3, completedCount / stages.length)}
                celebrate={celebrate}
              />
            </div>

            {/* Progress + time */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-[11px] text-text-dim">
                <span className="font-mono uppercase tracking-wider">
                  {progressPct}%
                </span>
                <span className="font-mono tabular-nums">
                  {completed
                    ? `${secondsElapsed}s total`
                    : remaining > 0
                      ? `~${remaining}s left`
                      : "Finalizing…"}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    background:
                      "linear-gradient(90deg, #5B8DFF, #A788FF, #FF89C5)",
                    boxShadow: "0 0 8px rgba(167,136,255,0.6)",
                  }}
                />
              </div>
            </div>

            {/* Thinking feed */}
            <div className="mt-6">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                Live research
              </div>
              <LiveThinkingFeed thoughts={thoughts} />
            </div>

            {/* Sources counter + collapsible list */}
            {(discoveredSources.length > 0 || runQueries.size > 0) && (
              <div className="mt-4 rounded-2xl border border-border-soft bg-surface/50 p-3">
                <button
                  type="button"
                  onClick={() => setSourcesOpen((o) => !o)}
                  className="flex w-full items-center justify-between text-xs text-text-muted hover:text-text"
                >
                  <span>
                    <span className="font-mono tabular-nums text-text">
                      {discoveredSources.length}
                    </span>{" "}
                    source{discoveredSources.length === 1 ? "" : "s"} ·{" "}
                    <span className="font-mono tabular-nums text-text">
                      {runQueries.size}
                    </span>{" "}
                    quer{runQueries.size === 1 ? "y" : "ies"}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider">
                    {sourcesOpen ? "hide" : "show"}
                  </span>
                </button>
                {sourcesOpen && (
                  <ul className="mt-3 max-h-44 space-y-1 overflow-y-auto pr-1">
                    {discoveredSources.slice(-20).reverse().map((src) => (
                      <li key={src.uri} className="flex items-center gap-2 text-[11px]">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
                          alt=""
                          width={12}
                          height={12}
                          className="h-3 w-3 rounded-sm"
                        />
                        <span className="truncate text-text-muted">{src.domain}</span>
                        <a
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="ml-auto text-text-dim hover:text-text"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — stage cards */}
        <div className="space-y-3">
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="text-base font-medium tracking-tight text-text">
              {completedCount} of {stages.length} stages complete
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              {meta.label}
            </span>
          </div>
          {useMemo(
            () => stages.map((s, i) => <StageProgressCard key={s.id} stage={s} index={i} />),
            [stages],
          )}
        </div>
      </div>
    </main>
  );
}

/** Deterministic-ish 30-day trend for the new product card. */
function trendFromScore(score: number): number[] {
  const out: number[] = [];
  const base = 5 + score / 5;
  for (let i = 0; i < 30; i++) {
    const drift = score >= 60 ? i * 0.4 : -i * 0.15;
    const jitter = (Math.sin(i * 1.7 + score) + 1) * 3;
    out.push(Math.max(2, Math.round(base + drift + jitter)));
  }
  return out;
}
