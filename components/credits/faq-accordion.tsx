"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type FaqItem = { q: string; a: React.ReactNode };

type Props = { items: FaqItem[] };

/**
 * Lightweight glass-styled accordion. We avoid pulling in a new shadcn
 * primitive — single-open semantics, framer-motion height animation,
 * keyboard friendly via the native <button>.
 */
export function FaqAccordion({ items }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="glass rounded-3xl p-2">
      {items.map((item, i) => {
        const open = openIdx === i;
        return (
          <div
            key={item.q}
            className={cn(
              "rounded-2xl px-4 transition-colors",
              open ? "bg-surface/40" : "hover:bg-surface/30",
              i !== items.length - 1 && "border-b border-border-soft/60",
            )}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : i)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 py-4 text-left"
            >
              <span className="text-sm font-medium text-text">{item.q}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-text-dim transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-4 pr-8 text-sm leading-relaxed text-text-muted">
                    {item.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
