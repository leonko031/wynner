# Auth setup — Supabase + Google OAuth

Total time: ~10 minutes for Supabase + ~10 minutes for Google. You can ship
email/password sign-in without Google; come back to it later.

---

## 1. Create a Supabase project (2 min)

1. Go to <https://supabase.com> and sign in / sign up
2. Click **New project**
3. Name: `wynner` (or anything). Pick a region near you. Database password:
   save somewhere secure
4. Wait ~30 seconds for the project to boot

## 2. Copy your three env vars

From the project dashboard → **Settings → API**:

| Field in Supabase | Goes in `.env.local` as |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| Project API keys → `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Project API keys → `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ The `service_role` key bypasses RLS — never expose it to the browser. The
> `NEXT_PUBLIC_` prefix is intentional only for the first two.

Restart your dev server after pasting (`npm run dev`).

## 3. Run the SQL migration (1 min)

In your Supabase dashboard → **SQL Editor → New query**, paste the entire
contents of [`supabase/migrations/001_auth_profiles.sql`](../supabase/migrations/001_auth_profiles.sql)
and click **Run**.

This creates:
- the `profiles` table mirroring auth.users
- row-level security policies
- a trigger that auto-creates a profile on every signup

You should see `Success. No rows returned.` and the `profiles` table appearing
under **Table Editor**.

## 4. Test email/password sign-up (1 min)

1. Visit <http://localhost:3000/auth>
2. Switch to **Create account**
3. Enter your real email + a strong password
4. Submit → you'll be redirected to `/auth/verify`
5. Open the magic email in your inbox (or check **Auth → Users → Logs** in
   Supabase if it's not arriving) → click the link
6. You'll land on `/onboarding` for the first time

If it works, you're done with the minimum setup. Continue below to enable
Google sign-in.

---

## 5. Google Cloud — OAuth consent screen (5 min)

1. Open <https://console.cloud.google.com>
2. Create a project (or pick an existing one) — top bar → project picker → **New Project**
3. Side nav → **APIs & Services → OAuth consent screen**
4. Choose **External** user type → **Create**
5. Fill in:
   - **App name**: `Wynner`
   - **User support email**: your email
   - **Developer contact**: your email
   - Leave everything else blank — Google will yell if it actually requires more
6. **Save and continue** → on the scopes screen, click **Add or remove scopes**:
   - Check `openid`
   - Check `.../auth/userinfo.email`
   - Check `.../auth/userinfo.profile`
   - **Update** → **Save and continue**
7. On the **Test users** step, add the email you'll use to test. You can have
   up to 100 test users in "Testing" mode without going through verification.
8. **Save and continue** → **Back to dashboard**

The status will say "Testing" — that's perfect. You don't need verification
until you're public-facing.

## 6. Create the OAuth client (3 min)

1. Side nav → **APIs & Services → Credentials**
2. **+ Create credentials → OAuth client ID**
3. **Application type**: Web application
4. **Name**: `Wynner Web Client`
5. **Authorized JavaScript origins** — add:
   - `http://localhost:3000`
   - `https://your-production-domain.com` (once you have one)
6. **Authorized redirect URIs** — add:
   - `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`

   Find `<YOUR_PROJECT_REF>` in Supabase dashboard → **Settings → API → Project URL**
   (the part before `.supabase.co`).
7. **Create**
8. A modal pops up — **copy the Client ID and Client Secret** (you can come
   back for them, but it's easier to do it now)

## 7. Paste into Supabase (1 min)

1. Supabase dashboard → **Authentication → Providers**
2. Find **Google** → click to expand
3. Toggle **Enable sign-in with Google**
4. **Client ID (for OAuth)**: paste your Google Client ID
5. **Client Secret (for OAuth)**: paste your Google Client Secret
6. The **Callback URL** Supabase shows should match what you added to Google
   in step 6 — double-check
7. **Save**

## 8. Test it

1. Visit <http://localhost:3000/auth>
2. Click **Continue with Google**
3. Pick the Google account you added as a test user
4. You'll bounce through Google → Supabase → `/auth/callback` → `/onboarding`
   (on first sign-in) or `/dashboard` (returning users)

Done.

---

## Troubleshooting

**"redirect_uri_mismatch"** — The URI in Google doesn't exactly match the
Supabase callback. Copy the URL from Supabase **verbatim**, paste into Google,
save. Wait ~30 seconds for Google to propagate.

**"This app hasn't been verified"** — Expected while in Testing mode. Test
users see a warning they can click past. To remove the warning, submit the
app for verification in OAuth consent screen → **Publish app**.

**"Email not confirmed" after signup** — Either the user clicked the link in
a different browser (cookies aren't shared) or the email hasn't arrived yet.
Use the **Resend** button on `/auth/verify`. If still not arriving, check
Supabase → **Authentication → Email Templates** to verify they're enabled,
and **Settings → Auth → SMTP** if you've configured custom SMTP.

**"User exists but no profile row"** — This shouldn't happen with the trigger
in `001_auth_profiles.sql`, but if it does, re-run the migration. The bottom
of the SQL contains a backfill block that handles existing users.

**Google sign-in works, but `/onboarding` redirects to `/dashboard`** — The
profile row has `onboarding_completed: true`. Reset it for that user:
```sql
update public.profiles set onboarding_completed = false where email = 'you@example.com';
```

**Local dev keeps signing me out** — The Supabase auth cookie is per-domain
and the local cookie can collide with another project. Open dev tools →
Application → Cookies → `http://localhost:3000` → clear `sb-*` cookies.
