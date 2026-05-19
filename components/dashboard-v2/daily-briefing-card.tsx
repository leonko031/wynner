"use client";

import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AiOrb } from "@/components/research/ai-orb";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  dailyBriefingSchema,
  fallbackBriefing,
  type DailyBriefing,
} from "@/types/briefing";
import { useUser } from "@/lib/auth/use-user";
import { useCreditsStore } from "@/lib/store/credits";
import { BriefingChipPill } from "./briefing-chip";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; briefing: DailyBriefing; cached: boolean; fellBack: boolean }
  | { kind: "error"; briefing: DailyBriefing };

const REFRESH_COST = 1;

/**
 * The signature dashboard element. Aurora orb + a 3-paragraph briefing +
 * three quick-action chips. Cached server-side per user/day; refresh
 * button burns one credit (free for admins).
 */
export function DailyBriefingCard() {
  const { profile, user, configured } = useUser();
  const firstName = (profile?.display_name ?? user?.email?.split("@")[0] ?? "there")
    .trim()
    .split(/\s+/)[0]!;
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  const spend = useCreditsStore((s) => s.spend);
  const balance = useCreditsStore((s) => s.balance);

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Fetch the briefing on mount. When the user isn't signed into Supabase
  // we still render the templated fallback so the layout doesn't shift.
  useEffect(() => {
    if (!configured || !user) {
      // Defer the setState out of the effect body (React 19 strict mode).
      const t = window.setTimeout(
        () =>
          setState({
            kind: "ready",
            briefing: fallbackBriefing(firstName),
            cached: false,
            fellBack: true,
          }),
        0,
      );
      return () => window.clearTimeout(t);
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/briefing", { cache: "no-store" });
        if (!res.ok) throw new Error(`briefing fetch ${res.status}`);
        const data = (await res.json()) as {
          briefing: DailyBriefing;
          cached: boolean;
          fellBack: boolean;
        };
        const parsed = dailyBriefingSchema.safeParse(data.briefing);
        if (!cancelled) {
          if (parsed.success) {
            setState({
              kind: "ready",
              briefing: parsed.data,
              cached: data.cached,
              fellBack: data.fellBack,
            });
          } else {
            setState({ kind: "error", briefing: fallbackBriefing(firstName) });
          }
        }
      } catch {
        if (!cancelled) {
          setState({ kind: "error", briefing: fallbackBriefing(firstName) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured, user, firstName]);

  async function regenerate() {
    // Charge credits (free for admins per spend() override).
    if (!isAdmin && balance < REFRESH_COST) {
      toast.error("Not enough credits", {
        description: "Top up to regenerate your briefing.",
      });
      return;
    }
    const result = spend("re_score", {
      cost: REFRESH_COST,
      description: "Briefing regenerated",
    });
    if (!result.success) {
      toast.error("Not enough credits");
      return;
    }
    setRefreshing(true);
    setConfirming(false);
    try {
      const res = await fetch("/api/dashboard/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate: true }),
      });
      const data = (await res.json()) as {
        briefing: DailyBriefing;
        cached: boolean;
        fellBack: boolean;
      };
      const parsed = dailyBriefingSchema.safeParse(data.briefing);
      if (parsed.success) {
        setState({
          kind: "ready",
          briefing: parsed.data,
          cached: false,
          fellBack: data.fellBack,
        });
        toast.success("Fresh briefing");
      } else {
        toast.warning("Briefing regenerated with fallback content");
      }
    } catch (err) {
      toast.error("Couldn't regenerate", {
        description: err instanceof Error ? err.message : "Try again in a moment",
      });
    } finally {
      setRefreshing(false);
    }
  }

  const briefing = state.kind === "loading" ? null : state.briefing;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Aurora shimmer ring — passes every 8s */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-[28px]"
        style={{
          background:
            "linear-gradient(120deg, transparent 30%, rgba(167,136,255,0.45) 50%, transparent 70%)",
          backgroundSize: "300% 100%",
        }}
        animate={{ backgroundPosition: ["-100% 0%", "200% 0%"] }}
        transition={{
          duration: 8,
          ease: "easeInOut",
          repeat: Infinity,
          repeatDelay: 0,
        }}
      />

      <div
        className="glass-strong relative overflow-hidden rounded-[28px] p-6 md:p-8"
        style={{
          boxShadow:
            "0 0 0 1px rgba(167,136,255,0.30), 0 30px 60px -24px rgba(91,141,255,0.30)",
        }}
      >
        {/* Background mesh */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 10% 50%, rgba(167,136,255,0.22), transparent 60%), radial-gradient(ellipse 50% 60% at 90% 80%, rgba(91,141,255,0.18), transparent 60%)",
          }}
        />

        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-[140px_1fr] md:items-start">
          {/* LEFT — AI orb */}
          <div className="flex items-center justify-center md:justify-start">
            <AiOrb size={120} intensity={refreshing || state.kind === "loading" ? 0.85 : 0.5} />
          </div>

          {/* RIGHT — content */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                Today&apos;s briefing
                {state.kind === "ready" && state.cached && (
                  <span className="ml-2 text-text-dim/70">· cached</span>
                )}
                {state.kind === "ready" && state.fellBack && (
                  <span className="ml-2 text-aurora-peach">· fallback</span>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    disabled={refreshing}
                    aria-label="Regenerate briefing"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border-soft bg-surface/70 text-text-muted transition-all hover:border-aurora-purple/45 hover:text-text disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">
                  Regenerate briefing {isAdmin ? "(free for you)" : `(✦ ${REFRESH_COST})`}
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="mt-3 space-y-3 text-text">
              {state.kind === "loading" ? (
                <ParagraphSkeletons />
              ) : (
                <>
                  <p className="font-serif text-lg italic leading-relaxed md:text-xl">
                    {briefing!.paragraphs[0]}
                  </p>
                  <p className="text-sm leading-relaxed text-text">
                    {briefing!.paragraphs[1]}
                  </p>
                  <p className="text-sm leading-relaxed text-text">
                    {briefing!.paragraphs[2]}
                  </p>
                </>
              )}
            </div>

            {briefing && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="mt-5 flex flex-wrap gap-2"
              >
                {briefing.chips.map((chip, i) => (
                  <BriefingChipPill key={`${chip.label}-${i}`} chip={chip} />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Lightweight inline confirmation popover */}
      {confirming && (
        <ConfirmRegenerate
          cost={REFRESH_COST}
          isAdmin={isAdmin}
          onCancel={() => setConfirming(false)}
          onConfirm={regenerate}
        />
      )}
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */

function ParagraphSkeletons() {
  return (
    <div className="space-y-3">
      <div className="shimmer-bg h-5 w-5/6 rounded-full bg-surface-elevated" />
      <div className="shimmer-bg h-4 w-full rounded-full bg-surface-elevated" />
      <div className="shimmer-bg h-4 w-3/4 rounded-full bg-surface-elevated" />
    </div>
  );
}

function ConfirmRegenerate({
  cost,
  isAdmin,
  onCancel,
  onConfirm,
}: {
  cost: number;
  isAdmin: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong absolute right-4 top-16 z-20 w-72 rounded-2xl p-4"
      style={{
        boxShadow:
          "0 0 0 1px rgba(167,136,255,0.40), 0 24px 48px -16px rgba(91,141,255,0.45)",
      }}
    >
      <div className="text-sm font-medium text-text">Regenerate today&apos;s briefing?</div>
      <p className="mt-1 text-xs text-text-muted">
        Burns one Gemini call. {isAdmin ? "Free for you." : `Costs ✦ ${cost}.`}
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-3 py-1 text-xs text-text-muted hover:text-text"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-full px-3 py-1 text-xs font-medium text-white"
          style={{
            background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
          }}
        >
          Regenerate
        </button>
      </div>
    </motion.div>
  );
}
