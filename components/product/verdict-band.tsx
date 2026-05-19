"use client";

import { motion } from "framer-motion";
import { Sparkles, Zap, AlertTriangle, Ban } from "lucide-react";
import type { Verdict } from "@/types";

const META: Record<
  Verdict,
  { color: string; Icon: React.ElementType }
> = {
  go: { color: "#00D26A", Icon: Sparkles },
  test: { color: "#F5A623", Icon: Zap },
  risky: { color: "#F97316", Icon: AlertTriangle },
  skip: { color: "#EF4444", Icon: Ban },
};

export function VerdictBand({
  verdict,
  message,
}: {
  verdict: Verdict;
  message: string;
}) {
  const m = META[verdict];
  const { Icon } = m;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-8 flex h-16 w-full items-center justify-center overflow-hidden rounded-xl"
      style={{
        backgroundColor: `${m.color}14`,
        borderWidth: 1,
        borderColor: `${m.color}4D`,
      }}
    >
      {/* Sweeping diagonal stripe */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-[-30%] w-1/3"
        initial={{ x: "-150%" }}
        animate={{ x: "350%" }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        style={{
          background: `linear-gradient(115deg, transparent 0%, ${m.color}33 50%, transparent 100%)`,
          transform: "skewX(-18deg)",
        }}
      />
      {/* Subtle static stripe pattern under everything */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          background: `repeating-linear-gradient(115deg, ${m.color} 0px, ${m.color} 1px, transparent 1px, transparent 14px)`,
        }}
      />
      <div className="relative z-10 flex items-center gap-3 px-6 text-center">
        <Icon className="h-4 w-4 shrink-0" style={{ color: m.color }} />
        <span className="text-sm leading-snug text-text">{message}</span>
      </div>
    </motion.div>
  );
}
