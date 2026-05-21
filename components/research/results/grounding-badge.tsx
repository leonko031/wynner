"use client";

import { ShieldCheck, ShieldOff } from "lucide-react";
import { groundingQualityLabel } from "@/types/grounding";
import type { DeepResearchReport } from "@/types/research";

const QUALITY_COLOR = {
  high: "#3DD68C",
  medium: "#FFAB40",
  low: "#FF7E5F",
} as const;

const QUALITY_LABEL = {
  high: "high quality",
  medium: "medium quality",
  low: "low quality",
} as const;

/**
 * Compact "Grounded · N sources · M queries · X quality" badge.
 * Click scrolls to the sources panel.
 */
export function GroundingBadge({ report }: { report: DeepResearchReport }) {
  if (report.ungroundedFallback) {
    return (
      <button
        type="button"
        onClick={() =>
          document
            .getElementById("research-sources-panel")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        className="inline-flex items-center gap-1.5 rounded-full border border-aurora-peach/40 bg-aurora-peach/10 px-3 py-1 text-xs text-aurora-peach"
      >
        <ShieldOff className="h-3 w-3" />
        Heuristic — no web grounding
      </button>
    );
  }
  const tier = groundingQualityLabel(report.groundingQualityScore);
  const color = QUALITY_COLOR[tier];
  return (
    <button
      type="button"
      onClick={() =>
        document
          .getElementById("research-sources-panel")
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
      style={{
        borderColor: `${color}55`,
        backgroundColor: `${color}15`,
        color,
      }}
    >
      <ShieldCheck className="h-3 w-3" />
      <span>Grounded</span>
      <span aria-hidden>·</span>
      <span className="font-mono tabular-nums">{report.sources.length}</span>
      <span>source{report.sources.length === 1 ? "" : "s"}</span>
      <span aria-hidden>·</span>
      <span>{QUALITY_LABEL[tier]}</span>
    </button>
  );
}
