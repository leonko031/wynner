"use client";

import { TrendingNichesCard } from "./trending-niches-card";
import { CountryOpportunityCard } from "./country-opportunity-card";

/**
 * Two-column market view: "what's heating up" + "country opportunity map".
 * Stacks on mobile.
 */
export function MarketPulse() {
  return (
    <section id="dashboard-market-pulse">
      <header className="mb-4">
        <h2 className="font-serif text-2xl tracking-tight text-text md:text-3xl">
          Market pulse
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          What the wider platform is telling us today.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TrendingNichesCard />
        <CountryOpportunityCard />
      </div>
    </section>
  );
}
