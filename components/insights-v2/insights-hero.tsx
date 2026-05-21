"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Info, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ScoreNumber } from "@/components/animated/score-number";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LEVEL_TIER_META,
  type OperatorLevelBreakdown,
  type ProfileTag,
} from "@/types/insights";
import { cn } from "@/lib/utils";

type Props = {
  level: OperatorLevelBreakdown;
  tags: ProfileTag[];
  tagsLoading: boolean;
  hasEnoughData: boolean;
};

/**
 * The opening of the page — operator level + 4 self-portrait tags.
 * Aurora-mesh background, breathing softly. Two-col on desktop, stacked on mobile.
 */
export function InsightsHero({ level, tags, tagsLoading, hasEnoughData }: Props) {
  const reduce = useReducedMotion();
  const tierMeta = LEVEL_TIER_META[level.tier];
  const positive = level.deltaWeek >= 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl glass p-6 md:p-8"
    >
      {/* Breathing aurora mesh */}
      <div
        className="pointer-events-none absolute inset-0 aurora-mesh opacity-[0.5]"
        aria-hidden
      >
        <span />
        <span />
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-[1.5fr_1fr]">
        {/* LEFT — Hero text + tags */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/70 px-3 py-1 text-xs text-text-muted backdrop-blur-sm">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              }}
            />
            The insights hub
          </div>
          <h1 className="mt-4 font-serif text-3xl tracking-tight text-text md:text-4xl">
            Your operator profile
          </h1>
          <p className="mt-2 max-w-md text-sm text-text-muted">
            How you scan, what you favor, where you win.
          </p>

          {/* Profile tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {tagsLoading ? (
              <TagsSkeleton />
            ) : tags.length === 0 ? (
              <p className="text-xs text-text-dim">
                {hasEnoughData
                  ? "Your tags are coming together…"
                  : "Score a few products to reveal your self-portrait."}
              </p>
            ) : (
              tags.map((tag, i) => (
                <motion.span
                  key={`${tag.kind}-${tag.label}`}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.08 * i,
                    duration: 0.32,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface/80 px-3 py-1 text-xs text-text backdrop-blur-sm"
                >
                  {tag.emoji && <span aria-hidden>{tag.emoji}</span>}
                  <span className="font-medium">{tag.label}</span>
                </motion.span>
              ))
            )}
          </div>
        </div>

        {/* RIGHT — Operator level */}
        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Operator level
          </div>
          <div className="relative">
            <ScoreNumber
              value={hasEnoughData ? level.level : 0}
              className="font-serif text-7xl leading-none text-text md:text-8xl"
            />
            {/* Soft glow under the number */}
            <div
              className={cn(
                "pointer-events-none absolute -inset-2 -z-10 rounded-full blur-2xl",
                reduce ? "" : "animate-pulse",
              )}
              style={{
                background: `radial-gradient(closest-side, ${tierMeta.color}45, transparent 65%)`,
              }}
              aria-hidden
            />
          </div>
          {hasEnoughData ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
                    style={{
                      color: tierMeta.color,
                      backgroundColor: `${tierMeta.color}1F`,
                      border: `1px solid ${tierMeta.color}55`,
                    }}
                  >
                    {tierMeta.label}
                    <Info className="h-3 w-3 opacity-70" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-xs">
                  <p className="mb-1.5 font-medium text-text">
                    {tierMeta.label}
                  </p>
                  <p className="text-text-muted">{tierMeta.description}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-[10px]">
                    <Component label="Volume" value={level.components.volume} />
                    <Component label="Diversity" value={level.components.diversity} />
                    <Component label="Deep scans" value={level.components.sophistication} />
                    <Component label="Action" value={level.components.action} />
                    <Component label="Recency" value={level.components.recency} />
                    <Component label="Engagement" value={level.components.engagement} />
                  </div>
                </TooltipContent>
              </Tooltip>
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs",
                  positive ? "text-go" : "text-skip",
                )}
              >
                {positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="font-mono">
                  {positive ? "+" : ""}
                  {level.deltaWeek} since last week
                </span>
              </div>
            </>
          ) : (
            <p className="max-w-[200px] text-right text-xs text-text-dim md:text-right">
              Not enough data yet — keep scanning.
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function Component({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-surface/60 px-1.5 py-1">
      <span className="text-text-dim">{label}</span>
      <span className="font-medium tabular-nums text-text">{value}</span>
    </div>
  );
}

function TagsSkeleton() {
  return (
    <>
      {[24, 28, 22, 26].map((w, i) => (
        <div
          key={i}
          className="h-6 rounded-full shimmer-bg bg-surface/60"
          style={{ width: `${w * 4}px` }}
        />
      ))}
    </>
  );
}

/**
 * Lightweight hook that fetches profile tags from the API. Returns
 * `loading`, `tags`, and `cached`. Throws nothing — failures fall back
 * to an empty array so the UI degrades gracefully.
 */
export function useProfileTags({
  scansHash,
  scans,
  totalScans,
  avgScore,
  winRate,
  operatorLevel,
  enabled,
}: {
  scansHash: string;
  scans: Parameters<typeof JSON.stringify>[0];
  totalScans: number;
  avgScore: number;
  winRate: number;
  operatorLevel: number;
  enabled: boolean;
}) {
  const [tags, setTags] = useState<ProfileTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);

  // Memoize the body so the fetch effect doesn't re-fire on every render.
  // cacheOnly: true means the route returns a cached row or FALLBACK_TAGS
  // — never spends a Gemini call on mount. The /insights page stays snappy.
  const body = useMemo(
    () =>
      JSON.stringify({
        scansHash,
        scans,
        totalScans,
        avgScore,
        winRate,
        operatorLevel,
        cacheOnly: true,
      }),
    [scansHash, scans, totalScans, avgScore, winRate, operatorLevel],
  );

  useEffect(() => {
    if (!enabled || !scansHash) return;
    let cancelled = false;
    const loadingTimer = setTimeout(() => setLoading(true), 0);
    void (async () => {
      try {
        const res = await fetch("/api/insights/profile-tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as {
          tags: ProfileTag[];
          cached: boolean;
        };
        if (cancelled) return;
        setTags(data.tags ?? []);
        setCached(data.cached);
      } catch {
        if (!cancelled) setTags([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(loadingTimer);
    };
  }, [body, enabled, scansHash]);

  return { tags, loading, cached };
}
