"use client";

import dynamic from "next/dynamic";
import { TickerBar } from "@/components/dashboard/ticker";
import { HeroWinner } from "@/components/dashboard/hero-winner";
import { StatsStrip } from "@/components/dashboard/stats-strip";
import { TopGrid } from "@/components/dashboard/top-grid";
import { FooterZone } from "@/components/dashboard/footer-zone";
import {
  MarketPulseSkeleton,
} from "@/components/dashboard/market-pulse";
import {
  ActivityFeedSkeleton,
} from "@/components/dashboard/activity-feed";

const MarketPulse = dynamic(
  () =>
    import("@/components/dashboard/market-pulse").then((m) => m.MarketPulse),
  { loading: () => <MarketPulseSkeleton />, ssr: false },
);

const ActivityFeed = dynamic(
  () =>
    import("@/components/dashboard/activity-feed").then((m) => m.ActivityFeed),
  { loading: () => <ActivityFeedSkeleton />, ssr: false },
);

export default function DashboardPage() {
  return (
    <>
      <TickerBar />
      <HeroWinner />
      <StatsStrip />
      <TopGrid />
      <MarketPulse />
      <ActivityFeed />
      <FooterZone />
    </>
  );
}
