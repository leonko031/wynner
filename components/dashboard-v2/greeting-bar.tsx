"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/lib/auth/use-user";
import { useProductStore } from "@/lib/store/products";
import { MarketVibePill } from "./market-vibe-pill";

type ActivityRange = "first" | "today" | "yesterday" | "week" | "stale";

/**
 * Returns a time-of-day-aware greeting line + a contextual sub-line based
 * on how active the user has been recently.
 */
function timeOfDayLine(): "morning" | "afternoon" | "evening" | "midnight" {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "midnight";
}

function activityRange(
  products: { createdAt: string }[],
): { range: ActivityRange; lastDayCount: number; weeklyCount: number; daysSince: number } {
  if (products.length === 0) {
    return { range: "first", lastDayCount: 0, weeklyCount: 0, daysSince: Infinity };
  }
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const lastCreated = Math.max(...products.map((p) => new Date(p.createdAt).getTime()));
  const daysSince = Math.floor((now - lastCreated) / day);
  const lastDayCount = products.filter((p) => now - new Date(p.createdAt).getTime() < day).length;
  const weeklyCount = products.filter((p) => now - new Date(p.createdAt).getTime() < 7 * day).length;

  if (daysSince === 0) return { range: "today", lastDayCount, weeklyCount, daysSince };
  if (daysSince === 1) return { range: "yesterday", lastDayCount, weeklyCount, daysSince };
  if (daysSince <= 7) return { range: "week", lastDayCount, weeklyCount, daysSince };
  return { range: "stale", lastDayCount, weeklyCount, daysSince };
}

export function GreetingBar() {
  const { profile, user } = useUser();
  // Products are local-only for now — they're how we infer "activity".
  // Skip the 120 seed products; we only count user-added items.
  //
  // Important: select the raw array (stable reference) and filter in a
  // useMemo. Returning a fresh filter() result from the selector triggers
  // Zustand's "snapshot changed" check on every render → infinite loop.
  const allProducts = useProductStore((s) => s.products);
  const products = useMemo(
    () => allProducts.filter((p) => !p.id.startsWith("seed-")),
    [allProducts],
  );

  const firstName = useMemo(() => {
    const dn = (profile?.display_name ?? "").trim();
    if (dn) return dn.split(/\s+/)[0]!;
    const emailLocal = user?.email?.split("@")[0];
    return (emailLocal ?? "there").replace(/[._-]+/g, " ").split(/\s+/)[0]!;
  }, [profile, user]);

  const tod = timeOfDayLine();
  const { range, lastDayCount } = activityRange(products);

  const greeting = useMemo(() => {
    switch (tod) {
      case "morning":
        return `Good morning, ${firstName}`;
      case "afternoon":
        return `Good afternoon, ${firstName}`;
      case "evening":
        return `Good evening, ${firstName}`;
      case "midnight":
        return `Burning the midnight oil, ${firstName}?`;
    }
  }, [tod, firstName]);

  const subline = useMemo(() => {
    switch (range) {
      case "first":
        return "Let's score your first product";
      case "today":
        return lastDayCount > 0
          ? `You scored ${lastDayCount} product${lastDayCount === 1 ? "" : "s"} today — keep the momentum going`
          : "Welcome back — let's check in on your market";
      case "yesterday":
        return lastDayCount > 0
          ? `You scored ${lastDayCount} product${lastDayCount === 1 ? "" : "s"} yesterday — let's keep it going`
          : "Welcome back — pick up where you left off";
      case "week":
        return "Welcome back — new market signals waiting";
      case "stale":
        return "It's been a while. Here's what changed.";
    }
  }, [range, lastDayCount]);

  // Condense the bar after a short scroll for a less-busy feel.
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 120], [0, -8]);
  const headerScale = useTransform(scrollY, [0, 120], [1, 0.95]);
  const [isCondensed, setIsCondensed] = useState(false);
  useEffect(() => {
    // Defer the setState through a microtask so the scroll listener doesn't
    // trip React 19's set-state-in-effect rule.
    const u = scrollY.on("change", (y) => {
      const next = y > 120;
      window.setTimeout(() => setIsCondensed(next), 0);
    });
    return () => u();
  }, [scrollY]);

  return (
    <motion.div
      style={{ y: headerY, scale: headerScale, transformOrigin: "left center" }}
      className="sticky top-14 z-30"
    >
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          layout
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`glass-flat flex flex-wrap items-center justify-between gap-3 border-b border-border-soft px-5 transition-all ${isCondensed ? "py-2" : "py-4"}`}
        >
          <div className="min-w-[200px] flex-1">
            <motion.h1
              layout
              className={`font-serif tracking-tight text-text ${isCondensed ? "text-base" : "text-2xl md:text-3xl"}`}
            >
              {greeting}
            </motion.h1>
            {!isCondensed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-0.5 text-xs text-text-muted md:text-sm"
              >
                {subline}
              </motion.p>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <MarketVibePill />
            <Link
              href="/scan"
              className="group inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-medium text-white shadow-[0_10px_28px_-8px_rgba(91,141,255,0.55)] transition-all hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Start new scan
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
