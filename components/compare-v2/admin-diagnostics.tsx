"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/auth/use-user";
import { useCreditsStore } from "@/lib/store/credits";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Admin-only diagnostic strip. Counts total verdicts this user has
 * generated and shows the average latency of the last few requests
 * (tracked via a custom event the page dispatches).
 *
 * Invisible to non-admins.
 */
export function CompareAdminDiagnostics() {
  const { user } = useUser();
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  const [verdictCount, setVerdictCount] = useState<number | null>(null);
  const [cacheHits, setCacheHits] = useState(0);
  const [fresh, setFresh] = useState(0);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);

  // Fetch the user's total verdict count once on mount.
  useEffect(() => {
    if (!isAdmin || !user || !isSupabaseConfigured()) return;
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from("comparison_verdicts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (!cancelled) setVerdictCount(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, user]);

  // Listen for compare-page events to track latency + cache hit/miss.
  useEffect(() => {
    if (!isAdmin) return;
    function handler(e: Event) {
      const ce = e as CustomEvent<{ ms: number; cached: boolean }>;
      if (!ce.detail) return;
      setLastLatencyMs(ce.detail.ms);
      if (ce.detail.cached) {
        setCacheHits((n) => n + 1);
      } else {
        setFresh((n) => n + 1);
      }
    }
    window.addEventListener("wynner:compare-verdict-event", handler);
    return () =>
      window.removeEventListener("wynner:compare-verdict-event", handler);
  }, [isAdmin]);

  if (!isAdmin) return null;

  const hitRate =
    cacheHits + fresh === 0
      ? null
      : Math.round((cacheHits / (cacheHits + fresh)) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-flat rounded-2xl p-3"
      style={{
        boxShadow:
          "0 0 0 1px rgba(167,136,255,0.30), inset 0 1px 0 0 var(--surface-glass-highlight)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-mono uppercase tracking-wider text-aurora-purple">
          <Shield className="h-3 w-3" />
          Admin · Verdict diagnostics
        </div>
        <div className="flex flex-wrap items-center gap-2 text-text-muted">
          <Stat label="user verdicts" value={verdictCount === null ? "—" : String(verdictCount)} />
          <Stat label="session hits" value={String(cacheHits)} />
          <Stat label="session fresh" value={String(fresh)} />
          <Stat label="hit rate" value={hitRate === null ? "—" : `${hitRate}%`} />
          <Stat
            label="last latency"
            value={lastLatencyMs === null ? "—" : `${lastLatencyMs}ms`}
          />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border-soft bg-surface/60 px-2 py-0.5">
      <span className="font-mono text-[9px] uppercase tracking-wider text-text-dim">
        {label}
      </span>
      <span className="font-mono text-xs tabular-nums text-text">{value}</span>
    </span>
  );
}
