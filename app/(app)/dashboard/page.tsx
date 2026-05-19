"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { toast } from "sonner";
import { GreetingBar } from "@/components/dashboard-v2/greeting-bar";
import { DailyBriefingCard } from "@/components/dashboard-v2/daily-briefing-card";
import { AdminDiagnosticsCard } from "@/components/dashboard-v2/admin-diagnostics-card";
import { TopPicksCarousel } from "@/components/dashboard-v2/top-picks-carousel";
import { MomentumRow } from "@/components/dashboard-v2/momentum-row";
import { MarketPulse } from "@/components/dashboard-v2/market-pulse";
import { ActivityFeed } from "@/components/dashboard-v2/activity-feed";
import { NextStepCard } from "@/components/dashboard-v2/next-step-card";

/**
 * Wynner v2 dashboard — the user's daily command center.
 *
 * Section order is deliberate, answering four questions in sequence:
 *   1. "What's new since I last visited?"     → greeting + briefing
 *   2. "What's hot for me today?"             → top picks
 *   3. "How am I doing?"                      → momentum
 *   4. "What's the wider market saying?"      → market pulse
 *   5. "What did I just do?"                  → activity
 *   6. "What should I do next?"               → next step
 *
 * Sections stagger in by ~80ms.
 */
export default function DashboardPage() {
  // Section-jump keyboard shortcuts: B (briefing), T (top picks), M (momentum).
  // We layer onto window keydown — GlobalShortcuts already handles ⌘K / global
  // nav, and the typing-target check mirrors the one there so form inputs
  // aren't hijacked.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tgt = e.target as HTMLElement | null;
      if (
        tgt instanceof HTMLElement &&
        (tgt.tagName === "INPUT" ||
          tgt.tagName === "TEXTAREA" ||
          tgt.tagName === "SELECT" ||
          tgt.isContentEditable)
      ) {
        return;
      }
      const lower = e.key.toLowerCase();
      const map: Record<string, string> = {
        b: "dashboard-briefing",
        t: "dashboard-top-picks",
        m: "dashboard-momentum",
      };
      const targetId = map[lower];
      if (!targetId) return;
      const el = document.getElementById(targetId);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Friendly toast on first navigation here per session.
  useEffect(() => {
    const seen = window.sessionStorage.getItem("wynner.dashboard.welcomed");
    if (seen) return;
    window.sessionStorage.setItem("wynner.dashboard.welcomed", "1");
    const t = window.setTimeout(() => {
      toast("Press ? to see all keyboard shortcuts", {
        description: "B = briefing · T = top picks · M = momentum",
      });
    }, 1400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <GreetingBar />

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-7xl px-6 py-8 md:py-10"
      >
        <div className="space-y-10">
          <Stagger delay={0} id="dashboard-briefing">
            <DailyBriefingCard />
          </Stagger>

          <Stagger delay={0.08}>
            <AdminDiagnosticsCard />
          </Stagger>

          <Stagger delay={0.16}>
            <TopPicksCarousel />
          </Stagger>

          <Stagger delay={0.24}>
            <MomentumRow />
          </Stagger>

          <Stagger delay={0.32}>
            <MarketPulse />
          </Stagger>

          <Stagger delay={0.4}>
            <ActivityFeed />
          </Stagger>

          <Stagger delay={0.48}>
            <NextStepCard />
          </Stagger>
        </div>
      </motion.main>
    </>
  );
}

/** Each section gets a small staggered entrance and an optional id for the
 *  keyboard shortcuts to target. */
function Stagger({
  delay,
  id,
  children,
}: {
  delay: number;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.section>
  );
}
