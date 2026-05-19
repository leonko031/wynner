# Launch checklist

How to take Wynner from "running on my laptop" to "deployed on Vercel and
shareable." Personal-use phase today; the gates and notes here describe the
path to multi-user.

## 1. Environment variables

All optional except where noted. Copy `.env.local.example` and fill in what
you have:

```bash
cp .env.local.example .env.local
```

| Var | Required | Where to get it |
| --- | --- | --- |
| `GEMINI_API_KEY` | No (falls back to heuristics) | https://aistudio.google.com/app/apikey — free tier is generous |
| `REDDIT_CLIENT_ID` | For voice mining | https://www.reddit.com/prefs/apps — create a "script" app |
| `REDDIT_CLIENT_SECRET` | For voice mining | Reddit app settings |
| `REDDIT_USER_AGENT` | For voice mining | Convention: `wynner/1.0 by u/yourname` |
| `REDDIT_USERNAME` + `REDDIT_PASSWORD` | One auth pair | Reddit account (use a dedicated one without 2FA) |
| `REDDIT_REFRESH_TOKEN` | Or this instead | From an OAuth'd installed app — wins when both pairs present |
| `SCRAPINGBEE_API_KEY` | For Meta Ads / TikTok / product autofill | https://app.scrapingbee.com — 1000 free credits to start |

See [REDDIT_SETUP.md](./REDDIT_SETUP.md) and [SCRAPER_SETUP.md](./SCRAPER_SETUP.md)
for step-by-step.

## 2. Local setup

```bash
npm install
npm run dev
```

First load triggers the welcome modal. Pick "Use sample data" to populate the
30-product seed and run the guided tour.

## 3. Deploy to Vercel

```bash
npx vercel --prod
```

Then in the Vercel dashboard:

1. **Project → Settings → Environment Variables**: paste in everything from
   `.env.local` that you want active in production.
2. **Domains**: assign a custom domain or use the default `*.vercel.app`.
3. **First deploy will hit Edge runtime** for `/api/og` (dynamic OG image) and
   Node runtime for `/api/score`, `/api/voice`, `/api/scrape/*`, `/api/upload`.
   Set `maxDuration` is already configured per route — Vercel respects it on
   Pro plans.

> The app is single-user / browser-local. There's no auth, no database — every
> product lives in `localStorage` keyed by `wynner.products.v1`. Deploying does
> NOT share data between visitors.

## 4. Seed your own data

Three options:

- **Settings → Data → Reset to sample data**: wipes the store and re-hydrates
  the 30-product seed from [`lib/data/seed.ts`](./lib/data/seed.ts).
- **Settings → Data → Import JSON**: upload a `wynner-products-<ts>.json` file
  (the same format produced by Export).
- **Hand-edit** `lib/data/seed.ts` and commit — every fresh browser will see
  your curated list.

## 5. Backups

- **Automatic**: a snapshot is taken once per 24 hours on mount (lazy; never
  blocks paint). Last 7 are kept under `wynner-backup-<YYYY-MM-DD>` in
  `localStorage`.
- **Manual**: Settings → Data → "Take snapshot now".
- **Restore**: Settings → Data → click "Restore" on any listed snapshot. The
  page reloads with the restored state.

## 6. Known limitations

- **Single-user only.** No auth, no server-side persistence, no Stripe.
  Everything is in the browser.
- **No light theme.** Dark-only by design. The toggle exists but no-ops.
- **Scraper selectors drift.** AliExpress / Temu / Meta Ad Library / TikTok
  ship UI changes constantly. The parsers use multiple selector fallbacks +
  JSON-LD when available, but expect occasional re-tuning. Each scraper is
  isolated under `lib/scrapers/{source}/index.ts` so patches are surgical.
- **OG image route (`/api/og`)** works in production (Vercel) but currently
  hangs on Turbopack dev for Node-runtime ImageResponse. Production build
  bypasses this. If you need to test OG images locally, run
  `npm run build && npm start`.
- Fonts in OG images default to system-ui. Add custom fonts via the `next/og`
  `fonts` option if you want brand consistency in shared images.
- **Reddit OAuth** uses Resource Owner Password Credentials for script apps,
  which Reddit may deprecate. The refresh-token path is the safer long-term.
- **Email / billing** not wired. The pricing page is a teaser.

## 7. Roadmap to multi-user

The current codebase was built to make this transition cheap. In rough order:

1. **Auth**: Clerk or Supabase Auth. Add an `@/lib/auth` module; wrap every
   `/api/*` route with `requireSession()`. Add a sign-in screen at `/signup`.
2. **Persistence**: swap the Zustand `persist` localStorage adapter for a
   Supabase-backed adapter. Each `Product` already has a stable `id` — add a
   `userId` foreign key and you're done. The `lib/store/products.ts` API
   surface is the only thing the rest of the app depends on.
3. **Cache**: replace `lib/scrapers/cache.ts` (in-memory Map, single file) with
   a Redis or Supabase KV table. Interface is identical.
4. **Stripe gating**: every scraper config in `lib/scrapers/types.ts` already
   has a `requiresPlan: "free" | "pro" | "killer"` field. Wire it to a
   subscription check.
5. **Public share routes**: build `/share/[productId]` that fetches a
   read-only view from Supabase. The detail page is mostly client-side
   already; carve out a server-render-friendly variant.
6. **Multi-tenant Reddit / ScrapingBee accounts**: each user supplies their
   own keys, stored encrypted. The current `process.env` pattern becomes a
   per-user lookup.

## 8. Final visual QA checklist

Walk these flows before announcing v1:

- [ ] First-run welcome modal appears with no existing products
- [ ] Choosing "Use sample data" hydrates 30 products + starts the 4-step tour
- [ ] Clicking a product card morphs to detail page (layoutId animation)
- [ ] Re-score animates pillars to 0 then back up; toast confirms
- [ ] Manual `/scan` → fill form → generate → land on new product
- [ ] ⌘K → search "posture" → jump to product
- [ ] `/vault` → toggle GO verdict → switch to list view → favorite
- [ ] `/compare` → add 3 products → "Pick the winner" → crown appears
- [ ] Reddit voice toggle on (with key) → re-mine → fresh quotes
- [ ] Export PNG from action bar → file downloads
- [ ] Insights page renders charts + heatmap
- [ ] Settings → export JSON → clear all → import → verify integrity
- [ ] `/api/og?name=Test&score=84&verdict=go` returns a 1200x630 image
