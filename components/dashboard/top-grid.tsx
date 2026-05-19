"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "./product-card";
import { useProducts } from "@/lib/hooks";
import { NICHES_LIST } from "@/lib/data/niches";
import type { Niche, Verdict } from "@/types";
import { cn } from "@/lib/utils";

type Chip = { id: "all" | "go" | "test"; label: string };

const CHIPS: Chip[] = [
  { id: "all", label: "All" },
  { id: "go", label: "GO" },
  { id: "test", label: "TEST" },
];

export function TopGrid() {
  const [chip, setChip] = useState<Chip["id"]>("all");
  const [niche, setNiche] = useState<Niche | "any">("any");

  const verdictFilter: Verdict | undefined =
    chip === "all" ? undefined : (chip as Verdict);
  const nicheFilter = niche === "any" ? undefined : niche;

  const all = useProducts({
    sortBy: "score",
    verdict: verdictFilter,
    niche: nicheFilter,
  });
  const list = useMemo(() => all.slice(0, 10), [all]);

  return (
    <section data-tour="top-grid" className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-medium tracking-tight md:text-2xl">
          Top 10 today
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            className="flex items-center rounded-full border border-border-soft bg-surface/60 p-0.5"
          >
            {CHIPS.map((c) => {
              const active = chip === c.id;
              return (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setChip(c.id)}
                  className={cn(
                    "relative rounded-full px-3 py-1 text-xs transition-colors",
                    active
                      ? "text-text"
                      : "text-text-muted hover:text-text",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="topgrid-chip"
                      className="absolute inset-0 -z-10 rounded-full bg-surface-elevated"
                      transition={{
                        type: "spring",
                        stiffness: 360,
                        damping: 30,
                      }}
                    />
                  )}
                  {c.label}
                </button>
              );
            })}
          </div>
          <Select value={niche} onValueChange={(v) => setNiche(v as Niche | "any")}>
            <SelectTrigger className="h-8 w-40 rounded-full border-border-soft bg-surface/60 text-xs">
              <SelectValue placeholder="By niche" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">All niches</SelectItem>
              {NICHES_LIST.map((n) => (
                <SelectItem key={n.niche} value={n.niche}>
                  {n.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <motion.div
        layout
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <AnimatePresence mode="popLayout">
          {list.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full rounded-2xl border border-border-soft bg-surface/40 p-10 text-center text-sm text-text-muted"
            >
              No products match this filter yet.
            </motion.div>
          ) : (
            list.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProductCard product={p} index={i} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

export function TopGridSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-5 h-7 w-48 animate-pulse rounded-md bg-surface-elevated" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[268px] animate-pulse rounded-2xl border border-border-soft bg-surface"
          />
        ))}
      </div>
    </section>
  );
}
