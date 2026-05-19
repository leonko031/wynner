"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 0, label: "Depth" },
  { id: 1, label: "Details" },
  { id: 2, label: "Country" },
  { id: 3, label: "Research" },
] as const;

export function Stepper({ current }: { current: 0 | 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {STEPS.map((s, i) => {
        const status =
          current > s.id ? "done" : current === s.id ? "current" : "future";
        return (
          <div key={s.id} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <motion.span
                layout
                className={cn(
                  "flex h-2 w-2 items-center justify-center rounded-full",
                  status === "done" && "bg-go shadow-[0_0_10px_rgba(0,210,106,0.7)]",
                  status === "current" && "bg-text shadow-[0_0_10px_rgba(255,255,255,0.5)]",
                  status === "future" && "bg-border-strong",
                )}
                animate={
                  status === "current"
                    ? { scale: [1, 1.2, 1] }
                    : { scale: 1 }
                }
                transition={{
                  duration: 1.6,
                  repeat: status === "current" ? Infinity : 0,
                  ease: "easeInOut",
                }}
              />
              <span
                className={cn(
                  "font-mono text-[11px] uppercase tracking-wider",
                  status === "future"
                    ? "text-text-dim"
                    : status === "current"
                      ? "text-text"
                      : "text-text-muted",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="h-px w-12 bg-border-soft" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
