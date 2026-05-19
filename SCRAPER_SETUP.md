# Scraper power-ups — setup

Wynner ships with six optional scrapers that pull live data into the scoring
pipeline. Five of them go through [ScrapingBee](https://scrapingbee.com) (paid,
1000 free credits to start) and one (Google Trends) needs no key at all.

Everything below is gated behind toggles at `/settings → Power-ups`. The app
works fully without any of these.

## 1. Get a ScrapingBee key (optional)

1. Sign up at https://app.scrapingbee.com — first 1000 credits are free
2. Copy your **API key** from the dashboard
3. Add to `.env.local`:
   ```bash
   SCRAPINGBEE_API_KEY=<your key>
   ```
4. Restart `npm run dev`

## 2. Enable scrapers individually

Open `/settings`. Under **Power-ups** you'll see a card per scraper:

| Scraper | Used by | ScrapingBee credits / scan |
| --- | --- | --- |
| AliExpress / Temu / Amazon | `/scan` → "Auto-fill from URL" | 1–2 |
| Meta Ad Library | competition pillar | 1 |
| TikTok hashtag trends | demand pillar | 1 |
| Google Trends | demand pillar | 0 (free) |

The ScrapingBee credit balance is fetched live from their `/usage` endpoint and
shown above the toggles.

## 3. What changes once it's on

- The /scan step-1 form gains an **Auto-fill from URL** input. Paste any
  AliExpress / Temu / Amazon product URL → click *Scrape* → name, description,
  image, price, and source dropdown all fill in.
- Each scored product carries an `enrichmentSources` field. On the product
  detail page, the relevant pillars get a small green **Live · Meta Ads** /
  **Live · TikTok** / **Live · Trends** badge with a hover-card explaining what
  was pulled and when.
- The scoring engine routes around AI for those pillars:
  - Competition pillar uses the actual active-ad count from Meta Ad Library
  - Demand pillar blends in Google Trends velocity and TikTok hashtag momentum
- All results are cached in-memory for 24 hours per URL/query, so re-using the
  same input doesn't burn extra credits.

## 4. Architecture notes

- Every scraper exports a function returning `ScraperResult<T>`
  (`{ ok: true, data, cached, creditsUsed } | { ok: false, error, code }`).
  Callers never need try/catch.
- Failures are non-fatal: the score completes using heuristics + Gemini.
- The 24h cache lives in process memory for personal use — Redis / Supabase
  swap is one file (`lib/scrapers/cache.ts`).
- `lib/scrapers/types.ts` declares a `requiresPlan` field on every scraper
  ("free" / "pro" / "killer") for future paid-tier gating. Currently every
  scraper is marked "free".

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| ScrapingBee status pill stays "missing" | `SCRAPINGBEE_API_KEY` not set or dev server not restarted |
| Auto-fill scrapes but fields don't populate | Site changed its DOM. Selectors live in `lib/scrapers/{source}/index.ts` — patch and retry. |
| Meta Ad Library returns 0 ads | Either truly zero, or Meta added a captcha for your query. Try a more specific query. |
| TikTok returns `views=0` | TikTok increasingly requires real user sessions; ScrapingBee premium proxy helps. |
| `429` rate limit toast | ScrapingBee concurrency exceeded — Free plan = 1 concurrent request. |
