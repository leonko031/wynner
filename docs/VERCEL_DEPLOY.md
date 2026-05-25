# Vercel deploy — `wynnerlabs.com` (stealth waitlist launch)

Step-by-step for taking Wynner live on `wynnerlabs.com` via the Vercel
dashboard. Total time: ~15 minutes (plus DNS propagation, usually
5 min – 1 hour).

---

## 1. Import the repo in Vercel

1. Go to <https://vercel.com/new>.
2. You should already be logged in as `ilisinleon-gmailcoms-projects`. If
   prompted, pick that team (not "Personal").
3. Click **Import** next to `leonko031/wynner`.
   - If the repo isn't listed: click **Adjust GitHub App permissions** at
     the bottom, grant Vercel access to the `wynner` repo, then come back.
4. **Configure Project** screen:
   - **Project Name**: `wynner` (anything you like — this becomes the
     `*.vercel.app` URL prefix; the custom domain we add later overrides it).
   - **Framework Preset**: Next.js (auto-detected).
   - **Root Directory**: leave as `./`.
   - **Build & Output Settings**: leave defaults (Next.js handles this).
   - **Environment Variables**: paste from the table in §2 below. **DON'T
     click Deploy yet** — set the env vars first so the first build is
     correct.
5. After pasting env vars, click **Deploy**.

The first build takes ~3 min. While it's running, jump to §3 (domain).

---

## 2. Environment variables

Paste these into the **Environment Variables** section of the import
screen (or after the fact, under **Project → Settings → Environment
Variables**). Apply each to **all three environments** (Production,
Preview, Development) unless noted otherwise.

### Required (the app won't work without these)

| Key | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zvkxxdwkznjeoltcdicl.supabase.co` | From `.env.local` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_Z6mrZqVF_q7FfzB1JU1RVw_4ZagPn2j` | From `.env.local` |
| `SUPABASE_SECRET_KEY` | (grab from Supabase → Project Settings → API → "secret keys" → reveal) | **Sensitive** — server-only, never exposed to browser. Required for the admin-flag sync, waitlist signup, and the admin dashboard. |
| `GEMINI_API_KEY` | `AIzaSyD_tVGl6ys3wyG7l42J365X9bmntlzBuOE` | From `.env.local`. **Rotate before launch** — this key is shared in the local repo and has been exposed in chat. Get a fresh one at <https://aistudio.google.com/app/apikey>. |
| `ADMIN_EMAILS` | `ilisinleon@gmail.com` | Comma-separated, lowercase. Whoever's listed gets unlimited credits + the admin dashboard. |
| `NEXT_PUBLIC_WAITLIST_MODE` | `true` | Stealth launch — `/` shows the waitlist page, marketing landing is hidden. |

### Waitlist anchoring (recommended — fixes the "1 operator" optics)

| Key | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_WAITLIST_BASELINE` | `247` | Adds 247 to the public counter so it never reads as "1 operator on the list". Admin dashboard still shows real numbers. |
| `NEXT_PUBLIC_WAITLIST_DAILY_DRIFT` | `8` | Counter creeps up by 8 per day since launch date. Tune to taste. |
| `NEXT_PUBLIC_WAITLIST_LAUNCH_DATE` | `2026-05-25` | The day drift starts counting. Set this to "today" when you go live. |

### Grounding + AI behaviour (recommended)

| Key | Value | Notes |
|---|---|---|
| `GEMINI_GROUNDING_ENABLED` | `true` | Real Google Search grounding on scans. Required for Deep Research to cite sources. Costs ≈ $0.40/scan. Set `false` to disable. |

### Email (optional — only needed if you want the "email me the PDF" feature on Deep Research)

| Key | Value | Notes |
|---|---|---|
| `RESEND_API_KEY` | (grab from <https://resend.com/api-keys>) | Without this, "email me the PDF" silently no-ops and the user only gets the download. |
| `RESEND_FROM` | `Wynner <hello@wynnerlabs.com>` | Must be a verified sender domain in Resend. For testing, `onboarding@resend.dev` works without verification. |

### Power-up scrapers (optional)

| Key | Value | Notes |
|---|---|---|
| `SCRAPINGBEE_API_KEY` | (grab from <https://www.scrapingbee.com/>) | Optional. First 1000 credits free. Used for product page scraping. Without it, scrapers degrade to ungated fetch. |
| `REDDIT_CLIENT_ID` | | Optional — voice mining. See `docs/REDDIT_SETUP.md`. |
| `REDDIT_CLIENT_SECRET` | | |
| `REDDIT_USER_AGENT` | `wynner/1.0 by u/ilisinleon` | |
| `REDDIT_USERNAME` | | Either USERNAME+PASSWORD **or** REFRESH_TOKEN, not both. |
| `REDDIT_PASSWORD` | | |
| `REDDIT_REFRESH_TOKEN` | | |

### Do NOT add these to Vercel

These are local-only — they're for autonomous Supabase migrations from
your machine and have no business in a production environment:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`

---

## 3. Add `wynnerlabs.com` to the project

1. Once the first build finishes, go to **Project → Settings → Domains**.
2. Type `wynnerlabs.com` → **Add**.
3. Vercel will ask whether to also add `www.wynnerlabs.com`. **Yes** — and
   set `www.wynnerlabs.com` to **redirect to `wynnerlabs.com`** (or the
   other way around if you prefer `www`; pick one canonical host).
4. Vercel shows you the DNS records you need to add at your registrar.
   Keep this tab open — you'll need the exact values in §4.

The status will say **"Invalid Configuration"** until DNS propagates.
That's expected.

---

## 4. Add DNS records at your registrar

Log into your domain registrar's DNS panel (whoever owns
`wynnerlabs.com`) and add **both** of these records. Delete any conflicting
existing A/CNAME records on the same hosts first.

### For the apex (`wynnerlabs.com`)

| Type | Name | Value | TTL |
|---|---|---|---|
| `A` | `@` (or blank) | `76.76.21.21` | Auto / 3600 |

### For `www`

| Type | Name | Value | TTL |
|---|---|---|---|
| `CNAME` | `www` | `cname.vercel-dns.com.` | Auto / 3600 |

> **Cloudflare users**: turn the orange proxy cloud **OFF** (DNS only / grey
> cloud) for both records. Cloudflare's proxy interferes with Vercel's
> automatic SSL provisioning. You can re-enable later if you really need
> it, but it's not recommended.

> **GoDaddy / Namecheap / Google Domains**: just paste the records as-is.

Save, then come back to Vercel → **Domains** and click the **Refresh**
icon next to `wynnerlabs.com`. Within 5 min – 1 hour the status flips to
**"Valid Configuration"** and Vercel auto-provisions an SSL certificate.

---

## 5. Wire Supabase auth to the production domain

Supabase needs to know that requests coming from `wynnerlabs.com` are
legitimate, otherwise auth redirects will fail. Do this once:

1. Open <https://supabase.com/dashboard/project/zvkxxdwkznjeoltcdicl/auth/url-configuration>
2. **Site URL**: `https://wynnerlabs.com`
3. **Redirect URLs** (add all four):
   - `https://wynnerlabs.com/auth/callback`
   - `https://wynnerlabs.com/**`
   - `http://localhost:3000/auth/callback` (keep for dev)
   - `http://localhost:3000/**`
4. **Save changes**.

If you're using Google OAuth, also update the authorized redirect URI in
Google Cloud Console (see `docs/SETUP_GOOGLE_AUTH.md`) — add
`https://zvkxxdwkznjeoltcdicl.supabase.co/auth/v1/callback` if it's not
already there (it should be — that URL is the same for any custom domain
since auth bounces through Supabase, not the app domain).

---

## 6. Verify the launch

Once DNS is green:

1. **<https://wynnerlabs.com>** loads the waitlist page.
2. Submit a test email. Confirm:
   - You see "You're in." with a position number.
   - The position uses the baseline (`#248` if baseline is 247 and you're
     the first real signup).
   - The row appears in `/admin/waitlist` (sign in with
     `ilisinleon@gmail.com` first).
3. **<https://wynnerlabs.com/admin/waitlist>** loads after admin sign-in.
4. **<https://wynnerlabs.com/og-waitlist>** returns the 1200×630 OG image
   (used for Twitter/iMessage link previews).
5. Test a link preview by pasting `https://wynnerlabs.com` into an iMessage
   or Slack thread — you should see "Something is coming." + the aurora
   gradient pill.

---

## 7. Going from stealth → public launch

When you're ready to flip from waitlist mode to the full marketing site:

1. **Project → Settings → Environment Variables** → edit
   `NEXT_PUBLIC_WAITLIST_MODE` → set to `false`.
2. **Deployments** → click the latest deployment's **⋯** menu →
   **Redeploy** (no rebuild needed; pick "Use existing Build Cache").

Within ~30 seconds, `/` switches to the full marketing landing. No code
changes, no Git push.

---

## Quick troubleshooting

| Symptom | Fix |
|---|---|
| Build fails: `Supabase URL is required` | You forgot `NEXT_PUBLIC_SUPABASE_URL` in env vars. Add it, redeploy. |
| Waitlist signup returns 500 | `SUPABASE_SECRET_KEY` missing in production env. Add it. |
| Domain stuck at "Invalid Configuration" after 1 hour | DNS hasn't propagated yet — check at <https://dnschecker.org/#A/wynnerlabs.com>. If it's `76.76.21.21` worldwide and Vercel still says invalid, click Refresh again. |
| SSL fails to provision | Almost always Cloudflare proxy. Disable it (grey cloud), wait 5 min. |
| Auth redirects to localhost in production | Supabase **Site URL** is still set to localhost. Fix in §5. |
| Counter shows "1 operator" | `NEXT_PUBLIC_WAITLIST_BASELINE` isn't set, or is `0`. Set to `247` or higher. |
