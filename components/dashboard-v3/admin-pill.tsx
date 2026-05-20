"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Eye, RefreshCw, Shield, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCreditsStore } from "@/lib/store/credits";

type Props = {
  onForceRefresh: () => Promise<void> | void;
  onTogglePreview: (next: boolean) => void;
  previewActive: boolean;
  /** Tokens / chars used this page load — passed in from the briefing fetch. */
  lastBriefChars: number;
  lastBriefMs: number;
};

/**
 * Floating glass pill that's only visible to admins. Bottom-right of the
 * dashboard. Click to expand a panel with debugging + free-regeneration
 * controls.
 */
export function AdminPill({
  onForceRefresh,
  onTogglePreview,
  previewActive,
  lastBriefChars,
  lastBriefMs,
}: Props) {
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!isAdmin) return null;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await onForceRefresh();
      toast.success("Briefing force-refreshed");
    } catch (err) {
      toast.error("Refresh failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong absolute bottom-12 right-0 w-72 rounded-2xl p-4 shadow-[0_20px_48px_-12px_rgba(0,0,0,0.35)]"
            style={{
              boxShadow:
                "0 0 0 1px rgba(167,136,255,0.35), 0 24px 48px -16px rgba(91,141,255,0.45)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-aurora-purple">
                Admin · Dashboard
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close admin panel"
                className="rounded-full p-1 text-text-muted hover:bg-surface hover:text-text"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={refreshing}
                className="flex w-full items-center justify-between rounded-xl border border-border-soft bg-surface/70 px-3 py-2 text-left text-xs text-text transition-all hover:border-aurora-purple/45 disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                  />
                  Force refresh briefing
                </span>
                <span className="font-mono text-[10px] text-text-dim">free</span>
              </button>

              <button
                type="button"
                onClick={() => onTogglePreview(!previewActive)}
                className="flex w-full items-center justify-between rounded-xl border border-border-soft bg-surface/70 px-3 py-2 text-left text-xs text-text transition-all hover:border-aurora-purple/45"
              >
                <span className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5" />
                  Empty-state preview
                </span>
                <span
                  className={`font-mono text-[10px] ${previewActive ? "text-aurora-purple" : "text-text-dim"}`}
                >
                  {previewActive ? "ON" : "OFF"}
                </span>
              </button>

              <div className="rounded-xl border border-border-soft bg-surface/40 px-3 py-2 font-mono text-[10px] text-text-muted">
                <div className="flex items-center justify-between">
                  <span>Last brief chars</span>
                  <span className="tabular-nums">{lastBriefChars}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between">
                  <span>Last brief latency</span>
                  <span className="tabular-nums">{lastBriefMs}ms</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-aurora-purple/40 bg-aurora-purple/10 px-4 text-xs font-medium text-aurora-purple backdrop-blur-md transition-all hover:bg-aurora-purple/15"
      >
        <Shield className="h-3.5 w-3.5" />
        Admin
      </motion.button>
    </div>
  );
}
