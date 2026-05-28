"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { GlobalCanvas } from "@/components/dashboard-v3/global-canvas";
import { CinematicOpening } from "@/components/dashboard-v3/cinematic-opening";
import { DailyBrief, type Signal } from "@/components/dashboard-v3/daily-brief";
import { PicksGallery } from "@/components/dashboard-v3/picks-gallery";
import { OperatorPulse, nicheIconName, countryName } from "@/components/dashboard-v3/operator-pulse";
import { IntelligenceTrail } from "@/components/dashboard-v3/intelligence-trail";
import { NextMove } from "@/components/dashboard-v3/next-move";
import { AdminPill } from "@/components/dashboard-v3/admin-pill";
import { useUser } from "@/lib/auth/use-user";
import { useProductStore } from "@/lib/store/products";
import { useCreditsStore } from "@/lib/store/credits";
import { dailyBriefingSchema, type DailyBriefing } from "@/types/briefing";
import {
  bestNiche,
  lastSevenDayKeys,
  dailyScanMap,
  scansThisWeek,
  scansLastWeek,
  streakDays,
  userProducts,
  verdictBreakdown30d,
} from "@/lib/dashboard/momentum";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { Niche, Product } from "@/types";
import { FLASH_MODEL } from "@/lib/ai/gemini";

const SECTION_IDS = {
  briefing: "dashboard-briefing",
  picks: "dashboard-picks",
  pulse: "dashboard-pulse",
  trail: "dashboard-trail",
  next: "dashboard-next-move",
} as const;

export default function DashboardPage() {
  const { profile, user, configured } = useUser();
  const firstName = useMemo(
    () =>
      (profile?.display_name ?? user?.email?.split("@")[0] ?? "there")
        .trim()
        .split(/\s+/)[0] ?? "there",
    [profile?.display_name, user?.email],
  );
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  const balance = useCreditsStore((s) => s.balance);
  const spend = useCreditsStore((s) => s.spend);
  const allProducts = useProductStore((s) => s.products);
  const products = useMemo(() => userProducts(allProducts), [allProducts]);

  // -------------------------------------------------------------------------
  // Initial-load curtain
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Admin preview toggle — let admins see the empty-state composition.
  // -------------------------------------------------------------------------
  const [emptyStatePreview, setEmptyStatePreview] = useState(false);
  const effectiveProducts = useMemo(
    () => (emptyStatePreview ? [] : products),
    [emptyStatePreview, products],
  );
  const effectiveScannedAll = useMemo(
    () => (emptyStatePreview ? [] : allProducts),
    [emptyStatePreview, allProducts],
  );

  // -------------------------------------------------------------------------
  // Briefing — fetch on mount, expose regenerate
  // -------------------------------------------------------------------------
  const [briefingState, setBriefingState] = useState<{
    briefing: DailyBriefing | null;
    loading: boolean;
    cached: boolean;
    fellBack: boolean;
    generatedAt: string | null;
    /** Char count + ms used by the admin pill. */
    chars: number;
    ms: number;
  }>({
    briefing: null,
    loading: true,
    cached: false,
    fellBack: false,
    generatedAt: null,
    chars: 0,
    ms: 0,
  });

  const fetchBriefing = useCallback(
    async (regenerate: boolean) => {
      const started = Date.now();
      setBriefingState((s) => ({ ...s, loading: true }));
      try {
        const res = await fetch("/api/dashboard/briefing", {
          method: regenerate ? "POST" : "GET",
          cache: "no-store",
          headers: regenerate ? { "Content-Type": "application/json" } : undefined,
          body: regenerate ? JSON.stringify({ regenerate: true }) : undefined,
        });
        const data = (await res.json()) as {
          briefing: DailyBriefing;
          cached: boolean;
          fellBack: boolean;
        };
        const parsed = dailyBriefingSchema.safeParse(data.briefing);
        const ms = Date.now() - started;
        if (parsed.success) {
          const chars = parsed.data.paragraphs.join("").length;
          setBriefingState({
            briefing: parsed.data,
            loading: false,
            cached: data.cached,
            fellBack: data.fellBack,
            generatedAt: new Date().toISOString(),
            chars,
            ms,
          });
        } else {
          setBriefingState((s) => ({
            ...s,
            loading: false,
            fellBack: true,
            ms,
          }));
        }
      } catch {
        setBriefingState((s) => ({ ...s, loading: false, fellBack: true }));
      }
    },
    [],
  );

  useEffect(() => {
    // Defer the entire trigger one tick so the initial setState in
    // fetchBriefing doesn't fire synchronously inside the effect body
    // (React 19 strict-purity rule).
    if (!configured || !user) {
      const t = setTimeout(() => {
        setBriefingState({
          briefing: null,
          loading: false,
          cached: false,
          fellBack: true,
          generatedAt: null,
          chars: 0,
          ms: 0,
        });
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      void fetchBriefing(false);
    }, 0);
    return () => clearTimeout(t);
  }, [configured, user, fetchBriefing]);

  async function regenerateBriefing(): Promise<void> {
    if (!isAdmin) {
      const result = spend("re_score", {
        cost: 1,
        description: "Briefing regenerated",
      });
      if (!result.success) {
        toast.error("Not enough credits");
        return;
      }
    }
    await fetchBriefing(true);
    toast.success("Fresh briefing");
  }

  // -------------------------------------------------------------------------
  // Today's top pick — highest-scoring user product, or top platform pick.
  // -------------------------------------------------------------------------
  const topPick: Product | null = useMemo(() => {
    if (effectiveProducts.length === 0) {
      // Pull from seed (top platform pick) as a fallback so the first fold
      // still has visual presence on a fresh account.
      const seedTop = [...effectiveScannedAll]
        .sort((a, b) => b.sellScore - a.sellScore)[0];
      return seedTop ?? null;
    }
    return [...effectiveProducts].sort((a, b) => b.sellScore - a.sellScore)[0];
  }, [effectiveProducts, effectiveScannedAll]);

  // -------------------------------------------------------------------------
  // Picks for the gallery — top 10 with seed fallback.
  // -------------------------------------------------------------------------
  const picks: Product[] = useMemo(() => {
    const pool = effectiveProducts.length > 0 ? effectiveProducts : effectiveScannedAll;
    return [...pool].sort((a, b) => b.sellScore - a.sellScore).slice(0, 10);
  }, [effectiveProducts, effectiveScannedAll]);

  // -------------------------------------------------------------------------
  // Operator pulse data
  // -------------------------------------------------------------------------
  const totalScans = effectiveProducts.length;
  const verdict = useMemo(() => verdictBreakdown30d(effectiveProducts), [effectiveProducts]);
  const streak = useMemo(() => streakDays(effectiveProducts), [effectiveProducts]);
  const week = useMemo(() => scansThisWeek(effectiveProducts), [effectiveProducts]);
  const prevWeek = useMemo(() => scansLastWeek(effectiveProducts), [effectiveProducts]);
  const weeklyDelta = useMemo(() => {
    if (prevWeek === 0) return null;
    return Math.round(((week - prevWeek) / prevWeek) * 100);
  }, [week, prevWeek]);
  const scanSeries = useMemo(() => {
    const map = dailyScanMap(effectiveProducts);
    return lastSevenDayKeys().map((k) => map.get(k) ?? 0);
  }, [effectiveProducts]);
  const last7Filled = scanSeries.map((n) => n > 0);
  const bestN = useMemo(() => bestNiche(effectiveProducts), [effectiveProducts]);
  const bestC = useMemo(() => {
    const counts = new Map<string, { total: number; sum: number; wins: number }>();
    for (const p of effectiveProducts) {
      const e = counts.get(p.targetCountry) ?? { total: 0, sum: 0, wins: 0 };
      e.total += 1;
      e.sum += p.sellScore;
      if (p.verdict === "go" || p.verdict === "test") e.wins += 1;
      counts.set(p.targetCountry, e);
    }
    let best: { code: string; avg: number; total: number; wins: number } | null = null;
    for (const [code, e] of counts) {
      const avg = e.sum / e.total;
      if (!best || avg > best.avg) best = { code, avg, total: e.total, wins: e.wins };
    }
    return best;
  }, [effectiveProducts]);

  const featured = useMemo(
    () => ({
      value: totalScans,
      label: "Scans · last 30 days",
      trend: scanSeries,
      deltaPct: weeklyDelta,
      drillUrl: "/insights",
    }),
    [totalScans, scanSeries, weeklyDelta],
  );
  const streakProps = useMemo(
    () => ({
      days: streak,
      last7: last7Filled,
      encouragement:
        streak === 0
          ? "Today's a great day to start one."
          : streak >= 7
            ? "Streak record territory."
            : `${7 - (streak % 7)} more days for +5 credits!`,
    }),
    [streak, last7Filled],
  );
  const winRateProps = useMemo(
    () => ({
      pct: verdict.winRatePct,
      total: verdict.total,
      drillUrl: "/insights",
    }),
    [verdict.winRatePct, verdict.total],
  );
  const topNicheProps = useMemo(() => {
    if (!bestN) return null;
    return {
      label: bestN.label,
      icon: nicheIconName(bestN.niche as Niche),
      color: bestN.color,
      avgScore: bestN.avgScore,
      trend: bestN.trend,
      drillUrl: `/scan?niche=${bestN.niche}`,
    };
  }, [bestN]);
  const bestCountryProps = useMemo(() => {
    if (!bestC) return null;
    const country = COUNTRIES[bestC.code];
    return {
      flag: country?.flag ?? "🌐",
      name: countryName(bestC.code),
      avgScore: Math.round(bestC.avg),
      wins: bestC.wins,
      drillUrl: `/scan?country=${bestC.code}`,
    };
  }, [bestC]);

  // -------------------------------------------------------------------------
  // Live signal feed — generates from product activity + market vibes.
  // -------------------------------------------------------------------------
  const marketVibe = useMemo<"hot" | "active" | "steady" | "quiet">(() => {
    const sample = picks.slice(0, 8);
    if (sample.length === 0) return "quiet";
    const avg = sample.reduce((s, p) => s + p.sellScore, 0) / sample.length;
    if (avg >= 78) return "hot";
    if (avg >= 70) return "active";
    if (avg >= 60) return "steady";
    return "quiet";
  }, [picks]);

  const signals = useSignalFeed({ products: effectiveProducts });

  // -------------------------------------------------------------------------
  // Keyboard shortcuts (Space, 1-5, B, N, ?)
  // -------------------------------------------------------------------------
  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Space from the very top scrolls past the first fold (one-shot).
      // ArrowDown is NOT intercepted — that key needs to behave like a
      // normal scroll so users can read the page without being teleported.
      if (e.key === " " && window.scrollY < 40) {
        e.preventDefault();
        scrollToId(SECTION_IDS.briefing);
        return;
      }

      // Bare number keys 1-5 jump to sections — only when shift is held so
      // they don't fire while the user is reading or interacting.
      if (e.shiftKey) {
        const sectionMap: Record<string, string> = {
          "1": SECTION_IDS.briefing,
          "2": SECTION_IDS.picks,
          "3": SECTION_IDS.pulse,
          "4": SECTION_IDS.trail,
          "5": SECTION_IDS.next,
        };
        if (sectionMap[e.key]) {
          e.preventDefault();
          scrollToId(sectionMap[e.key]);
          return;
        }
      }

      // B and N spend credits / navigate away — require Shift so a stray
      // keypress never costs a credit or yanks the user off the page.
      if (!e.shiftKey) return;
      const k = e.key.toLowerCase();
      if (k === "b") {
        e.preventDefault();
        void regenerateBriefing();
        return;
      }
      if (k === "n") {
        e.preventDefault();
        const rec = briefingState.briefing?.recommendation;
        if (rec) {
          const href =
            rec.actionType === "scan"
              ? "/scan"
              : rec.actionType === "deepResearch"
                ? "/scan?mode=deep"
                : "/compare";
          window.location.href = href;
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // briefingState dependency must include recommendation so N goes to the
    // right place after a regenerate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefingState.briefing?.recommendation, scrollToId]);

  // -------------------------------------------------------------------------
  // Welcome toast (once per session)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const seen = window.sessionStorage.getItem("wynner.dashboard.v3.welcomed");
    if (seen) return;
    window.sessionStorage.setItem("wynner.dashboard.v3.welcomed", "1");
    const t = window.setTimeout(() => {
      toast("Press Shift+1..5 to jump · Shift+B refreshes the briefing", {
        description: "Space scrolls past the cover.",
      });
    }, 1400);
    return () => window.clearTimeout(t);
  }, []);

  // -------------------------------------------------------------------------
  // Hero metadata — derived in an effect because `Date.now()` is impure for
  // render (React 19 strict-purity rule).
  // -------------------------------------------------------------------------
  const [heroMetadata, setHeroMetadata] = useState<{
    minRead: number;
    newSignals: number;
    hoursSinceLastScan: number | null;
  }>({ minRead: 5, newSignals: 3, hoursSinceLastScan: null });
  useEffect(() => {
    const t = setTimeout(() => {
      const lastScanMs = effectiveProducts.reduce(
        (m, p) => Math.max(m, new Date(p.createdAt).getTime()),
        0,
      );
      const hoursSinceLastScan =
        lastScanMs > 0
          ? Math.max(0, Math.floor((Date.now() - lastScanMs) / 3_600_000))
          : null;
      setHeroMetadata({ minRead: 5, newSignals: 3, hoursSinceLastScan });
    }, 0);
    return () => clearTimeout(t);
  }, [effectiveProducts]);

  const hook = briefingState.briefing?.openingHook
    ?? "A steady morning. Worth a deliberate pass.";

  const editorialTitle =
    briefingState.briefing?.editorialTitle ?? "Today's curation";
  const pickOnePitch = briefingState.briefing?.paragraphs?.[1];

  return (
    <>
      <GlobalCanvas />

      <main className="relative isolate text-text">
        <CinematicOpening
          firstName={firstName}
          topPick={topPick}
          hook={hook}
          hookLoading={briefingState.loading}
          metadata={heroMetadata}
          scrollTargetId={SECTION_IDS.briefing}
        />

        <div className="space-y-10 md:space-y-12">
          <DailyBrief
            briefing={briefingState.briefing}
            loading={briefingState.loading}
            cached={briefingState.cached}
            fellBack={briefingState.fellBack}
            generatedAt={briefingState.generatedAt}
            isAdmin={isAdmin}
            canAfford={balance >= 1}
            onRegenerate={regenerateBriefing}
            marketVibe={marketVibe}
            signals={signals}
            sectionId={SECTION_IDS.briefing}
          />

          <SectionDivider />

          <PicksGallery
            picks={picks}
            editorialTitle={editorialTitle}
            sectionId={SECTION_IDS.picks}
            pickOnePitch={pickOnePitch}
          />

          <SectionDivider />

          <OperatorPulse
            featured={featured}
            streak={streakProps}
            winRate={winRateProps}
            topNiche={topNicheProps}
            bestCountry={bestCountryProps}
            sectionId={SECTION_IDS.pulse}
          />

          <SectionDivider />

          <IntelligenceTrail sectionId={SECTION_IDS.trail} />

          <SectionDivider />

          <NextMove
            recommendation={briefingState.briefing?.recommendation ?? null}
            loading={briefingState.loading}
            sectionId={SECTION_IDS.next}
          />
        </div>

        <EditorialFooter
          generatedAt={briefingState.generatedAt}
          onRefresh={regenerateBriefing}
        />
      </main>

      <AdminPill
        onForceRefresh={() => fetchBriefing(true)}
        onTogglePreview={setEmptyStatePreview}
        previewActive={emptyStatePreview}
        lastBriefChars={briefingState.chars}
        lastBriefMs={briefingState.ms}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Quiet section divider — hairline rule, contained inside the page gutter.    */
/* -------------------------------------------------------------------------- */

function SectionDivider() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-5 md:px-8"
      aria-hidden="true"
    >
      <div className="h-px w-full bg-border-soft/60" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Live signal feed hook                                                       */
/* -------------------------------------------------------------------------- */

function useSignalFeed({ products }: { products: Product[] }): Signal[] {
  const [signals, setSignals] = useState<Signal[]>(() => seedSignals(products));
  const tickRef = useRef(0);

  useEffect(() => {
    // Refresh seed when the product set changes. We track length specifically
    // so add/remove/score-change all retrigger without churning identity refs.
    const t = setTimeout(() => {
      setSignals(seedSignals(products));
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  useEffect(() => {
    function push() {
      tickRef.current += 1;
      const next = makeSyntheticSignal(tickRef.current);
      setSignals((cur) => [next, ...cur].slice(0, 6));
    }
    // Schedule every 8-15 seconds.
    const id = window.setInterval(push, 9000 + Math.random() * 6000);
    return () => window.clearInterval(id);
  }, []);

  return signals;
}

function seedSignals(products: Product[]): Signal[] {
  const recent = [...products]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);
  const out: Signal[] = [];
  for (const p of recent) {
    const niche = NICHES[p.category]?.label ?? p.category;
    out.push({
      id: `seed-${p.id}`,
      ts: relativeTime(p.createdAt),
      message: `Scan complete · ${p.name.slice(0, 30)} scored ${p.sellScore}`,
      accent: NICHES[p.category]?.color ?? "#A788FF",
    });
    out.push({
      id: `niche-${p.id}`,
      ts: relativeTime(p.createdAt),
      message: `${niche} heat steady`,
      accent: "#5B8DFF",
    });
  }
  // Always add a market-wide ping.
  out.push({
    id: "market",
    ts: "now",
    message: "Wellness niche heat climbed 12%",
    accent: "#FFB088",
  });
  return out.slice(0, 5);
}

function makeSyntheticSignal(tick: number): Signal {
  const palette = ["#5B8DFF", "#A788FF", "#FF89C5", "#88E5C8", "#FFB088"];
  const messages = [
    "Wellness niche heat ticked up",
    "DE wellness demand widened 3%",
    "Pet niche held steady across markets",
    "Kitchen narrowed by two points",
    "Beauty signal stabilizing",
  ];
  return {
    id: `tick-${tick}`,
    ts: "now",
    message: messages[tick % messages.length],
    accent: palette[tick % palette.length],
  };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.round(hr / 24)}d`;
}

/* -------------------------------------------------------------------------- */
/* Editorial footer                                                            */
/* -------------------------------------------------------------------------- */

function EditorialFooter({
  generatedAt,
  onRefresh,
}: {
  generatedAt: string | null;
  onRefresh: () => Promise<void> | void;
}) {
  const date = generatedAt
    ? new Date(generatedAt).toLocaleDateString()
    : new Date().toLocaleDateString();
  return (
    <footer className="mx-auto w-full max-w-7xl px-5 pt-16 pb-20 md:px-8 md:pt-20 md:pb-24">
      <div
        className="rounded-3xl border border-border-soft bg-surface-elevated/90 p-6 backdrop-blur-2xl md:p-8"
        style={{ boxShadow: "0 24px 60px -24px rgba(0,0,0,0.45)" }}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                }}
              />
              Colophon
            </div>
            <p className="font-serif text-2xl font-medium leading-[1.1] tracking-[-0.01em] text-text md:text-3xl">
              Wynner edition · {date}
            </p>
            <p className="text-sm text-text-muted md:text-base">
              Composed by <span className="text-text">{FLASH_MODEL}</span>. Signals refresh every few minutes; the briefing
              regenerates on demand.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="group inline-flex items-center gap-2 self-start rounded-full px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white transition-transform hover:-translate-y-px md:self-end"
            style={{
              background:
                "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              boxShadow: "0 18px 40px -18px rgba(167,136,255,0.55)",
            }}
          >
            <span
              className="h-1 w-1 rounded-full bg-white/90"
              aria-hidden="true"
            />
            Refresh today&apos;s brief
          </button>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft/70 pt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
          <span>Shift + 1..5 jumps · Shift + B refreshes</span>
          <span className="text-text-dim/80">© Wynner</span>
        </div>
      </div>
    </footer>
  );
}

