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
import { StageProgressCard, type StageState } from "./stage-progress-card";
import type { GroundingSource } from "@/types/grounding";
// Cinematic UI primitives — replace the old left-orb-right-cards layout.
import { CinematicOrb, type OrbState } from "./live-scan/cinematic-orb";
import { SourceFeed, type FeedEvent } from "./live-scan/source-feed";
import { PhaseIndicator } from "./live-scan/phase-indicator";
import {
  StageTimeline,
  type TimelineStage,
} from "./live-scan/stage-timeline";

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
  /** Cinematic source feed event stream (typed unions). */
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  /** Increment every time a source is discovered — drives orb node-flash. */
  const [sourcePulseKey, setSourcePulseKey] = useState(0);
  /** Which research phase (1/2/3) is currently in flight. 4 = done. */
  const [currentPhase, setCurrentPhase] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  void thoughts; void celebrate;
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
      // Phase events — drive the top phase indicator + (legacy) thoughts feed.
      if (ev.type === "phase_started") {
        setCurrentPhase(ev.phase);
        return;
      }
      if (ev.type === "phase_completed") {
        // Bump to the next phase ID when this one ends; final "phase 3
        // completed" → 4, which the indicator renders as "all done".
        setCurrentPhase((p) => Math.max(p, ev.phase + 1));
        return;
      }

      // Search-query event — push to the cinematic source feed + dedupe.
      if (ev.type === "search_query_started") {
        setRunQueries((prev) => {
          if (prev.has(ev.query)) return prev;
          const next = new Set(prev);
          next.add(ev.query);
          return next;
        });
        setFeedEvents((prev) => [
          ...prev,
          {
            kind: "query",
            id: nanoid(8),
            query: ev.query,
            stage: ev.stage,
            ts: Date.now(),
          },
        ]);
        return;
      }
      if (ev.type === "search_query_completed") {
        return;
      }
      // Source discovered — push to feed, bump the orb pulse key.
      if (ev.type === "source_discovered") {
        setDiscoveredSources((prev) => {
          if (prev.some((s) => s.uri === ev.source.uri)) return prev;
          return [...prev, ev.source];
        });
        setFeedEvents((prev) => [
          ...prev,
          {
            kind: "source",
            id: nanoid(8),
            uri: ev.source.uri,
            title: ev.source.title,
            domain: ev.source.domain,
            stage: ev.stage,
            ts: Date.now(),
          },
        ]);
        setSourcePulseKey((k) => k + 1);
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
              // Show the actual error (truncated for the card) instead of a
              // generic "Offline mode" — the user needs to see WHY it failed
              // so they can act on it (key issue, schema mismatch, etc.).
              const detailMsg =
                typeof ev.error === "string" && ev.error.length > 0
                  ? ev.error.slice(0, 140)
                  : "Stage didn't return usable data";
              return {
                ...s,
                status: "failed",
                detail: detailMsg,
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

  // Derive the orb state from scan state. Simple machine: complete > thinking.
  // (Failing path navigates away via handleFatal, so we don't render it here.)
  const orbState: OrbState = completed ? "complete" : "thinking";

  // Map the engine's StageState[] to the cinematic timeline's TimelineStage[].
  // The timeline distinguishes complete/fallback/failed; our engine uses
  // status + usedFallback to express the same thing.
  const timeline: TimelineStage[] = stages.map((s) => {
    let status: TimelineStage["status"] = "pending";
    if (s.status === "active") status = "active";
    else if (s.status === "completed") status = s.usedFallback ? "fallback" : "complete";
    else if (s.status === "failed") status = "failed";
    return { id: s.id, status, durationMs: s.durationMs };
  });

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1600px] flex-col px-4 py-6 md:px-6 md:py-8">
      {/* Top — phase indicator + product title */}
      <div className="relative flex flex-col items-center gap-3">
        <div className="relative">
          <PhaseIndicator
            currentPhase={currentPhase}
            progress={completedCount / Math.max(1, stages.length)}
          />
        </div>
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
            {completed ? "Research complete" : "Wynner is reading…"}
          </div>
          <h1 className="mt-1 font-serif text-2xl text-text md:text-3xl">
            {input.product.name}
          </h1>
          <p className="mt-0.5 text-xs text-text-muted">
            {country?.flag} {country?.name} · {meta.label}
            {!completed && (
              <>
                {" · "}
                <span className="font-mono tabular-nums">
                  {remaining > 0 ? `~${remaining}s left` : "Finalizing…"}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Middle — 3 columns: source feed | orb (center) | (legacy stage cards, hidden ≥md) */}
      <div className="relative mt-6 grid flex-1 grid-cols-1 gap-6 md:grid-cols-[minmax(280px,360px)_1fr_minmax(280px,360px)]">
        <SourceFeed
          events={feedEvents}
          sourceCount={discoveredSources.length}
          queryCount={runQueries.size}
        />

        {/* Center — the orb. Centered vertically + horizontally. */}
        <div className="relative flex items-center justify-center">
          <CinematicOrb
            state={orbState}
            size={400}
            sourcePulseKey={sourcePulseKey}
          />
        </div>

        {/* Right — current-stage detail card (legacy stage progress cards
            rendered compactly so the user can audit per-stage status). */}
        <aside className="glass relative flex flex-col rounded-3xl p-5">
          <div className="mb-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
              Stages
            </div>
            <p className="mt-1 text-xs text-text-dim">
              {completedCount} of {stages.length} complete
            </p>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {useMemo(
              () =>
                stages.map((s, i) => (
                  <StageProgressCard key={s.id} stage={s} index={i} />
                )),
              [stages],
            )}
          </div>
        </aside>
      </div>

      {/* Bottom — stage timeline */}
      <div className="mt-6">
        <StageTimeline stages={timeline} />
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
