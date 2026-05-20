"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type RowProps = {
  label: string;
  description?: string;
  /** Index of the winning column for this dimension. */
  winnerIndex?: number | null;
  /** One cell per column above. The component handles dim/highlight styling. */
  cells: React.ReactNode[];
  /** Optional expanded content rendered when the user opens the row. */
  expanded?: React.ReactNode;
  index?: number;
  columns: number;
};

/**
 * Shared comparison-row wrapper. Sticky left label column, evenly-spaced
 * cells aligned with the champion cards above. Optional expanded panel.
 */
export function ComparisonRow({
  label,
  description,
  winnerIndex,
  cells,
  expanded,
  index = 0,
  columns,
}: RowProps) {
  const [open, setOpen] = useState(false);
  const hasExpanded = expanded !== undefined;

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.06 * index, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-2xl p-4 md:p-5 transition-colors hover:bg-surface/70"
    >
      <div
        className="grid items-center gap-4"
        style={{
          gridTemplateColumns: `minmax(140px, 200px) repeat(${columns}, minmax(0, 1fr)) 40px`,
        }}
      >
        {/* Sticky-ish left label */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            {label}
          </span>
          {description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 cursor-help text-text-dim" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-xs">
                {description}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Cells */}
        {cells.map((cell, i) => {
          const winning =
            typeof winnerIndex === "number" && winnerIndex === i;
          const losing =
            typeof winnerIndex === "number" && winnerIndex !== null && winnerIndex !== i;
          return (
            <div
              key={i}
              className={cn(
                "min-w-0 text-sm",
                winning && "relative",
                losing && "opacity-70",
              )}
            >
              {winning && (
                <span
                  aria-hidden
                  className="absolute -left-1.5 top-1 h-[60%] w-[3px] rounded-full bg-go"
                />
              )}
              {cell}
            </div>
          );
        })}

        {/* Expand chevron */}
        {hasExpanded ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Collapse details" : "Expand details"}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-dim hover:bg-surface-elevated hover:text-text"
          >
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
            />
          </button>
        ) : (
          <span aria-hidden />
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && hasExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-border-soft pt-4">{expanded}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

/** Small helper — used by row cells to render an arrow + value when winning. */
export function WinningValue({
  children,
  winning,
  unit,
}: {
  children: React.ReactNode;
  winning?: boolean;
  unit?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1",
        winning && "text-go",
      )}
    >
      {winning && <span aria-hidden className="text-[10px]">↑</span>}
      <span className="font-mono tabular-nums">{children}</span>
      {unit && (
        <span className="font-mono text-[10px] text-text-dim">{unit}</span>
      )}
    </span>
  );
}
