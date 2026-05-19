# Wynner

> Premium dropshipping intelligence — score products, see saturation, ship winners.

Built from scratch over nine prompts. Every surface is designed; nothing is a
shadcn default. The app runs end-to-end on seed data with zero API keys, and
unlocks deeper signals — AI scoring, Reddit voice mining, live scrapers — as
you turn them on.

## What makes this special

- **Five-pillar scoring engine** with deterministic heuristics and Gemini Pro
  reasoning. The score is always grounded in real numbers, never vague.
- **Reddit voice mining**: pulls verbatim buyer language for any scored product
  — so the personas read like real customers instead of AI fluff.
- **Six live-data scrapers** (AliExpress / Temu / Amazon autofill, Meta Ad
  Library, TikTok, Google Trends) feed back into the scoring pillars; pillar
  cards get a "Live · *source*" badge when real data drove the number.
- **Linear-grade command palette + keyboard shortcuts**: ⌘K · ⌘1–4 · S · V · C
  · / · F · ?
- **30-product seed** spanning all 14 niches and 15 countries, hand-written
  reasoning, verdict-exact distribution.
- **Premium cursor**, page transitions, easter eggs (Konami code, "wynner" word
  trap, 5× logo → debug panel), confetti, the works.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

The seed dataset hydrates into the Zustand store on first mount, so the
dashboard is populated immediately. The /scan flow works in heuristic mode out
of the box.

## Tour

| Route | What it is |
| --- | --- |
| `/dashboard` | Ticker · hero pick · stats · top 10 · market pulse · live activity |
| `/scan` | 3-step wizard: details → country → generate (with optional voice + scrape phases) |
| `/product/[id]` | Verdict band · pillar grid · country radar · voice of customer · projection · ad angles |
| `/vault` | Filter bar (search · score range · country · niche · verdict · sort) + grid/list |
| `/compare` | Up to 3 products side-by-side · pick the winner · share via URL |
| `/settings` | Reddit · power-ups · AI models · appearance · data export/import |
| `/docs` | Getting started · how the score works · FAQ |
| `/changelog` | Designed timeline of every shipping prompt |
| `/design-system` | Every token, primitive, and shadcn component used |

## Unlocking deeper features

All optional. The app works fully without any of these.

### AI scoring (Gemini)

1. Get a free key at https://aistudio.google.com/app/apikey
2. `cp .env.local.example .env.local`
3. Paste into `GEMINI_API_KEY` and restart `npm run dev`

Without the key, scoring uses deterministic heuristics — same UX, same speed,
just no AI reasoning.

### Reddit voice mining

See [REDDIT_SETUP.md](./REDDIT_SETUP.md). 5-minute setup — needs a Reddit
"script" app + your username/password (or a refresh token). Gated behind a
toggle at `/settings → Reddit voice mining`.

### Live data power-ups

See [SCRAPER_SETUP.md](./SCRAPER_SETUP.md). One ScrapingBee key unlocks five
scrapers. Each is individually toggleable at `/settings → Power-ups`. Google
Trends is free and toggleable separately.

## Project layout

```
app/(app)/        authed app routes
app/api/          server routes (/score, /voice, /upload, /scrape/*, /health)
components/
  animated/       reusable motion primitives (FadeIn, ScoreRing, Sparkline, …)
  dashboard/      ticker, hero, stats, top grid, market pulse, activity
  product/        hero, pillar grid, country radar, voice of customer, …
  scan/           3-step wizard pieces
  vault/          filter bar, product row, empty state
  compare/        slot, picker, comparison table
  layout/         top nav, page transition, premium cursor, easter eggs, command palette
  empty/          shared SVG line-art illustrations
  ui/             shadcn primitives
lib/
  data/           seed dataset, countries, niches
  scoring/        pillar scorers + orchestrator
  ai/             Gemini wrappers + prompts (one per scorer)
  scrapers/       Reddit · ScrapingBee · AliExpress · Temu · Amazon · Meta Ads · TikTok · Google Trends
  store/          Zustand stores (products + preferences, persisted)
  hooks/          useProducts, useTopProducts, useSubtleTilt, useIsClient, …
types/            shared types
```

## Tech stack

- **Next.js 16** (App Router, Turbopack default) · React 19.2 · Tailwind v4
- **shadcn/ui** (radix-nova preset) · Radix primitives
- **framer-motion** for everything that moves
- **recharts** for charts (manual dimension measuring; no `ResponsiveContainer`
  flicker)
- **zustand** with a custom `PersistStorage` (handles `Set` ↔ array)
- **cheerio** + **google-trends-api** for parsers
- **@google/generative-ai** for Gemini wrappers
- **sonner** for toasts (with custom verdict-accented variants)

## License

Personal use. Not for redistribution.
