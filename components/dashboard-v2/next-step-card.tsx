"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useProductStore } from "@/lib/store/products";
import { useCreditsStore } from "@/lib/store/credits";
import { userProducts, scansThisWeek } from "@/lib/dashboard/momentum";
import {
  recommendNextStep,
  type NextStep,
} from "@/lib/dashboard/next-step";

const DISMISS_KEY = "wynner.dashboard.nextstep.dismissedDay";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * Closing "do this next" card. Picks a single recommendation tailored to
 * the user's state (no scans → first scan, lots of favorites but no
 * compares → comparison, approaching credit cap → top-up, etc).
 *
 * Dismissable for the day; never blocks the layout.
 */
export function NextStepCard() {
  // Stable selector + memoized filter (see greeting-bar.tsx for the
  // rationale). Returning userProducts(s.products) directly churns refs.
  const allProducts = useProductStore((s) => s.products);
  const products = useMemo(() => userProducts(allProducts), [allProducts]);
  const favorites = useProductStore((s) => s.favorites);
  // Object-literal selectors create a new ref each render → infinite loop.
  // Pull each primitive separately and assemble in render.
  const balance = useCreditsStore((s) => s.balance);
  const monthlyAllowance = useCreditsStore((s) => s.monthlyAllowance);
  const plan = useCreditsStore((s) => s.plan);
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  const credit = useMemo(
    () => ({ balance, monthlyAllowance, plan, isAdmin }),
    [balance, monthlyAllowance, plan, isAdmin],
  );

  const [dismissedToday, setDismissedToday] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(DISMISS_KEY);
    const next = stored === todayKey();
    // Defer the setState out of the effect body (React 19 strict mode).
    const t = window.setTimeout(() => setDismissedToday(next), 0);
    return () => window.clearTimeout(t);
  }, []);

  if (dismissedToday) return null;

  const scanCount = products.length;
  const favoriteCount = favorites.size;
  // Heuristic: if any compared link exists in URL history, count it. We don't
  // track compares server-side yet, so we use "user has 2+ favorites" as a
  // weak proxy for "has tried comparing".
  const hasCompared = favoriteCount >= 2 && products.length >= 3;
  const hasUsedDeepResearch = false; // no event log for this yet — leave false
  const weekly = scansThisWeek(products);

  const step: NextStep = recommendNextStep({
    scanCount,
    favoriteCount,
    hasCompared,
    hasUsedDeepResearch,
    weeklyScans: weekly,
    credit,
  });

  const IconComponent =
    ((Lucide as unknown as Record<string, React.ElementType>)[step.icon] as React.ElementType) ??
    Lucide.Sparkles;

  function dismiss() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DISMISS_KEY, todayKey());
    setDismissedToday(true);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="glass-strong relative overflow-hidden rounded-3xl p-6 md:p-7"
        style={{
          boxShadow: `0 0 0 1px ${step.accent}40, 0 24px 60px -20px ${step.accent}55`,
        }}
      >
        {/* Soft accent glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(ellipse 40% 80% at 0% 50%, ${step.accent}26, transparent 60%)`,
          }}
        />

        <div className="relative flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: `${step.accent}1A`,
                color: step.accent,
                border: `1px solid ${step.accent}55`,
              }}
            >
              <IconComponent className="h-5 w-5" />
            </span>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                Do this next
              </div>
              <h3 className="mt-1 font-serif text-2xl text-text">
                {step.headline}
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-muted">
                {step.subhead}
              </p>
            </div>
          </div>
          <Link
            href={step.href}
            className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-white shadow-[0_12px_28px_-8px_rgba(91,141,255,0.55)] transition-all hover:brightness-110"
            style={{
              background: `linear-gradient(135deg, ${step.accent}, ${step.accent}AA)`,
            }}
          >
            {step.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="absolute bottom-3 right-4 text-[11px] text-text-dim underline-offset-2 hover:text-text-muted hover:underline"
        >
          Dismiss for today
        </button>
      </div>
    </motion.section>
  );
}
