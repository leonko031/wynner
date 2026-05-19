"use client";

import { motion } from "framer-motion";
import { Link2, Megaphone, MessageSquareQuote, TrendingUp } from "lucide-react";
import { CREDIT_COSTS } from "@/lib/credits/config";
import type { ScanPowerUps } from "@/types/credits";
import { cn } from "@/lib/utils";
import { SparkIcon } from "./spark-icon";

type Props = {
  value: ScanPowerUps;
  onChange: (next: ScanPowerUps) => void;
  disabled?: boolean;
};

type Cell = {
  key: keyof ScanPowerUps;
  label: string;
  blurb: string;
  cost: number;
  icon: React.ElementType;
  accent: string;
};

const CELLS: Cell[] = [
  {
    key: "urlScrape",
    label: "URL auto-scrape",
    blurb: "Pull title, image, price from source",
    cost: CREDIT_COSTS.url_scrape,
    icon: Link2,
    accent: "#5B8DFF",
  },
  {
    key: "redditVoice",
    label: "Reddit voice mining",
    blurb: "Verbatim buyer language from threads",
    cost: CREDIT_COSTS.reddit_voice,
    icon: MessageSquareQuote,
    accent: "#A788FF",
  },
  {
    key: "metaAds",
    label: "Meta Ad Library",
    blurb: "Count active ads from competitors",
    cost: CREDIT_COSTS.meta_ads,
    icon: Megaphone,
    accent: "#FF89C5",
  },
  {
    key: "tiktokTrends",
    label: "TikTok trends",
    blurb: "Hashtag views + velocity signal",
    cost: CREDIT_COSTS.tiktok_trends,
    icon: TrendingUp,
    accent: "#88E5C8",
  },
];

/**
 * Per-scan power-up toggles. Each card glows with its accent when active and
 * shows the credit cost inline. Defaults are seeded from the global scraper
 * preferences but can be flipped per-scan.
 */
export function ScanPowerUpsToggle({ value, onChange, disabled }: Props) {
  function toggle(key: keyof ScanPowerUps) {
    if (disabled) return;
    onChange({ ...value, [key]: !value[key] });
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {CELLS.map(({ key, label, blurb, cost, icon: Icon, accent }) => {
        const active = value[key];
        return (
          <motion.button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18 }}
            disabled={disabled}
            className={cn(
              "group relative flex items-start gap-3 rounded-2xl border p-3 text-left transition-all",
              active
                ? "border-transparent bg-surface-elevated"
                : "border-border-soft bg-surface/60 hover:border-border-strong",
              disabled && "cursor-not-allowed opacity-60",
            )}
            style={
              active
                ? {
                    boxShadow: `0 0 0 1px ${accent}55, 0 12px 28px -10px ${accent}55`,
                  }
                : undefined
            }
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all"
              style={{
                backgroundColor: active ? `${accent}1A` : "var(--surface-glass)",
                color: active ? accent : "var(--ink-soft)",
                border: `1px solid ${active ? `${accent}55` : "var(--surface-glass-border)"}`,
              }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    active ? "text-text" : "text-text-muted",
                  )}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                    active
                      ? "text-text"
                      : "text-text-dim",
                  )}
                  style={
                    active
                      ? {
                          background: `${accent}1A`,
                          border: `1px solid ${accent}55`,
                          color: accent,
                        }
                      : { border: "1px solid var(--surface-glass-border)" }
                  }
                >
                  <SparkIcon size={10} color={active ? accent : "currentColor"} />
                  {cost}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-snug text-text-dim">
                {blurb}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
