"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BriefingChip } from "@/types/briefing";

/**
 * Convert a BriefingChip's `action` + `value` into a real href. Anything
 * unrecognized routes to /vault — never an arbitrary external URL.
 */
function hrefFor(chip: BriefingChip): string {
  switch (chip.action) {
    case "filter_niche":
      return chip.value ? `/vault?niche=${encodeURIComponent(chip.value)}` : "/vault";
    case "filter_country":
      return chip.value ? `/vault?country=${encodeURIComponent(chip.value)}` : "/vault";
    case "open_scan":
      return "/scan";
    case "open_vault":
      return "/vault";
    case "info":
    default:
      return "/dashboard";
  }
}

export function BriefingChipPill({ chip }: { chip: BriefingChip }) {
  return (
    <Link
      href={hrefFor(chip)}
      className="group inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-3 py-1 text-xs text-text backdrop-blur transition-all hover:-translate-y-0.5 hover:border-aurora-purple/50 hover:bg-surface"
    >
      {chip.emoji && (
        <span aria-hidden className="text-sm leading-none">
          {chip.emoji}
        </span>
      )}
      <span className="font-medium">{chip.label}</span>
      <ArrowRight className="h-3 w-3 text-text-dim opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
    </Link>
  );
}
