"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { Radio } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type Props = {
  source: "metaAds" | "tiktok" | "googleTrends" | "productScrape";
  scrapedAt: string;
  summary: string;
};

const LABEL: Record<Props["source"], string> = {
  metaAds: "Meta Ads",
  tiktok: "TikTok",
  googleTrends: "Trends",
  productScrape: "Catalog",
};

export function LiveDataBadge({ source, scrapedAt, summary }: Props) {
  return (
    <HoverCard openDelay={150}>
      <HoverCardTrigger asChild>
        <span className="inline-flex h-5 items-center gap-1 rounded-full border border-go/40 bg-go/10 px-1.5 text-[10px] font-medium uppercase tracking-wider text-go">
          <span className="relative inline-flex h-1.5 w-1.5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-pulse-glow rounded-full bg-go" />
            <span className="relative inline-flex h-1 w-1 rounded-full bg-go" />
          </span>
          Live · {LABEL[source]}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="max-w-xs text-xs">
        <div className="flex items-center gap-1.5 text-go">
          <Radio className="h-3 w-3" />
          <span className="font-mono uppercase tracking-wider text-[10px]">
            {LABEL[source]}
          </span>
        </div>
        <p className="mt-1 leading-relaxed text-text">{summary}</p>
        <p className="mt-1 font-mono text-[10px] text-text-dim">
          Scraped {formatDistanceToNowStrict(new Date(scrapedAt))} ago
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}
