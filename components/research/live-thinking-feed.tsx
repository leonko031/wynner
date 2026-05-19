"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

type Props = {
  thoughts: { id: string; text: string }[];
};

/**
 * Vertical feed of thinking messages. Newest at the bottom, older entries
 * fade to 60% opacity. Auto-scrolls to keep the latest message in view.
 */
export function LiveThinkingFeed({ thoughts }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Deferred scroll keeps the smooth feel and avoids React 19 strict warnings.
    const t = window.setTimeout(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 30);
    return () => window.clearTimeout(t);
  }, [thoughts.length]);

  return (
    <div
      ref={scrollRef}
      className="relative max-h-[280px] overflow-y-auto pr-1"
    >
      {/* Top fade */}
      <div
        className="pointer-events-none sticky top-0 z-10 -mb-6 h-6"
        style={{
          background:
            "linear-gradient(to bottom, var(--surface-glass-strong) 0%, transparent 100%)",
        }}
      />
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {thoughts.map((t, i) => {
            const isLatest = i === thoughts.length - 1;
            return (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{
                  opacity: isLatest ? 1 : 0.6,
                  y: 0,
                  scale: 1,
                }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-xl border border-border-soft/60 bg-surface/40 px-3 py-2 text-sm leading-snug text-text"
              >
                {t.text}
              </motion.li>
            );
          })}
        </AnimatePresence>
        {thoughts.length === 0 && (
          <li className="rounded-xl border border-dashed border-border-soft px-3 py-3 text-center text-xs text-text-dim">
            Booting up…
          </li>
        )}
      </ul>
    </div>
  );
}
