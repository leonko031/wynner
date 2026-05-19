"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const PHASES = [
  "Re-analyzing margins…",
  "Checking market drift…",
  "Sampling competitor density…",
  "Updating verdict…",
] as const;

function ActiveOverlay() {
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setPhaseIdx((i) => Math.min(i + 1, PHASES.length - 1));
    }, 700);
    return () => window.clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="flex w-[320px] flex-col items-center gap-4 rounded-2xl border border-border-strong bg-surface-elevated p-7 text-center shadow-2xl"
      >
        <Loader2 className="h-6 w-6 animate-spin text-go" />
        <div className="font-mono text-[11px] uppercase tracking-wider text-text-dim">
          Re-scoring
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={PHASES[phaseIdx]}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            className="text-sm text-text"
          >
            {PHASES[phaseIdx]}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export function RescoreOverlay({ open }: { open: boolean }) {
  return (
    <AnimatePresence>{open && <ActiveOverlay />}</AnimatePresence>
  );
}
