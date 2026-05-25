# Wynner — Launch checklist

> Concrete, codebase-specific checklist. Work it top-down. Items reference real files and migrations.

Use the symbols:
- `☐` not done
- `☑` done
- `⊘` not applicable / explicitly punted

## 1 — Environment

### Required keys
- ☐ `GEMINI_API_KEY` — **paid tier** (free tier doesn't support grounding). Set in Vercel.
- ☐ `GEMINI_GROUNDING_ENABLED=true` in production. Default if unset is also `true` — only set it explicitly if you want to disable.
- ☐ `NEXT_PUBLIC_SUPABASE_URL` — production project URL.
- ☐ `NEXT_PUBLIC_SUPABASE_ANON_KEY` — production publishable key.
- ☐ `SUPABASE_SERVICE_ROLE_KEY` — production secret key. **Server only — must not leak to client.**
- ☐ `ADMIN_EMAILS` — comma-separated list of admin emails (lowercase). Drives the `is_admin` DB trigger.

### Optional (degrades gracefully if missing)
- ☐ `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD` (or `REDDIT_REFRESH_TOKEN`) — voice mining. Without these the feature falls back to heuristic personas.
- ☐ `SCRAPINGBEE_API_KEY` — URL auto-scrape on /scan. Without it the URL field is plain.
- ☐ `RESEND_API_KEY` + `RESEND_FROM` — "Email me the PDF" feature. Without these, PDF is download-only.

### Stripe (required if charging)
- ☐ `STRIPE_SECRET_KEY` — production key.
- ☐ `STRIPE_WEBHOOK_SECRET` — production webhook signing secret.
- ☐ Stripe products created + prices set in `lib/credits/stripe-config.ts`:
  - ☐ Pro monthly + Pro yearly
  - ☐ Operator monthly + Operator yearly
  - ☐ Small top-up (25 credits)
  - ☐ Medium top-up (75 credits)
  - ☐ Large top-up (200 credits)
  - ☐ Mega top-up (500 credits)
- ☐ Stripe webhook endpoint registered: `https://wynnerlabs.com/api/webhooks/stripe`
- ☐ TODO in `app/api/webhooks/stripe/route.ts` resolved — look up user from `session.client_reference_id` and apply the granted credits/plan.

### Google OAuth (optional)
- ☐ OAuth client created in Google Console.
- ☐ Production redirect URI added: `https://wynnerlabs.com/auth/callback`.
- ☐ Consent screen status: **published** (not Testing).
- ☐ Authorized in Supabase Auth → Providers → Google.

## 2 — Database

### Migrations applied to production
- ☑ `001_auth_profiles.sql` — profiles table + RLS + trigger from auth.users.
- ⊘ `002_*.sql` — never written. History gap is intentional.
- ☑ `003_admin_role.sql` — is_admin column + admin email trigger.
- ☑ `004_daily_briefings.sql` — daily briefing cache.
- ☐ `005_collections.sql` — vault collections + product_status. **Apply optional; vault is removed from the app so these tables are dormant.**
- ☑ `006_comparison_verdicts.sql` — judge verdict cache.
- ☑ `007_strategic_briefs.sql` — strategic brief + strengths_blindspots + operator_profile_tags caches.
- ☑ `008_briefing_editorial.sql` — editorial extensions on daily_briefings.
- ☐ `009_drop_vault_tables.sql` — **must apply** before vault tables are referenced anywhere. Drops product_status, collections, collection_products. Safe even if 005 wasn't applied (uses IF EXISTS).

### RLS verification
Verify on production by running these queries as a **non-admin** test user:
- ☐ `SELECT * FROM profiles WHERE id != auth.uid()` returns 0 rows.
- ☐ `SELECT * FROM daily_briefings WHERE user_id != auth.uid()` returns 0 rows.
- ☐ `SELECT * FROM comparison_verdicts WHERE user_id != auth.uid()` returns 0 rows.
- ☐ `SELECT * FROM strategic_briefs WHERE user_id != auth.uid()` returns 0 rows.
- ☐ `INSERT INTO profiles (id, email, is_admin) VALUES (auth.uid(), 'me@example.com', true)` is rejected (only triggers can set is_admin).

### Indexes
Confirmed via migration files:
- ☑ `profiles(id)` — primary key, auth.users FK.
- ☑ `daily_briefings(user_id, date)` — cache lookup.
- ☑ `comparison_verdicts(user_id, created_at desc)` + `(user_id, scores_hash)`.
- ☑ `strategic_briefs(user_id, created_at desc)` + `(user_id, scans_hash)`.

## 3 — Security

- ☐ Grep audit: `grep -rn 'SUPABASE_SERVICE_ROLE_KEY' app components` returns **zero matches** (service role must never be imported into client code). Currently clean.
- ☐ Admin email check happens in DB trigger (`003_admin_role.sql`) — not client-side. Confirmed.
- ☐ All `/api/*` routes that mutate data call `supabase.auth.getUser()` and check user is present.
- ☐ Stripe webhook signature validated using `STRIPE_WEBHOOK_SECRET`.
- ☐ No `console.log` of secrets — grep `console.log.*process.env` returns 0.
- ☐ Rate limiting: `/api/research/stream` has per-user concurrent limit (3 active, in-memory). Other mutating endpoints (`/api/credits/spend`, `/api/scrape/product`) **do not yet have rate limits** — add `@upstash/ratelimit` before public launch with significant traffic.
- ☐ `app/api/upload/route.ts` enforces file size + MIME type before storage.

## 4 — Functionality smoke tests

Run these manually before flipping the switch:

### Auth flow
- ☐ Email signup → verification email arrives → click link → lands on `/onboarding`
- ☐ Email signin with correct credentials → lands on `/dashboard`
- ☐ Email signin with wrong password → friendly error, no account lockout messaging
- ☐ Google OAuth signup → /onboarding
- ☐ Google OAuth signin → /dashboard
- ☐ Password reset request → email arrives → reset → `/auth?reset=success`
- ☐ Sign out → redirects to `/` and clears Zustand state
- ☐ Unauthenticated visit to `/dashboard` → redirected to `/auth?redirect=%2Fdashboard`

### Scan flow (all 3 tiers)
- ☐ Quick Scan completes in ~15s and produces 2 hook angles with citations
- ☐ Standard Scan completes in ~35s and produces 5 angles + 3 personas
- ☐ Deep Research completes in ~75s and produces 8 angles + PDF
- ☐ Live research feed shows real search queries (`🔍 Searching: ...`)
- ☐ Sources counter increments as scans progress
- ☐ Concurrent scan limit triggers (start 4 scans simultaneously, 4th returns 429)
- ☐ Mid-scan abort releases the rate-limit slot (audit task S-003 — open issue)

### Credits
- ☐ Top-up purchase via Stripe Test → balance increments after webhook fires
- ☐ Plan upgrade via Stripe Test → plan + balance update after webhook
- ☐ Quick Scan deducts ✦ 1 from balance
- ☐ Standard Scan deducts ✦ 4
- ☐ Deep Research deducts ✦ 9
- ☐ Strategic brief deducts ✦ 1 (post-perf-pass — was 5)
- ☐ Judge verdict deducts ✦ 3 (only relevant once compare v2 ships)
- ☐ Forced Gemini error refunds credits + shows "refunded" toast

### Plan gating
- ☐ Starter cannot trigger Reddit voice mining (gated on `features.voiceMining`)
- ☐ Starter exports include the watermark footer
- ☐ Pro removes the watermark
- ☐ Insufficient credits → InsufficientModal opens (not a plain toast)
- ☐ `/pricing?highlight=pro` → Pro card emphasized + scrolled into view

### Dashboard
- ☐ Daily briefing cached for the day — second visit doesn't fire Gemini
- ☐ Shift+B forces a regenerate (charges ✦ 1)
- ☐ Shift+1..5 jumps to sections
- ☐ Space at top of page scrolls past the cover
- ☐ Picks gallery cards open `/product/[id]` on click

### Insights
- ☐ Page opens with zero Gemini calls (cacheOnly mount)
- ☐ Strategic brief idle button → click triggers generation
- ☐ Shift+R regenerates the brief
- ☐ Shift+T cycles period
- ☐ Shift+E opens export

### Product detail
- ☐ Hook angles section renders with rank-1 featured + grid below
- ☐ Every angle card expands its disclosures
- ☐ Copy buttons on hooks + variants + captions work
- ☐ Source citation hovers show domain + title + open link
- ☐ Sources panel renders with filter chips
- ☐ Grounding badge near verdict

### Compare
- ⊘ **Currently runs v1.** Decision needed: ship v2 (in `components/compare-v2/`) or keep v1. See PRELAUNCH_AUDIT.md item C-001.

## 5 — Error & empty states

- ☑ Global error boundary (`app/error.tsx`) — added in pre-launch pass.
- ☑ Route-level error boundary (`app/(app)/error.tsx`) — added.
- ☑ App-wide 404 (`app/not-found.tsx`) — added.
- ☑ Per-product 404 (`app/(app)/product/[id]/not-found.tsx`) — already existed.
- ☐ Per-route `loading.tsx` for /dashboard, /scan, /compare, /insights, /product/[id], /credits — **not yet added.** Tracked in audit CC-005.

## 6 — Polish / consistency

These are tracked in PRELAUNCH_AUDIT.md but require larger follow-up passes:

- ☐ Form validation overhaul (react-hook-form + zod) — Part 7 of spec
- ☐ Per-component button/typography consistency pass — Part 11
- ☐ Accessibility pass (ARIA, focus, screen reader) — Part 12
- ☐ Performance pass (Lighthouse, dynamic imports, query opt) — Part 13
- ☐ Inline citations on personas/pricing/competitor sections — audit item P-003
- ☐ Saved-comparisons UI — depends on C-001 (compare v2 decision)
- ☐ Data export route — audit item ST-001

## 7 — Monitoring

- ☐ Sentry DSN configured (`SENTRY_DSN`)
- ☐ Vercel Analytics enabled on the project
- ☐ Uptime monitor on `https://wynnerlabs.com/api/health` (returns `{ok: true}` when healthy)
- ☐ Stripe webhook delivery dashboard — verify successful 200s on test events

## 8 — Legal

- ☐ Terms of Service page at `/terms` (linked from auth pages + footer)
- ☐ Privacy Policy at `/privacy`
- ☐ Refund policy mentioned on `/pricing`
- ☐ Cookie consent banner (GDPR — only if targeting EU)

## 9 — Day-of launch

- ☐ Verify `.env` parity between local + Vercel production (no missing keys).
- ☐ Run final `npx tsc --noEmit` and `npx eslint .` — confirm clean.
- ☐ Deploy to Vercel preview branch and walk all flows in Section 4 against the preview URL.
- ☐ Once preview is green, promote to production.
- ☐ Verify production with a real account — sign up, scan, top up.
- ☐ Watch Vercel logs + Sentry for the first 30 minutes after launch.

---

## Living changelog of the launch sequence

When each item flips from `☐` to `☑`, note it here with date + commit hash. Example:

- 2026-05-21 · added global error boundary (`b2d4e7`)
- 2026-05-21 · added /api error helper (`b2d4e7`)
