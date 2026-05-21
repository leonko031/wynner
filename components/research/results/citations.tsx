"use client";

import { ExternalLink } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { GroundingSource } from "@/types/grounding";
import { cn } from "@/lib/utils";

/**
 * Citation primitives shared across the results page.
 *
 *   <Citations sources={[0, 4]} all={report.sources} />
 *
 * Renders superscript [N][M] links. Hover each one to see the source's
 * domain + title + open link. Click opens the source URL in a new tab.
 */

type CitationProps = {
  index: number;
  source: GroundingSource | undefined;
  className?: string;
};

export function Citation({ index, source, className }: CitationProps) {
  // When the source isn't available (legacy reports without grounding), render
  // a non-linked superscript so nothing breaks.
  if (!source) {
    return (
      <sup className={cn("font-mono text-[10px] text-text-dim", className)}>
        [{index + 1}]
      </sup>
    );
  }
  return (
    <HoverCard openDelay={200} closeDelay={120}>
      <HoverCardTrigger asChild>
        <a
          href={source.uri}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(
            "ml-0.5 align-super font-mono text-[10px] text-aurora-purple underline-offset-2 hover:underline",
            className,
          )}
        >
          [{index + 1}]
        </a>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        className="w-72 rounded-2xl border border-border-soft bg-surface-elevated p-3 text-xs shadow-xl"
      >
        <div className="flex items-center gap-2">
          <img
            src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`}
            alt=""
            width={14}
            height={14}
            className="h-3.5 w-3.5 rounded-sm"
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {source.domain}
          </span>
        </div>
        <div className="mt-1.5 line-clamp-2 text-text">{source.title}</div>
        <a
          href={source.uri}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 inline-flex items-center gap-1 text-aurora-purple hover:underline"
        >
          Open source <ExternalLink className="h-3 w-3" />
        </a>
      </HoverCardContent>
    </HoverCard>
  );
}

/** Renders a comma-less group of superscript citations from a list of indices. */
export function Citations({
  sources,
  all,
  className,
}: {
  sources: number[];
  all: GroundingSource[];
  className?: string;
}) {
  if (!sources || sources.length === 0) return null;
  return (
    <span className={cn("inline-block", className)}>
      {sources.map((idx) => (
        <Citation key={idx} index={idx} source={all[idx]} />
      ))}
    </span>
  );
}
