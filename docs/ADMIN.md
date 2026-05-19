# Admin role

Wynner has an admin role that grants **unlimited credits** (∞) and access to
`/admin`. Admins are identified by a **hardcoded email list in env vars** —
never via a UI path — so the role can't be granted from inside the running
application.

---

## How it works

```
ADMIN_EMAILS env var   →   profiles.is_admin (Postgres column)
       │                        │
       │                        └→ RLS-checkable, drives UI + spend bypass
       │
       └→ Server reads on every signin via syncAdminFlag()
```

The single source of truth is `ADMIN_EMAILS` in `.env.local`. We **mirror**
that into `profiles.is_admin` so RLS policies and the UI can check admin
status cheaply without re-reading env on every request.

`syncAdminFlag()` runs:
- After every `/auth/callback` (OAuth, magic link, email confirmation)
- Inside `getServerUser()` once per minute per user as a safety net

Both paths require `SUPABASE_SECRET_KEY` to be set — `is_admin` is locked
from authenticated writes by RLS, so only the service role can flip it.

---

## Adding an admin

1. Edit `.env.local`:
   ```
   ADMIN_EMAILS=you@example.com,teammate@example.com
   ```
   Comma-separated, lowercase, no spaces.

2. **Restart the dev server** (Next.js doesn't hot-reload env vars).

3. Either:
   - **Recommended**: sign in (or sign out + back in) — `syncAdminFlag` fires
     and updates the profile within ~60 seconds, OR
   - **Immediate**: run the sync script:
     ```
     npx tsx scripts/sync-admin-flags.ts
     ```
     This walks every profile and reconciles `is_admin` against the env list.

Either way, the next page load shows the admin UI (∞ pill, admin badge in
the avatar dropdown, `/admin` accessible).

## Removing an admin

1. Edit `.env.local` — remove the email.
2. Restart the dev server.
3. The next time that user signs in (or after ~60s of activity in another
   session), `syncAdminFlag` flips `is_admin` back to `false`.
   - For instant removal, run `npx tsx scripts/sync-admin-flags.ts`.

---

## Why no UI to grant admin?

Security. If anyone could see a "make this user admin" button in any panel,
that's a privilege-escalation surface area. Hardcoding the list in env (which
only people with deploy access can change) eliminates that class of bug
entirely.

The corollary: **there is no recovery flow if you lock yourself out of
admin** by accident. Edit the env var, restart, sync. That's the only path.

---

## What admins see

| Surface | Behavior for admins |
|---|---|
| Credit pill in top nav | Shows `∞` with an aurora-gradient crown icon |
| Credit popover | "Admin access" badge, no usage bar, no upgrade CTAs |
| Cost preview (e.g. before a scan) | Shows the real cost + "(free for you)" suffix |
| Pricing page | Glass banner at the top + "Already unlocked" on every plan/topup CTA |
| Avatar dropdown | Aurora-gradient "Admin" pill + "Admin panel" menu item |
| `/admin` route | Renders the placeholder panel + live stats |

**The admin UI is purely cosmetic** — removing the badge via DevTools doesn't
grant any actual privilege. The bypass lives in `lib/store/credits.ts`
(`spend()` checks `state.isAdmin`) and the server-side
`/api/credits/spend` route (which reads `is_admin` from the DB, not the
request body).

---

## Testing locally

1. Set `ADMIN_EMAILS=youremail@example.com` in `.env.local`.
2. Restart the dev server.
3. Sign up at `/auth?mode=signup` with that email.
4. After the signup completes, you should see:
   - The credit pill shows ∞
   - The avatar dropdown shows the Admin pill
   - `/admin` is accessible
   - Trying to run a scan: the cost preview shows "(free for you)" and the scan completes without debiting credits

If you're already signed in when you change the env list, sign out and back
in (or run the sync script) — the in-memory cache is per-process, so a
server restart also picks up the change.

---

## What we deliberately don't ship

- **UI to add admins** — see "Why no UI to grant admin?" above.
- **Auto-elevation by domain (`@company.com`)** — too easy to accidentally
  promote whole orgs. Explicit list only.
- **Time-limited admin sessions** — admin status is binary and persistent.
  Add a TTL if you ever need break-glass admin promotions for support staff.

---

## Security invariants

1. `ADMIN_EMAILS` is **server-only** — never imported in a client component.
   `lib/auth/admin.ts` starts with `import "server-only"` to enforce this at
   build time.
2. `profiles.is_admin` cannot be written by an authenticated user — the RLS
   policy from migration `003` blocks any UPDATE that would change the value
   of the column. Only the service role bypasses this.
3. `/api/credits/spend` reads `is_admin` from the database, never from the
   request body. A tampered client cannot pretend to be admin.
4. `/admin` routes are gated in two places: the root middleware (cheap, runs
   per request) AND `requireAdmin()` server-side (defense in depth).
