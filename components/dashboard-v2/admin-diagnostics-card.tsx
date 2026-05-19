"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCreditsStore } from "@/lib/store/credits";
import { dailyBriefingSchema, type DailyBriefing } from "@/types/briefing";

/**
 * Admin-only dashboard widget. Shows cache hit/miss of today's briefing,
 * a free regenerate button, and a rough Gemini-call estimate.
 *
 * Renders nothing for non-admins. Mounted just below the briefing card.
 */
export function AdminDiagnosticsCard() {
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  const [state, setState] = useState<{
    cached: boolean | null;
    fellBack: boolean | null;
    chars: number;
  }>({ cached: null, fellBack: null, chars: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/briefing", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          briefing: DailyBriefing;
          cached: boolean;
          fellBack: boolean;
        };
        if (cancelled) return;
        const parsed = dailyBriefingSchema.safeParse(data.briefing);
        const chars = parsed.success
          ? parsed.data.paragraphs.join("").length
          : 0;
        setState({ cached: data.cached, fellBack: data.fellBack, chars });
      } catch {
        // ignore — diagnostics card stays in null state
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (!isAdmin) return null;

  async function forceRegenerate() {
    setBusy(true);
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
      const chars = parsed.success ? parsed.data.paragraphs.join("").length : 0;
      setState({ cached: false, fellBack: data.fellBack, chars });
      toast.success("Forced regenerate", {
        description: `Fellback: ${data.fellBack ? "yes" : "no"} · ${chars} chars`,
      });
      // Soft reload so the briefing card above also re-fetches.
      window.location.reload();
    } catch (err) {
      toast.error("Regenerate failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  }

  // Very rough Gemini Flash cost — only a directional indicator for admins.
  // Real cost depends on token mix; this is good enough to spot anomalies.
  const apiCostUsd = state.chars
    ? Math.max(0.0001, (state.chars / 4) * 0.0000005)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="glass-flat rounded-2xl p-4"
      style={{
        boxShadow:
          "0 0 0 1px rgba(167,136,255,0.30), inset 0 1px 0 0 var(--surface-glass-highlight)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-aurora-purple" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-aurora-purple">
            Admin · Briefing diagnostics
          </span>
        </div>
        <button
          type="button"
          onClick={forceRegenerate}
          disabled={busy}
          className="rounded-full border border-aurora-purple/45 bg-aurora-purple/10 px-3 py-1 text-xs font-medium text-aurora-purple hover:bg-aurora-purple/20 disabled:opacity-50"
        >
          {busy ? "Regenerating…" : "Force regenerate (free)"}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <Stat label="Cache" value={state.cached === null ? "—" : state.cached ? "HIT" : "MISS"} />
        <Stat
          label="Fallback"
          value={state.fellBack === null ? "—" : state.fellBack ? "YES" : "NO"}
        />
        <Stat
          label="Est. cost"
          value={apiCostUsd === null ? "—" : `$${apiCostUsd.toFixed(5)}`}
        />
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-soft bg-surface/40 px-3 py-1.5">
      <div className="font-mono text-[9px] uppercase tracking-wider text-text-dim">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-medium tabular-nums text-text">{value}</div>
    </div>
  );
}
