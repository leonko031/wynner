"use client";

import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { useProductStore } from "@/lib/store/products";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES_LIST } from "@/lib/data/countries";
import type { ActivityEvent, ActivityType } from "@/types";

const FEED_LIMIT = 20;

const ACCENT_BY_TYPE: Record<ActivityType, string> = {
  scan_complete: "#00D26A",
  favorite_added: "#F472B6",
  trend_alert: "#F5A623",
  milestone: "#3B82F6",
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeEvent(opts: {
  products: { id: string; name: string; sellScore: number }[];
}): ActivityEvent {
  const types: ActivityType[] = [
    "scan_complete",
    "scan_complete",
    "trend_alert",
    "favorite_added",
    "milestone",
  ];
  const type = pick(types);
  const product = opts.products.length ? pick(opts.products) : undefined;
  let message = "";

  switch (type) {
    case "scan_complete": {
      const score = product?.sellScore ?? 50 + Math.floor(Math.random() * 40);
      const verdict =
        score >= 80 ? "Go" : score >= 60 ? "Test" : score >= 40 ? "Risky" : "Skip";
      message = product
        ? `Scan complete — ${product.name} scored ${score} (${verdict})`
        : `New product scanned — verdict: ${verdict}`;
      break;
    }
    case "trend_alert": {
      const niche = pick(Object.values(NICHES));
      const country = pick(COUNTRIES_LIST);
      message = `Trend alert — ${niche.label} heating up in ${country.name} ${country.flag}`;
      break;
    }
    case "favorite_added":
      message = product
        ? `Added "${product.name}" to your vault`
        : `New product added to your vault`;
      break;
    case "milestone": {
      const milestones = [
        "100 products scanned this week",
        "New top-10 winner detected",
        "Saturation alert resolved",
        "Niche heatmap refreshed",
      ];
      message = pick(milestones);
      break;
    }
  }

  return {
    id: nanoid(),
    type,
    message,
    productId: product?.id,
    timestamp: new Date().toISOString(),
    accentColor: ACCENT_BY_TYPE[type],
  };
}

export function useActivityFeed(): ActivityEvent[] {
  const products = useProductStore((s) => s.products);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const compact = products.map((p) => ({
      id: p.id,
      name: p.name,
      sellScore: p.sellScore,
    }));
    if (compact.length === 0) return;

    let cancelled = false;

    // Seed a few events immediately (next tick — keeps setState out of effect body).
    const seed = window.setTimeout(() => {
      if (cancelled) return;
      setEvents((prev) =>
        prev.length
          ? prev
          : [
              makeEvent({ products: compact }),
              makeEvent({ products: compact }),
              makeEvent({ products: compact }),
            ],
      );
    }, 0);

    const schedule = (): number => {
      // 9–16s — slower than original 6–12s for fewer re-renders
      const delay = 9_000 + Math.floor(Math.random() * 7_000);
      return window.setTimeout(() => {
        if (cancelled) return;
        // Skip while tab is hidden — saves work without losing the "feels alive" effect
        if (document.visibilityState === "visible") {
          setEvents((prev) =>
            [makeEvent({ products: compact }), ...prev].slice(0, FEED_LIMIT),
          );
        }
        timerId = schedule();
      }, delay);
    };

    let timerId = schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(seed);
      window.clearTimeout(timerId);
    };
  }, [products]);

  return events;
}
