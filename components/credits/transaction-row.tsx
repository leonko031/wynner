"use client";

import * as LIcons from "lucide-react";
import { motion } from "framer-motion";
import { ACTION_LABELS } from "@/lib/credits/config";
import { ACTION_ICON_NAME } from "@/lib/credits/helpers";
import type { CreditTransaction } from "@/types/credits";
import { cn } from "@/lib/utils";

type Props = { tx: CreditTransaction; index: number };

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.round(ms / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Renders one row of the /credits transaction list. */
export function TransactionRow({ tx, index }: Props) {
  const positive = tx.amount > 0;
  const iconName = ACTION_ICON_NAME[tx.type] as keyof typeof LIcons;
  const Icon =
    (LIcons[iconName] as React.ElementType | undefined) ??
    (LIcons.Sparkles as React.ElementType);
  const accent = positive ? "var(--color-go)" : "var(--color-aurora-blue)";

  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.4) }}
      className="group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-surface/60"
    >
      {/* Left accent on hover */}
      <span
        aria-hidden
        className="absolute left-0 top-2 bottom-2 w-[3px] origin-top scale-y-0 rounded-full transition-transform duration-200 group-hover:scale-y-100"
        style={{ background: accent }}
      />
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{
          backgroundColor: positive
            ? "rgba(61, 214, 140, 0.10)"
            : "rgba(91, 141, 255, 0.10)",
          color: accent,
          border: `1px solid ${positive ? "rgba(61,214,140,0.25)" : "rgba(91,141,255,0.25)"}`,
        }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-text">
          {tx.description || ACTION_LABELS[tx.type]}
        </div>
        <div
          className="mt-0.5 text-[11px] text-text-dim"
          title={new Date(tx.createdAt).toLocaleString()}
        >
          {formatRelative(tx.createdAt)}
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span
          className={cn(
            "font-mono text-sm font-medium tabular-nums",
            positive ? "text-go" : "text-text",
          )}
        >
          {positive ? "+" : ""}
          {tx.amount}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-text-dim">
          bal {tx.balanceAfter}
        </span>
      </div>
    </motion.li>
  );
}
