"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useUser } from "@/lib/auth/use-user";
import { useProductStore } from "@/lib/store/products";
import { useCreditsStore } from "@/lib/store/credits";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import {
  actionRate as computeActionRate,
  buildAggregates,
  filterByPeriod,
} from "@/lib/insights/aggregates";
import { computeOperatorLevel } from "@/lib/insights/operator-level";
import {
  INSIGHTS_PERIODS,
  LEVEL_TIER_META,
  PERIOD_LABEL,
  computeScansHash,
  periodDays,
  type CompactScan,
  type InsightsPeriod,
  type StrategicBrief,
  type Strength,
  type Blindspot,
} from "@/types/insights";
import { InsightsHero, useProfileTags } from "@/components/insights-v2/insights-hero";
import { PeriodControl } from "@/components/insights-v2/period-control";
import { StrengthsBlindspots } from "@/components/insights-v2/strengths-blindspots";
import { ScanningRhythm } from "@/components/insights-v2/scanning-rhythm";
import { MetricGrid } from "@/components/insights-v2/metric-grid";
import { NicheCountryMatrix } from "@/components/insights-v2/niche-country-matrix";
import {
  StrategicBriefCard,
  SavedBriefs,
} from "@/components/insights-v2/strategic-brief-card";
import { DeepDive } from "@/components/insights-v2/deep-dive";
import { ComparisonHistoryRail } from "@/components/insights-v2/comparison-history-rail";
import { InsightsExportActions } from "@/components/insights-v2/export-actions";
import { InsightsAdminDiagnostics } from "@/components/insights-v2/admin-diagnostics";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Product } from "@/types";

export default function InsightsPage() {
  return (
    <Suspense fallback={null}>
      <InsightsPageInner />
    </Suspense>
  );
}

function InsightsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile, user } = useUser();
  const products = useProductStore((s) => s.products);
  const favorites = useProductStore((s) => s.favorites);
  // Read isAdmin once so the credits store stays mounted as a dependency
  // (consumed downstream via useCreditsStore in child components).
  useCreditsStore((s) => s.isAdmin);

  const [period, setPeriod] = useState<InsightsPeriod>(() => {
    const p = searchParams.get("period");
    return INSIGHTS_PERIODS.includes(p as InsightsPeriod) ? (p as InsightsPeriod) : "30d";
  });
  const [compareToPrev, setCompareToPrev] = useState(false);
  const [comparisonsCount, setComparisonsCount] = useState(0);

  // Count comparisons from Supabase (head-only count).
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u || cancelled) return;
      const { count } = await supabase
        .from("comparison_verdicts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", u.id);
      if (!cancelled) setComparisonsCount(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reflect period in the URL (shallow — no navigation).
  useEffect(() => {
    const url = new URL(window.location.href);
    if (period === "30d") url.searchParams.delete("period");
    else url.searchParams.set("period", period);
    window.history.replaceState({}, "", url);
  }, [period]);

  // ----------------------------------------------------------------------------
  // Aggregations
  // ----------------------------------------------------------------------------

  const aggregates = useMemo(() => buildAggregates(products, period), [
    products,
    period,
  ]);
  const prevAggregates = useMemo(
    () => buildAggregates(aggregates.inPrevPeriod, "all"),
    [aggregates.inPrevPeriod],
  );

  const overallAvg = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.round(
      products.reduce((s, p) => s + p.sellScore, 0) / products.length,
    );
  }, [products]);

  // Operator level computed across ALL products + statuses (not just period).
  const operatorLevel = useMemo(
    () =>
      computeOperatorLevel({
        products,
        favorites,
        comparisonsCount,
      }),
    [products, favorites, comparisonsCount],
  );

  // ----------------------------------------------------------------------------
  // Scan compaction for AI calls — uses BASE scores for cache stability.
  // ----------------------------------------------------------------------------

  const scansHashAllTime = useMemo(
    () => computeScansHash(products.map((p) => ({ id: p.id, sellScore: p.sellScore }))),
    [products],
  );
  const compactScansInPeriod: CompactScan[] = useMemo(
    () => aggregates.inPeriod.map(toCompact),
    [aggregates.inPeriod],
  );
  // Period-specific hash (drives the brief cache so a different period yields a different brief).
  const scansHashPeriod = useMemo(
    () =>
      `${period}|` +
      computeScansHash(
        aggregates.inPeriod.map((p) => ({ id: p.id, sellScore: p.sellScore })),
      ),
    [aggregates.inPeriod, period],
  );

  // ----------------------------------------------------------------------------
  // Profile tags (Gemini, free)
  // ----------------------------------------------------------------------------

  const hasEnoughDataForTags = products.length >= 3;
  const { tags, loading: tagsLoading } = useProfileTags({
    scans: products.slice(0, 60).map((p) => toCompact(p)),
    scansHash: scansHashAllTime,
    totalScans: products.length,
    avgScore: overallAvg,
    winRate:
      products.length === 0
        ? 0
        : products.filter((p) => p.verdict === "go" || p.verdict === "test")
            .length / products.length,
    operatorLevel: operatorLevel.level,
    enabled: hasEnoughDataForTags,
  });

  // ----------------------------------------------------------------------------
  // Strengths & blindspots (Gemini Flash, free) — strengths/blindspots state
  // is also tracked here so PDF export can include the latest content.
  // ----------------------------------------------------------------------------

  const [latestStrengths, setLatestStrengths] = useState<Strength[]>([]);
  const [latestBlindspots, setLatestBlindspots] = useState<Blindspot[]>([]);
  // Use the strengths-blindspots route side-effect to populate the PDF state.
  // We re-fetch here ONCE (separate from the card's own fetch) to keep PDF
  // export self-sufficient. The route caches the result so it costs nothing.
  const sbBody = useMemo(
    () =>
      JSON.stringify({
        scansHash: scansHashPeriod,
        scans: compactScansInPeriod,
        overallAvg,
        periodStart: aggregates.byDay[0]?.date ?? new Date().toISOString().slice(0, 10),
        periodEnd: new Date().toISOString().slice(0, 10),
      }),
    [scansHashPeriod, compactScansInPeriod, overallAvg, aggregates.byDay],
  );
  useEffect(() => {
    if (!isSupabaseConfigured() || compactScansInPeriod.length < 3) {
      const id = setTimeout(() => {
        setLatestStrengths([]);
        setLatestBlindspots([]);
      }, 0);
      return () => clearTimeout(id);
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/insights/strengths-blindspots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: sbBody,
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          strengths: Strength[];
          blindspots: Blindspot[];
        };
        if (cancelled) return;
        setLatestStrengths(data.strengths ?? []);
        setLatestBlindspots(data.blindspots ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sbBody, compactScansInPeriod.length]);

  // ----------------------------------------------------------------------------
  // Strategic brief state (held here so PDF can include it).
  // ----------------------------------------------------------------------------

  const [latestBrief, setLatestBrief] = useState<StrategicBrief | null>(null);

  // ----------------------------------------------------------------------------
  // Sparkline data — daily scan counts + daily avg scores across the period.
  // ----------------------------------------------------------------------------

  const scanCountsByDay = useMemo(
    () => aggregates.byDay.map((d) => d.count),
    [aggregates.byDay],
  );
  const scoresByDay = useMemo(
    () => aggregates.byDay.map((d) => d.avgScore),
    [aggregates.byDay],
  );

  // ----------------------------------------------------------------------------
  // Keyboard shortcuts (R, T, E)
  // ----------------------------------------------------------------------------

  const cyclePeriod = useCallback(() => {
    const idx = INSIGHTS_PERIODS.indexOf(period);
    const next = INSIGHTS_PERIODS[(idx + 1) % INSIGHTS_PERIODS.length];
    setPeriod(next);
    toast(`Period: ${PERIOD_LABEL[next]}`);
  }, [period]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Ignore when typing in inputs/dialogs.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // All page-level shortcuts require Shift so they never fire by accident
      // while the user is reading or scrolling. R spends credits (Gemini call),
      // T re-fetches everything, E pops a download — none of those should be
      // one-key triggerable.
      if (!e.shiftKey) return;
      const k = e.key.toLowerCase();
      if (k === "t") {
        e.preventDefault();
        cyclePeriod();
      } else if (k === "r") {
        e.preventDefault();
        const btn = Array.from(
          document.querySelectorAll<HTMLButtonElement>("button"),
        ).find((b) => /Regenerate|Generate ·/.test(b.textContent ?? ""));
        btn?.click();
      } else if (k === "e") {
        e.preventDefault();
        const btn = Array.from(
          document.querySelectorAll<HTMLButtonElement>("button"),
        ).find((b) => /Export insights as PDF/.test(b.textContent ?? ""));
        btn?.click();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cyclePeriod]);

  // ----------------------------------------------------------------------------
  // "New scan since loaded" toast — listens for storage changes (zustand
  // persist writes to localStorage, so cross-tab updates fire there).
  // ----------------------------------------------------------------------------

  const [initialCount] = useState(products.length);
  useEffect(() => {
    if (products.length <= initialCount) return;
    const id = setTimeout(() => {
      toast(
        `${products.length - initialCount} new scan since you loaded — refresh for fresh insights`,
        {
          action: {
            label: "Refresh",
            onClick: () => router.refresh(),
          },
        },
      );
    }, 0);
    return () => clearTimeout(id);
    // We want this to ONLY fire when the count grows after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  // ----------------------------------------------------------------------------
  // First name for PDF/brief
  // ----------------------------------------------------------------------------

  const firstName =
    (profile?.display_name ?? user?.email?.split("@")[0] ?? "there")
      .trim()
      .split(/\s+/)[0] ?? "there";

  // ----------------------------------------------------------------------------
  // PDF metrics + tables
  // ----------------------------------------------------------------------------

  const actionRateValue = useMemo(
    () => computeActionRate(aggregates.inPeriod, favorites),
    [aggregates.inPeriod, favorites],
  );

  const pdfMetrics = useMemo(
    () => ({
      totalScans: aggregates.totalScans,
      avgScore: aggregates.avgScore,
      winRate: aggregates.winRate,
      actionRate: actionRateValue,
      highestScore: aggregates.highestScore,
      creditsSpent: aggregates.creditsSpentEstimate,
      topNiche: aggregates.byNiche[0]?.label ?? "—",
      topCountry: aggregates.byCountry[0]?.label ?? "—",
    }),
    [aggregates, actionRateValue],
  );

  const days = periodDays(period);
  // periodStart/end depend on "now" — impure for render. We compute them in a
  // tiny effect and store as state, so the render itself stays pure (React 19
  // strict-purity rule).
  const [periodBounds, setPeriodBounds] = useState<{ start: string; end: string }>(
    () => ({
      start: "1970-01-01",
      end: "1970-01-01",
    }),
  );
  useEffect(() => {
    const id = setTimeout(() => {
      const end = new Date().toISOString().slice(0, 10);
      let start: string;
      if (days === null) {
        start = products
          .reduce(
            (m, p) => (p.createdAt < m ? p.createdAt : m),
            new Date().toISOString(),
          )
          .slice(0, 10);
      } else {
        start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
      }
      setPeriodBounds({ start, end });
    }, 0);
    return () => clearTimeout(id);
  }, [days, products]);
  const periodStart = periodBounds.start;
  const periodEnd = periodBounds.end;

  // ----------------------------------------------------------------------------
  // Empty state — under 5 scans the page shows a friendlier placeholder.
  // ----------------------------------------------------------------------------

  const hasMinimalData = products.length >= 5;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 pb-32 md:px-8 md:py-12">
      <div className="mb-8 md:mb-10">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
          Operator dashboard
        </p>
        <InsightsHero
          level={operatorLevel}
          tags={tags}
          tagsLoading={tagsLoading}
          hasEnoughData={products.length >= 5}
        />
      </div>

      <PeriodControl
        period={period}
        onChange={setPeriod}
        compareToPrev={compareToPrev}
        onCompareChange={setCompareToPrev}
      />

      {!hasMinimalData ? (
        <EmptyState />
      ) : (
        <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="space-y-4"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
              Pattern detection
            </p>
            <StrengthsBlindspots
              scansHash={scansHashPeriod}
              scans={compactScansInPeriod}
              overallAvg={overallAvg}
              periodStart={periodStart}
              periodEnd={periodEnd}
              enabled={compactScansInPeriod.length >= 3}
            />
          </motion.section>

          <section className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
              Rhythm
            </p>
            <ScanningRhythm
              byDay={aggregates.byDay}
              byHour={aggregates.byHour}
              byScoreBucket={aggregates.byScoreBucket}
            />
          </section>

          <section className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
              Metrics
            </p>
            <MetricGrid
              totalScans={aggregates.totalScans}
              prevTotalScans={prevAggregates.totalScans}
              avgScore={aggregates.avgScore}
              prevAvgScore={prevAggregates.avgScore}
              winRate={aggregates.winRate}
              prevWinRate={prevAggregates.winRate}
              creditsSpent={aggregates.creditsSpentEstimate}
              prevCreditsSpent={prevAggregates.creditsSpentEstimate}
              highestScore={aggregates.highestScore}
              prevHighestScore={prevAggregates.highestScore}
              mostScannedNiche={
                aggregates.byNiche[0]
                  ? {
                      label: aggregates.byNiche[0].label,
                      count: aggregates.byNiche[0].count,
                    }
                  : null
              }
              mostScannedCountry={
                aggregates.byCountry[0]
                  ? {
                      label: aggregates.byCountry[0].label,
                      count: aggregates.byCountry[0].count,
                    }
                  : null
              }
              actionRate={actionRateValue}
              prevActionRate={computeActionRate(
                aggregates.inPrevPeriod,
                favorites,
              )}
              scanCountsByDay={scanCountsByDay}
              scoresByDay={scoresByDay}
            />
          </section>

          <section className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
              Niche × Country
            </p>
            <NicheCountryMatrix matrix={aggregates.matrix} />
          </section>

          <section className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
              Strategic brief
            </p>
            <StrategicBriefCard
              scansHash={scansHashPeriod}
              scans={compactScansInPeriod}
              periodLabel={PERIOD_LABEL[period]}
              periodStart={periodStart}
              periodEnd={periodEnd}
              operatorLevel={operatorLevel.level}
              operatorTier={LEVEL_TIER_META[operatorLevel.tier].label}
              favoritesCount={
                favorites instanceof Set ? favorites.size : 0
              }
              comparisonsCount={comparisonsCount}
              autoLoad={true}
              totalScansAllTime={products.length}
              onRegenerated={() => {
                /* placeholder — brief reflected directly in component state */
              }}
            />
            <SavedBriefs enabled={isSupabaseConfigured()} />
          </section>

          {/* Hidden listener so latestBrief stays in sync with whatever the
              brief card most recently rendered (so PDF includes it). We hook
              into the strategic brief by inspecting the DOM cell that holds
              the portrait text — instead, just refetch the cached brief. */}
          <BriefMirror
            scansHash={scansHashPeriod}
            onLoaded={setLatestBrief}
          />

          <section className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
              Deep dive
            </p>
            <DeepDive products={aggregates.inPeriod} />
          </section>

          <ComparisonHistoryRailWrapper />

          <InsightsAdminDiagnostics />
        </div>
      )}

      <div className="mt-12 flex flex-wrap items-center justify-end gap-3">
        <InsightsExportActions
          firstName={firstName}
          periodLabel={PERIOD_LABEL[period]}
          operatorLevel={operatorLevel}
          profileTags={tags}
          brief={latestBrief}
          strengths={latestStrengths}
          blindspots={latestBlindspots}
          metrics={pdfMetrics}
          topNicheRows={aggregates.byNiche.map((r) => ({
            label: r.label,
            count: r.count,
            avgScore: r.avgScore,
          }))}
          topCountryRows={aggregates.byCountry.map((r) => ({
            label: r.label,
            count: r.count,
            avgScore: r.avgScore,
          }))}
        />
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */

function ComparisonHistoryRailWrapper() {
  return (
    <section className="space-y-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
        Comparison history
      </p>
      <ComparisonHistoryRail enabled={isSupabaseConfigured()} />
    </section>
  );
}

/**
 * Sidecar component that re-reads the cached strategic brief once on mount
 * (so the PDF export can include it without forcing the user to generate).
 * The brief card itself owns the user-facing state; this is a read-only mirror.
 */
function BriefMirror({
  scansHash,
  onLoaded,
}: {
  scansHash: string;
  onLoaded: (b: StrategicBrief | null) => void;
}) {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void (async () => {
      try {
        // Hit GET first — returns recent saved briefs, take the most recent
        // matching scansHash if any. Otherwise leave latestBrief null until
        // the user actively generates.
        const res = await fetch("/api/insights/brief", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          briefs?: Array<{
            portrait: string;
            whats_working: unknown;
            needs_attention: unknown;
            hypothesis: string;
            plan: unknown;
            scans_hash?: string;
          }>;
        };
        const candidate = data.briefs?.[0];
        if (!candidate || cancelled) {
          onLoaded(null);
          return;
        }
        const { strategicBriefSchema } = await import("@/types/insights");
        const parsed = strategicBriefSchema.safeParse({
          portrait: candidate.portrait,
          whatsWorking: candidate.whats_working,
          needsAttention: candidate.needs_attention,
          hypothesis: candidate.hypothesis,
          planForNextMonth: candidate.plan,
        });
        if (cancelled) return;
        onLoaded(parsed.success ? parsed.data : null);
      } catch {
        if (!cancelled) onLoaded(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scansHash, onLoaded]);
  return null;
}

/* -------------------------------------------------------------------------- */
/* Empty state — under 5 scans                                                 */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mt-10 rounded-3xl border border-border-soft bg-surface-elevated/90 p-10 text-center backdrop-blur-2xl md:p-12"
      style={{
        boxShadow: "0 24px 60px -24px rgba(0,0,0,0.45)",
      }}
    >
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
        Awaiting scans
      </p>
      <h2 className="font-serif text-2xl md:text-3xl font-medium tracking-[-0.01em] text-text">
        Your story is just beginning
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm md:text-base text-text-muted">
        Insights take shape after a few scans. Score 5+ products and your
        strengths, blindspots, and scanning rhythm appear here.
      </p>
      <a
        href="/scan"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-[filter] hover:brightness-110"
        style={{
          background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
          boxShadow: "0 8px 22px -6px rgba(91,141,255,0.55)",
        }}
      >
        Run your first scan
      </a>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function toCompact(p: Product): CompactScan {
  return {
    id: p.id,
    name: p.name,
    niche: p.category,
    country: p.targetCountry,
    score: p.sellScore,
    verdict: p.verdict,
    pillars: p.pillars,
    createdAt: p.createdAt,
  };
}

/* Unused but exported so tree-shaking notices the side imports. */
export { NICHES, COUNTRIES, filterByPeriod };
