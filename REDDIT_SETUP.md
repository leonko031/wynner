# Reddit voice mining — setup

Wynner can mine real Reddit threads to surface verbatim buyer language for any
scored product. This is gated behind a settings toggle so it never burns Reddit
quota by surprise. About **5 minutes** of one-time setup.

## 1. Create a Reddit app

1. Sign in to Reddit and open https://www.reddit.com/prefs/apps
2. Scroll to **"are you a developer? create an app..."**
3. Click **create app** and fill in:
   - **name**: `wynner-local` (anything is fine)
   - **type**: select **script** — this is the simplest auth flow for personal use
   - **description** / **about url**: leave blank
   - **redirect uri**: `http://localhost:3000` (required field, unused by script apps)
4. Click **create app**

You'll see:
- A 14-char string under the app name → this is your **client ID**
- A field labelled **secret** → this is your **client secret**

## 2. Add env vars

Copy `.env.local.example` to `.env.local` if you haven't already, then fill in:

```bash
REDDIT_CLIENT_ID=<the 14-char string under your app name>
REDDIT_CLIENT_SECRET=<the secret>
REDDIT_USER_AGENT=wynner/1.0 by u/<your-reddit-username>
REDDIT_USERNAME=<your-reddit-username>
REDDIT_PASSWORD=<your-reddit-password>
```

> The user-agent string matters — Reddit will rate-limit hard if it's generic.
> Including your username in it is the convention Reddit asks for.

If your account has 2FA enabled, append your TOTP code to the password as
`password:TOTP`. (Recommended: use a dedicated Reddit account for scraping, no
2FA.)

### Alternative: refresh-token flow

If you have a refresh token from a previously-OAuth'd installed app, you can
use it instead of username + password:

```bash
REDDIT_REFRESH_TOKEN=<token>
```

The client prefers `REDDIT_REFRESH_TOKEN` when both are present.

## 3. Restart `npm run dev`

Env changes only take effect on a server restart.

## 4. Enable voice mining in Settings

Open http://localhost:3000/settings and:

1. Confirm the **Reddit voice mining** section shows
   "Connected as u/<your-username>"
2. Toggle **Enable Reddit insights** on
3. Click **Test connection** to verify

## What happens when it runs

Each scored product can trigger a voice mining pass that:

1. Asks Gemini Flash for 5–8 candidate subreddits
2. Searches each subreddit for posts matching the product name
3. Pulls top comments from the most-engaged posts
4. Sends the corpus to Gemini Pro for structured extraction

**Quota cost**: ~30–50 Reddit API calls per scan (well under the 60/min limit).
**Wall time**: 20–35 seconds typically. Gated by Reddit and the second Gemini
call.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `Connected as u/...` never appears in Settings | Wrong `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET`, or the app type is not "script" |
| `401 unauthorized` toast on Test connection | Username/password mismatch, or 2FA without `:TOTP` suffix |
| `No Reddit threads matched this product` | Product name is too generic or the subreddits returned have no recent matching posts. Try editing the product description to be more specific. |
| `Reddit rate limit (429)` | You burned the per-minute quota. Wait a minute. |
