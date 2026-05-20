"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Lock,
  RefreshCw,
  Sparkle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AiOrb } from "@/components/research/ai-orb";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCreditsStore } from "@/lib/store/credits";
import {
  strategicBriefSchema,
  type CompactScan,
  type StrategicBrief,
} from "@/types/insights";
import { cn } from "@/lib/utils";

const BRIEF_COST = 5;
const UNLOCK_MIN_SCANS = 10;

export type BriefEventDetail = {
  ms: number;
  cached: boolean;
  fellBack: boolean;
};
export const BRIEF_EVENT = "wynner:insights-brief-event";

type Props = {
  scansHash: string;
  scans: CompactScan[];
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  operatorLevel: number;
  operatorTier: string;
  testingCount: number;
  wonCount: number;
  killedCount: number;
  watchlistCount: number;
  comparisonsCount: number;
  /** When true, automatically loads the brief on mount (if scans >= unlock threshold). */
  autoLoad: boolean;
  /** Total scans across all time — drives the unlock-progress UI. */
  totalScansAllTime: number;
  /** Fired when the user successfully generates a fresh brief. */
  onRegenerated?: (id: string | null) => void;
};

type State =
  | { kind: "locked" }
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; brief: StrategicBrief; cached: boolean; id: string | null }
  | { kind: "error"; message: string };

/**
 * The killer feature card. Aurora orb + 5-part Gemini Pro briefing.
 *
 * ✦ 5 to generate (free for admins). Cached weekly per scansHash so
 * re-loads cost nothing until the user actually re-scores.
 */
export function StrategicBriefCard(props: Props) {
  const reduce = useReducedMotion();
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  const balance = useCreditsStore((s) => s.balance);

  const [state, setState] = useState<State>(
    props.totalScansAllTime < UNLOCK_MIN_SCANS
      ? { kind: "locked" }
      : { kind: "idle" },
  );
  const [confirming, setConfirming] = useState(false);

  const insufficient = !isAdmin && balance < BRIEF_COST;
  const locked = props.totalScansAllTime < UNLOCK_MIN_SCANS;

  // Memo the body so refs are stable across renders.
  const body = useMemo(
    () =>
      JSON.stringify({
        scans: props.scans,
        scansHash: props.scansHash,
        periodLabel: props.periodLabel,
        periodStart: props.periodStart,
        periodEnd: props.periodEnd,
        operatorLevel: props.operatorLevel,
        operatorTier: props.operatorTier,
        testingCount: props.testingCount,
        wonCount: props.wonCount,
        killedCount: props.killedCount,
        watchlistCount: props.watchlistCount,
        comparisonsCount: props.comparisonsCount,
      }),
    [
      props.scans,
      props.scansHash,
      props.periodLabel,
      props.periodStart,
      props.periodEnd,
      props.operatorLevel,
      props.operatorTier,
      props.testingCount,
      props.wonCount,
      props.killedCount,
      props.watchlistCount,
      props.comparisonsCount,
    ],
  );

  async function fetchBrief(regenerate: boolean) {
    setState({ kind: "loading" });
    const started = Date.now();
    try {
      const parsedBody = JSON.parse(body);
      const res = await fetch("/api/insights/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsedBody, regenerate }),
      });
      const ms = Date.now() - started;
      const data = await res.json();
      if (res.status === 402) {
        setState({
          kind: "error",
          message: `You need ✦ ${data.needed ?? BRIEF_COST} (you have ${data.balance ?? balance}).`,
        });
        return;
      }
      if (!res.ok) {
        setState({
          kind: "error",
          message: data.message ?? `Couldn't load the brief (${res.status}).`,
        });
        return;
      }
      const parsed = strategicBriefSchema.safeParse(data.brief);
      if (!parsed.success) {
        setState({ kind: "error", message: "The brief came back malformed." });
        return;
      }
      setState({
        kind: "ready",
        brief: parsed.data,
        cached: data.cached === true,
        id: data.briefId ?? null,
      });
      props.onRegenerated?.(data.briefId ?? null);
      // Dispatch diagnostics event
      window.dispatchEvent(
        new CustomEvent<BriefEventDetail>(BRIEF_EVENT, {
          detail: { ms, cached: data.cached === true, fellBack: false },
        }),
      );
      if (regenerate && !data.cached) {
        toast.success("Brief regenerated", {
          description: isAdmin ? "Admin — free" : `Spent ✦ ${BRIEF_COST}`,
        });
      }
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  // Auto-load on mount (cache-only — the server already gates regeneration on
  // a separate regenerate flag).
  useEffect(() => {
    if (locked) {
      const id = setTimeout(() => setState({ kind: "locked" }), 0);
      return () => clearTimeout(id);
    }
    if (!props.autoLoad) return;
    const id = setTimeout(() => {
      void fetchBrief(false);
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, props.autoLoad, locked]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl p-px"
      style={{
        background:
          "linear-gradient(135deg, rgba(91,141,255,0.55), rgba(167,136,255,0.45), rgba(255,137,197,0.55))",
      }}
    >
      <div
        className={cn(
          "relative rounded-[calc(theme(borderRadius.3xl)-1px)] glass p-6 md:p-8",
          !reduce && "shimmer-bg",
        )}
        style={{ backgroundBlendMode: "overlay" }}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[120px_1fr]">
          <div className="flex justify-center md:justify-start">
            <AiOrb size={96} intensity={0.7} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-aurora-purple/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-aurora-purple">
                  <Sparkle className="h-3 w-3" />
                  The strategic brief
                </div>
                <h3 className="mt-2 font-serif text-2xl text-text">
                  Wynner&apos;s read on your operation
                </h3>
                <p className="mt-1 text-xs text-text-muted">
                  {props.periodLabel} ·{" "}
                  {state.kind === "ready" && state.cached
                    ? "cached this week"
                    : state.kind === "ready"
                      ? "fresh"
                      : "Gemini Pro"}
                </p>
              </div>
              <BriefActions
                state={state}
                isAdmin={isAdmin}
                insufficient={insufficient}
                confirming={confirming}
                onConfirm={() => setConfirming(true)}
                onCancel={() => setConfirming(false)}
                onGenerate={() => {
                  setConfirming(false);
                  void fetchBrief(state.kind === "ready");
                }}
              />
            </div>

            <div className="mt-5">
              {state.kind === "locked" && (
                <LockedState
                  totalScans={props.totalScansAllTime}
                  threshold={UNLOCK_MIN_SCANS}
                />
              )}
              {state.kind === "idle" && (
                <IdleState
                  onGenerate={() => void fetchBrief(false)}
                  insufficient={insufficient}
                  isAdmin={isAdmin}
                />
              )}
              {state.kind === "loading" && <LoadingState />}
              {state.kind === "error" && (
                <ErrorState
                  message={state.message}
                  onRetry={() => void fetchBrief(false)}
                />
              )}
              {state.kind === "ready" && (
                <ReadyBrief brief={state.brief} />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */

function BriefActions({
  state,
  isAdmin,
  insufficient,
  confirming,
  onConfirm,
  onCancel,
  onGenerate,
}: {
  state: State;
  isAdmin: boolean;
  insufficient: boolean;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onGenerate: () => void;
}) {
  if (state.kind === "locked") return null;

  const label = state.kind === "ready" ? "Regenerate" : "Generate";
  if (confirming) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-2 py-1">
        <button
          type="button"
          onClick={onGenerate}
          className="rounded-full bg-aurora-purple px-3 py-1 text-xs font-medium text-white hover:brightness-110"
        >
          {isAdmin ? "Free regenerate" : `Spend ✦ ${BRIEF_COST}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-2 py-1 text-xs text-text-muted hover:text-text"
        >
          Cancel
        </button>
      </div>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={state.kind === "loading"}
          onClick={onConfirm}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-4 text-xs font-medium",
            insufficient && !isAdmin
              ? "cursor-not-allowed text-text-dim"
              : "text-text hover:border-aurora-purple/55",
          )}
        >
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5",
              state.kind === "loading" && "animate-spin",
            )}
          />
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent className="text-xs">
        {isAdmin
          ? "Admin — free regeneration"
          : `Costs ✦ ${BRIEF_COST} · cached for a week`}
      </TooltipContent>
    </Tooltip>
  );
}

function LockedState({
  totalScans,
  threshold,
}: {
  totalScans: number;
  threshold: number;
}) {
  const pct = Math.min(100, Math.round((totalScans / threshold) * 100));
  return (
    <div className="rounded-2xl border border-dashed border-border-soft bg-surface/30 p-6 text-center">
      <Lock className="mx-auto h-5 w-5 text-text-dim" />
      <p className="mt-2 text-sm font-medium text-text">
        Unlock after your first {threshold} scans
      </p>
      <p className="mt-1 text-xs text-text-muted">
        Strategic briefs need a baseline of data to be useful. You&apos;re at{" "}
        <span className="font-mono">
          {totalScans}/{threshold}
        </span>
        .
      </p>
      <div className="mx-auto mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-surface/60">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, #5B8DFF, #A788FF, #FF89C5)",
          }}
        />
      </div>
    </div>
  );
}

function IdleState({
  onGenerate,
  insufficient,
  isAdmin,
}: {
  onGenerate: () => void;
  insufficient: boolean;
  isAdmin: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface/30 p-6">
      <p className="text-sm text-text-muted">
        Generate a long-form brief about your scanning patterns — what&apos;s
        working, what&apos;s not, and a 5-point plan for next month.
      </p>
      <button
        type="button"
        onClick={onGenerate}
        disabled={insufficient && !isAdmin}
        className={cn(
          "mt-4 inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-medium text-white shadow-[0_8px_22px_-6px_rgba(167,136,255,0.55)]",
          (insufficient && !isAdmin) ? "opacity-50" : "hover:brightness-110",
        )}
        style={{
          background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
        }}
      >
        <Sparkle className="h-3.5 w-3.5" />
        {isAdmin ? "Generate (admin)" : `Generate · ✦ ${BRIEF_COST}`}
      </button>
      {insufficient && !isAdmin && (
        <p className="mt-2 text-xs text-skip">
          Insufficient credits — top up to generate a brief.
        </p>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[180, 220, 160, 200, 140].map((w, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08 }}
          className="h-3 rounded-full shimmer-bg bg-surface/60"
          style={{ width: `${w}px` }}
        />
      ))}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-skip/30 bg-skip/5 p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 text-skip" />
        <div className="flex-1">
          <p className="text-sm font-medium text-text">Couldn&apos;t load the brief</p>
          <p className="mt-1 text-xs text-text-muted">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-3 py-1 text-xs text-text"
      >
        <RefreshCw className="h-3 w-3" />
        Retry
      </button>
    </div>
  );
}

function ReadyBrief({ brief }: { brief: StrategicBrief }) {
  return (
    <div className="space-y-5">
      <BriefBlock
        eyebrow="The portrait"
        delay={0}
        body={brief.portrait}
      />
      <BriefBlock
        eyebrow="What's working"
        accent="#3DD68C"
        delay={0.1}
        body={brief.whatsWorking.intro}
        bullets={brief.whatsWorking.bullets}
      />
      <BriefBlock
        eyebrow="What needs attention"
        accent="#FFB088"
        delay={0.2}
        body={brief.needsAttention.intro}
        bullets={brief.needsAttention.bullets}
      />
      <BriefBlock
        eyebrow="The hypothesis"
        accent="#A788FF"
        delay={0.3}
        body={brief.hypothesis}
      />
      <BriefBlock
        eyebrow="The plan for next month"
        accent="#5B8DFF"
        delay={0.4}
        body={brief.planForNextMonth.intro}
        actions={brief.planForNextMonth.actions}
      />
    </div>
  );
}

function BriefBlock({
  eyebrow,
  body,
  bullets,
  actions,
  accent,
  delay,
}: {
  eyebrow: string;
  body: string;
  bullets?: string[];
  actions?: string[];
  accent?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-wider"
        style={{ color: accent ?? "#9DA0BF" }}
      >
        {eyebrow}
      </div>
      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-text">
        {body}
      </p>
      {bullets && bullets.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-text">
              <span
                className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: accent ?? "#A788FF" }}
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {actions && actions.length > 0 && (
        <ol className="mt-2 space-y-2">
          {actions.map((a, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border-soft bg-surface/40 p-3 text-sm text-text"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold"
                style={{
                  color: accent ?? "#A788FF",
                  backgroundColor: `${accent ?? "#A788FF"}20`,
                  border: `1px solid ${accent ?? "#A788FF"}40`,
                }}
              >
                {i + 1}
              </span>
              <span>{a}</span>
            </li>
          ))}
        </ol>
      )}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Saved briefs history — tiny inline collapsible list                         */
/* -------------------------------------------------------------------------- */

export type SavedBrief = {
  id: string;
  period_start: string;
  period_end: string;
  created_at: string;
  saved_label: string | null;
};

export function SavedBriefs({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SavedBrief[]>([]);

  useEffect(() => {
    if (!enabled || !open) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/insights/brief", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { briefs: SavedBrief[] };
        if (!cancelled) setItems(data.briefs ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, open]);

  if (!enabled) return null;
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text"
      >
        <Bookmark className="h-3 w-3" />
        Past briefs{" "}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <motion.ul
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 space-y-1 overflow-hidden"
        >
          {items.length === 0 ? (
            <li className="text-xs text-text-dim">No saved briefs yet.</li>
          ) : (
            items.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-md bg-surface/40 px-2 py-1 font-mono text-[11px] text-text-muted"
              >
                <span>
                  {b.saved_label ?? `${b.period_start} → ${b.period_end}`}
                </span>
                <span className="text-text-dim">
                  {new Date(b.created_at).toLocaleDateString()}
                </span>
              </li>
            ))
          )}
        </motion.ul>
      )}
    </div>
  );
}
