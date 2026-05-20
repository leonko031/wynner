"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useCreditsStore } from "@/lib/store/credits";
import {
  BRIEF_EVENT,
  type BriefEventDetail,
} from "./strategic-brief-card";

/**
 * Admin-only diagnostics card for /insights. Tracks how many times the
 * strategic brief has been generated this session vs hit from cache, and
 * a rough latency. Listens for the BRIEF_EVENT custom event emitted by
 * the brief card.
 */
export function InsightsAdminDiagnostics() {
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  const [stats, setStats] = useState({
    fresh: 0,
    hits: 0,
    lastMs: 0,
  });

  useEffect(() => {
    if (!isAdmin) return;
    function handler(e: Event) {
      const detail = (e as CustomEvent<BriefEventDetail>).detail;
      setStats((s) => ({
        fresh: s.fresh + (detail.cached ? 0 : 1),
        hits: s.hits + (detail.cached ? 1 : 0),
        lastMs: detail.ms,
      }));
    }
    window.addEventListener(BRIEF_EVENT, handler);
    return () => window.removeEventListener(BRIEF_EVENT, handler);
  }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-aurora-purple/30 bg-aurora-purple/5 p-4 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2">
        <Shield className="h-3.5 w-3.5 text-aurora-purple" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-aurora-purple">
          Admin diagnostics
        </span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-3 font-mono text-xs">
        <Stat label="Brief hits" value={stats.hits} />
        <Stat label="Fresh calls" value={stats.fresh} />
        <Stat label="Last latency" value={`${stats.lastMs}ms`} />
      </div>
      <p className="mt-2 text-[10px] text-text-muted">
        Free regeneration enabled. All strengths/blindspots calls free.
      </p>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-text-dim">
        {label}
      </div>
      <div className="mt-0.5 text-text">{value}</div>
    </div>
  );
}
