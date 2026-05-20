"use client";

import { motion } from "framer-motion";
import { ArrowRight, EyeOff, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Sparkline } from "@/components/animated/sparkline";
import type {
  Blindspot,
  CompactScan,
  Strength,
} from "@/types/insights";

type Props = {
  scansHash: string;
  scans: CompactScan[];
  overallAvg: number;
  periodStart: string;
  periodEnd: string;
  enabled: boolean;
};

/**
 * Two-column strengths / blindspots block. Calls the AI route on mount
 * (free, cached weekly per scansHash). Gracefully degrades to a friendly
 * "keep scanning" state when the user has too few scans.
 */
export function StrengthsBlindspots({
  scansHash,
  scans,
  overallAvg,
  periodStart,
  periodEnd,
  enabled,
}: Props) {
  const body = useMemo(
    () =>
      JSON.stringify({
        scansHash,
        scans,
        overallAvg,
        periodStart,
        periodEnd,
      }),
    [scansHash, scans, overallAvg, periodStart, periodEnd],
  );
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; strengths: Strength[]; blindspots: Blindspot[]; fellBack: boolean }
  >({ kind: "loading" });

  useEffect(() => {
    if (!enabled || !scansHash) return;
    let cancelled = false;
    const loadingTimer = setTimeout(() => setState({ kind: "loading" }), 0);
    void (async () => {
      try {
        const res = await fetch("/api/insights/strengths-blindspots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as {
          strengths: Strength[];
          blindspots: Blindspot[];
          fellBack: boolean;
        };
        if (cancelled) return;
        setState({
          kind: "ready",
          strengths: data.strengths,
          blindspots: data.blindspots,
          fellBack: data.fellBack,
        });
      } catch {
        if (cancelled) return;
        setState({
          kind: "ready",
          strengths: [],
          blindspots: [],
          fellBack: true,
        });
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(loadingTimer);
    };
  }, [body, enabled, scansHash]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="glass rounded-3xl p-6"
        style={{ boxShadow: "0 16px 40px -24px rgba(61, 214, 140, 0.35)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-go/15">
            <Trophy className="h-4 w-4 text-go" />
          </div>
          <h3 className="font-serif text-xl text-text">Where you shine</h3>
        </div>
        <div className="mt-5 space-y-4">
          {state.kind === "loading"
            ? Array.from({ length: 3 }).map((_, i) => <ItemSkeleton key={i} />)
            : state.strengths.length === 0
              ? <EmptyState text="Score 5+ products to see your strengths." cta="Go scan" />
              : state.strengths.map((s, i) => (
                  <StrengthItem key={`${s.category}-${i}`} item={s} delay={i * 0.08} />
                ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="glass rounded-3xl p-6"
        style={{ boxShadow: "0 16px 40px -24px rgba(255, 176, 136, 0.4)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-aurora-peach/15">
            <EyeOff className="h-4 w-4 text-aurora-peach" />
          </div>
          <h3 className="font-serif text-xl text-text">Where you&apos;re flying blind</h3>
        </div>
        <div className="mt-5 space-y-4">
          {state.kind === "loading"
            ? Array.from({ length: 3 }).map((_, i) => <ItemSkeleton key={i} />)
            : state.blindspots.length === 0
              ? <EmptyState text="More data unlocks blindspot detection." cta="Go scan" />
              : state.blindspots.map((b, i) => (
                  <BlindspotItem key={`${b.category}-${i}`} item={b} delay={i * 0.08} />
                ))}
        </div>
      </motion.section>
    </div>
  );
}

function StrengthItem({ item, delay }: { item: Strength; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border-soft bg-surface/50 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full bg-go/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-go">
            {item.category}
          </span>
          <p className="mt-2 font-mono text-xs uppercase tracking-wider text-text-dim">
            {item.label}
          </p>
          <p className="mt-1 text-sm font-medium text-text">{item.stat}</p>
          <p className="mt-1.5 text-xs text-text-muted">{item.insight}</p>
        </div>
        {item.sparkline && item.sparkline.length > 1 && (
          <div className="h-10 w-16 shrink-0">
            <Sparkline data={item.sparkline} color="#3DD68C" height={40} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function BlindspotItem({ item, delay }: { item: Blindspot; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border-soft bg-surface/50 p-4"
    >
      <span className="inline-flex rounded-full bg-aurora-peach/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-aurora-peach">
        {item.category}
      </span>
      <p className="mt-2 font-mono text-xs uppercase tracking-wider text-text-dim">
        {item.label}
      </p>
      <p className="mt-1 text-sm font-medium text-text">{item.gap}</p>
      <p className="mt-1.5 text-xs text-text-muted">{item.insight}</p>
      {item.exploreUrl && (
        <Link
          href={item.exploreUrl}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-aurora-peach hover:text-aurora-pink"
        >
          Explore this <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </motion.div>
  );
}

function ItemSkeleton() {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface/30 p-4">
      <div className="h-3 w-20 rounded-full shimmer-bg bg-surface/60" />
      <div className="mt-3 h-2 w-32 rounded-full shimmer-bg bg-surface/60" />
      <div className="mt-2 h-3 w-48 rounded-full shimmer-bg bg-surface/60" />
      <div className="mt-2 h-2 w-44 rounded-full shimmer-bg bg-surface/60" />
    </div>
  );
}

function EmptyState({ text, cta }: { text: string; cta: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-soft p-6 text-center">
      <p className="text-sm text-text-muted">{text}</p>
      <Link
        href="/scan"
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface px-3 py-1.5 text-xs text-text hover:border-aurora-purple/55"
      >
        {cta} <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
