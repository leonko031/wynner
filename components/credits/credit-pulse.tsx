"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CREDIT_PULSE_EVENT, type CreditPulseDetail } from "@/lib/store/credits";

type ActivePulse = CreditPulseDetail & { key: number };

/**
 * Listens for the global "wynner:credit-pulse" CustomEvent (dispatched by the
 * credits store on spend/grant) and floats a small "+5" / "-3" indicator up
 * from beside whatever it's anchored to.
 *
 * Mounted alongside the CreditPill — the pulse origin is the pill itself.
 */
export function CreditPulse() {
  const [pulses, setPulses] = useState<ActivePulse[]>([]);

  useEffect(() => {
    let nextKey = 0;
    const onPulse = (e: Event) => {
      const detail = (e as CustomEvent<CreditPulseDetail>).detail;
      if (!detail) return;
      const key = ++nextKey;
      // Deferred state set keeps us safe under React 19 strict rules
      window.setTimeout(() => {
        setPulses((p) => [...p, { ...detail, key }]);
      }, 0);
      // Auto-clean after the animation completes
      window.setTimeout(() => {
        setPulses((p) => p.filter((x) => x.key !== key));
      }, 1600);
    };
    window.addEventListener(CREDIT_PULSE_EVENT, onPulse);
    return () => window.removeEventListener(CREDIT_PULSE_EVENT, onPulse);
  }, []);

  return (
    <div className="pointer-events-none absolute right-0 top-0 z-50 h-0 w-0" aria-hidden>
      <AnimatePresence>
        {pulses.map((p) => {
          const positive = p.amount > 0;
          return (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: 1, y: -28, scale: 1 }}
              exit={{ opacity: 0, y: -52, scale: 0.85 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -right-1 top-2 select-none whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums"
              style={{
                background: positive
                  ? "linear-gradient(135deg, rgba(61,214,140,0.25), rgba(91,141,255,0.20))"
                  : "linear-gradient(135deg, rgba(255,176,136,0.20), rgba(255,137,197,0.20))",
                color: positive ? "#3DD68C" : "#FF7E5F",
                border: `1px solid ${positive ? "rgba(61,214,140,0.45)" : "rgba(255,126,95,0.40)"}`,
                boxShadow: positive
                  ? "0 0 16px rgba(61,214,140,0.35)"
                  : "0 0 16px rgba(255,126,95,0.30)",
              }}
            >
              {positive ? "+" : ""}
              {p.amount}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
