"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCreditsStore } from "@/lib/store/credits";
import type { CostBreakdownRow } from "@/lib/credits/helpers";
import { cn } from "@/lib/utils";
import { SparkIcon } from "./spark-icon";

type Props = {
  /** Total cost in credits to display in the pill. */
  cost: number;
  /** Optional itemized breakdown shown in the hover popover. */
  breakdown?: CostBreakdownRow[];
  /** Tighter sizing for inline use. */
  size?: "sm" | "md";
  /** When user cannot afford, render a peach warning + "Top up" inline. */
  showInsufficient?: boolean;
  className?: string;
};

/**
 * Inline cost pill that previews a credit charge before the user commits.
 * Hover reveals the line-item breakdown. When `showInsufficient` is true
 * and the user's balance can't cover `cost`, the pill flips to a warm
 * warning state with a Top-up shortcut.
 */
export function CostPreview({
  cost,
  breakdown,
  size = "md",
  showInsufficient = true,
  className,
}: Props) {
  const balance = useCreditsStore((s) => s.balance);
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  // Admins never trip the insufficient state — they always show the cost as
  // a reference + a soft "(free for you)" suffix.
  const insufficient = !isAdmin && showInsufficient && balance < cost;
  const shortfall = Math.max(0, cost - balance);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className={cn(
            "group inline-flex items-center gap-1.5 rounded-full border transition-all",
            size === "sm" ? "h-6 px-2 text-[11px]" : "h-7 px-3 text-xs",
            insufficient
              ? "border-aurora-peach/45 bg-aurora-peach/10 text-aurora-peach"
              : "border-border-soft bg-surface/70 text-text hover:border-border-strong",
            className,
          )}
        >
          <SparkIcon
            size={size === "sm" ? 10 : 12}
            color={insufficient ? "#FFB088" : "currentColor"}
          />
          <span className="font-mono tabular-nums">{cost}</span>
          <span className="text-[10px] uppercase tracking-wider text-text-dim">
            credit{cost === 1 ? "" : "s"}
          </span>
          {isAdmin && (
            <span className="ml-1 text-[10px] text-text-dim">(free for you)</span>
          )}
          {insufficient && (
            <span className="ml-1 font-mono text-[10px] uppercase tracking-wider">
              · need {shortfall} more
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="glass-strong w-[240px] rounded-2xl border-0 p-3"
      >
        {breakdown && breakdown.length > 0 ? (
          <ul className="space-y-1">
            {breakdown.map((row, i) => (
              <motion.li
                key={`${row.label}-${i}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "flex items-center justify-between text-xs",
                  row.highlight === "savings" && "text-go",
                  row.highlight === "bundle" && "text-text",
                )}
              >
                <span className={row.highlight === "bundle" ? "font-medium" : "text-text-muted"}>
                  {row.label}
                </span>
                {row.amount > 0 && (
                  <span className="font-mono tabular-nums">
                    ✦ {row.amount}
                  </span>
                )}
              </motion.li>
            ))}
            <li className="mt-2 flex items-center justify-between border-t border-border-soft pt-2 text-xs font-medium">
              <span>Total</span>
              <span className="font-mono tabular-nums">✦ {cost}</span>
            </li>
          </ul>
        ) : (
          <div className="text-xs text-text-muted">
            This action costs {cost} credit{cost === 1 ? "" : "s"}.
          </div>
        )}
        <AnimatePresence>
          {insufficient && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-aurora-peach/10 p-2 text-[11px]"
            >
              <span className="text-aurora-peach">
                Balance: {balance} · need {cost}
              </span>
              <Link
                href="/pricing#topups"
                className="rounded-full bg-aurora-peach/20 px-2 py-0.5 font-medium text-aurora-peach hover:bg-aurora-peach/30"
              >
                Top up
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}
