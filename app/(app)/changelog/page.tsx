"use client";

import { motion } from "framer-motion";
import {
  BoxSelect,
  Brain,
  CommandIcon,
  Layers,
  Lightbulb,
  MessageSquareQuote,
  Palette,
  Plug,
  Search,
  Sparkles,
} from "lucide-react";

type Entry = {
  version: string;
  date: string;
  title: string;
  blurb: string;
  bullets: string[];
  icon: React.ElementType;
  accent: string;
};

const ENTRIES: Entry[] = [
  {
    version: "v0.9",
    date: "May 17, 2026",
    title: "Polish layer",
    blurb: "Touched every surface. Made the rough edges go away.",
    bullets: [
      "Custom focus rings, scrollbars, selection color, button press feedback",
      "Page-transition wrapper across all app routes",
      "Premium cursor (settings toggle) with spring physics",
      "Verdict-accented toast variants",
      "Score ring scanning effect, ambient particles on scan",
      "Hand-drawn empty-state illustrations",
      "Konami code, “wynner” word-trap, 5× logo → debug panel",
    ],
    icon: Palette,
    accent: "#F472B6",
  },
  {
    version: "v0.8",
    date: "May 17, 2026",
    title: "Power-ups (scrapers)",
    blurb:
      "Live data feeds — AliExpress / Temu / Amazon autofill, Meta Ad Library, TikTok, Google Trends.",
    bullets: [
      "ScrapingBee client + 24h cache + credits dashboard",
      "Six scrapers with a uniform ScraperResult<T> interface",
      "Competition pillar uses real Meta Ad Library counts",
      "Demand pillar blends Google Trends + TikTok momentum",
      "Live · Meta Ads / TikTok / Trends badges on pillar cards",
    ],
    icon: Plug,
    accent: "#3B82F6",
  },
  {
    version: "v0.7",
    date: "May 17, 2026",
    title: "Reddit voice mining",
    blurb:
      "The killer differentiator — verbatim buyer quotes pulled from Reddit threads.",
    bullets: [
      "Reddit OAuth client (script or refresh-token), 60 req/min bucket",
      "Gemini Flash → candidate subs · Gemini Pro → structured extraction",
      "Voice of Customer section: quote cards, pains, archetype, ad angles",
      "Optional 7th scan-flow phase when enabled",
    ],
    icon: MessageSquareQuote,
    accent: "#F5A623",
  },
  {
    version: "v0.6",
    date: "May 17, 2026",
    title: "Productivity layer",
    blurb:
      "The vault, the compare page, the global command palette, the keyboard shortcuts.",
    bullets: [
      "/vault with sticky filter bar, score range slider, country/niche chips",
      "/compare with 3 slots, deep-link via ?products=…, winner mode + crown",
      "Global ⌘K palette · Konami-style keyboard shortcuts · ? to inspect them",
    ],
    icon: CommandIcon,
    accent: "#8B5CF6",
  },
  {
    version: "v0.5",
    date: "May 17, 2026",
    title: "Scan flow + scoring engine",
    blurb: "3-act mini-experience that runs the 5-pillar scoring orchestrator.",
    bullets: [
      "3-step wizard with live-preview card",
      "5 pillar scorers (margin, marketFit pure · demand, competition, creative AI)",
      "Gemini Flash / Pro / Vision wrappers with retry + heuristic fallbacks",
    ],
    icon: Sparkles,
    accent: "#00D26A",
  },
  {
    version: "v0.4",
    date: "May 17, 2026",
    title: "Product detail page",
    blurb: "The deep dive — verdict band, pillar grid, country radar, projection, action bar.",
    bullets: [
      "Verdict band stripe sweep animation",
      "Expandable pillar cards with per-pillar explanations",
      "Country radar chart with verdict-colored polygon",
      "Re-score animation that feels like the app is thinking",
    ],
    icon: Search,
    accent: "#10B981",
  },
  {
    version: "v0.3",
    date: "May 16, 2026",
    title: "Homepage / dashboard",
    blurb: "Ticker, hero winner, stats strip, top 10, market pulse, live activity.",
    bullets: [
      "60s infinite ticker with hover-pause",
      "Hero score count-up + pillar bars with thresholds",
      "Recharts on dark background with custom tooltips",
      "Live activity feed firing every 6–12s",
    ],
    icon: Layers,
    accent: "#F97316",
  },
  {
    version: "v0.2",
    date: "May 16, 2026",
    title: "Data layer + seed dataset",
    blurb: "30 hand-curated products across all 14 niches and 15 countries.",
    bullets: [
      "Verdict split exactly 4 / 12 / 9 / 5",
      "Zustand store persisted to localStorage with Set ↔ array serializer",
      "5 reactive hooks + chart helpers",
    ],
    icon: BoxSelect,
    accent: "#3B82F6",
  },
  {
    version: "v0.1",
    date: "May 16, 2026",
    title: "Foundation",
    blurb: "Design tokens, animated primitives, top nav, design-system showcase page.",
    bullets: [
      "Next 16 + React 19 + Tailwind 4 + shadcn (radix-nova)",
      "Geist + JetBrains Mono with tabular-nums for numbers",
      "9 reusable animated primitives (FadeIn, ScoreRing, Sparkline, …)",
    ],
    icon: Brain,
    accent: "#9CA3AF",
  },
];

export default function ChangelogPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/60 px-3 py-1 text-xs text-text-muted">
          <Lightbulb className="h-3 w-3" />
          What we built
        </div>
        <h1 className="mt-5 text-4xl font-medium tracking-tight md:text-5xl">
          Changelog
        </h1>
        <p className="mt-3 max-w-xl text-sm text-text-muted">
          Every prompt in the build-out — newest first. Each entry is a
          self-contained slice that shipped, was verified live, and laid the
          foundation for the next.
        </p>
      </header>

      <ol className="relative space-y-10 pl-7">
        {/* Spine */}
        <span
          aria-hidden
          className="absolute left-2 top-2 h-full w-px bg-gradient-to-b from-border-strong via-border-soft to-transparent"
        />
        {ENTRIES.map((e, i) => (
          <motion.li
            key={e.version}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: i * 0.04 }}
            className="relative"
          >
            <span
              aria-hidden
              className="absolute -left-[18px] top-2 h-3 w-3 rounded-full border-2 border-ink"
              style={{
                backgroundColor: e.accent,
                boxShadow: `0 0 12px ${e.accent}88`,
              }}
            />
            <div className="rounded-2xl border border-border-soft bg-surface/60 p-5">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-md"
                  style={{
                    backgroundColor: `${e.accent}1A`,
                    color: e.accent,
                    border: `1px solid ${e.accent}33`,
                  }}
                >
                  <e.icon className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-base font-medium text-text md:text-lg">
                  {e.title}
                </h2>
                <span className="ml-auto font-mono text-[11px] text-text-dim">
                  {e.version} · {e.date}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {e.blurb}
              </p>
              <ul className="mt-3 space-y-1.5">
                {e.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-xs text-text"
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: e.accent }}
                    />
                    <span className="leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.li>
        ))}
      </ol>
    </main>
  );
}
