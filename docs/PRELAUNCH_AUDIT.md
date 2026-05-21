# Wynner — Pre-launch audit

> **Status:** First pass. This document records the *actual* state of the codebase as of commit `92ae0e3` (post-scan-upgrade), not the aspirational state implied by the pre-launch spec.
>
> **How to use it:** Work top-down. Every 🔴 Critical issue should be fixed before any 🟢 polish. The numbered IDs let us track work in commits — reference them in commit messages and check the box here.

## Categories

| Icon | Severity | Definition |
|---|---|---|
| 🔴 | Critical | Blocks a core user flow. App is broken without this. |
| 🟠 | Broken | A button/link/state that is non-functional or missing. User can route around it but it's visibly wrong. |
| 🟡 | Inconsistent | Works, but design/copy/behavior doesn't match the rest of the app. |
| 🟢 | Polish | Works and looks fine, but could be sharper. |

---

## Cross-cutting findings (apply to many routes)

### CC-001 🔴 No global error boundary
`app/error.tsx` does not exist. Any uncaught render error renders Next's default 500 screen — no glass styling, no "go home" CTA.
- **Fix:** Add `app/error.tsx` + `app/(app)/error.tsx` with glass-styled "something went sideways" + Try again / Dashboard buttons.

### CC-002 🔴 No app-wide 404 page
`app/not-found.tsx` does not exist. Visiting any unknown route gets Next's default 404.
- **Fix:** Add `app/not-found.tsx` with friendly copy + nav back to `/dashboard`.

### CC-003 🟠 No route-level error boundaries
Only the global one (after CC-001) catches everything; per-route errors lose context.
- **Fix:** Add `app/(app)/error.tsx` so an error on /insights doesn't blow up the whole tab.

### CC-004 🟠 No reusable API error helper
Every fetch site implements its own 401/402/429 handling. Some forget 429 entirely.
- **Fix:** `lib/utils/api-error.ts` with `handleApiError(err, fallbackMessage)` → maps 401→redirect, 402→insufficient modal, 429→rate-limit toast, 5xx→retry toast, network error→connection toast.

### CC-005 🟠 No `app/(app)/loading.tsx`
First navigation into any (app) route shows a flash of empty before content lands. There's no global skeleton.
- **Fix:** Per-route `loading.tsx` matching the page's final layout (skeleton cards for dashboard, skeleton list for insights, etc.).

### CC-006 🟡 No `.env.local.example` for grounding flag
`GEMINI_GROUNDING_ENABLED` is read at runtime but missing from the documented env.
- **Fix:** Add to `.env.local.example` with default `true` and an explanatory comment.

### CC-007 🟡 Migration history has a gap
`supabase/migrations/` jumps from `001` to `003` (no `002`). Functionally fine — Supabase allows non-contiguous numbering — but confusing for new contributors.
- **Fix:** Leave as-is (renumbering applied migrations is destructive). Add a NOTE.md in the migrations dir explaining that 002 was never written.

### CC-008 🟢 No `<title>` per route
Every page renders the root `<title>`. Bad for SEO + bad for tab switching.
- **Fix:** `export const metadata` per route with descriptive titles.

---

## `/` — Marketing landing (`app/(marketing)/page.tsx`)

### M-001 🟢 No specific empty/error state needed
Static marketing — no async work. Fine as-is.

### M-002 🟡 Pricing CTAs both point to `/pricing` (consolidate or split intent)
Multiple CTAs labeled "Get started" / "See pricing" both link to `/pricing`. User can't sign up directly from the landing.
- **Fix:** Primary CTA → `/auth?mode=signup`. Pricing link separate.

---

## `/auth`, `/auth/callback`, `/auth/verify`, `/auth/reset` — Auth flows

### A-001 🟢 Sign-out wiring is correct
`useUser().signOut` calls `supabase.auth.signOut()` then `window.location.href = "/"`. Clears React state via re-mount. Confirmed working.

### A-002 🟠 No `?error=` toast on `/auth` for failed OAuth callbacks
If the callback hits an error and redirects back with `?error=oauth_failed`, the auth page doesn't surface anything — just sits there with no feedback.
- **Fix:** Read `searchParams.error` in `auth/page.tsx`, render a one-shot dismissable error toast on mount.

### A-003 🟡 No password strength meter on signup
Spec calls for one. Currently the password field is plain.
- **Fix (deferred):** Add `react-hook-form` + a small zxcvbn-style meter — out of scope for this audit pass.

### A-004 🟡 No "remember me" checkbox
Spec calls for a 90-day extended session. Currently uses Supabase default.
- **Fix (deferred):** Add checkbox + `persistSession` mode. Out of scope for this pass.

---

## `/onboarding` (`app/onboarding/page.tsx`)

### O-001 🟢 No findings on first pass
Onboarding wizard saves preferences to `profiles` and lands on `/dashboard`. Working.

---

## `/dashboard` (`app/(app)/dashboard/page.tsx`) — v3 cinematic

### D-001 🟠 `Shift+1..5` shortcut docs in welcome toast disagree with help dialog
Welcome toast says `Shift+1..5 to jump`. Shortcuts dialog (?) lists the older `1..5` bare keys.
- **Fix:** Update shortcuts dialog to reflect the Shift-gated keys we landed in the perf pass (commit `a5062ce`).

### D-002 🟠 `B` / `N` shortcuts require Shift but the welcome toast doesn't say so
Toast says "Shift+B refreshes the briefing" — but `Shift+N` for next-move is undocumented.
- **Fix:** Same as D-001.

### D-003 🟡 Picks gallery cards are full-card `<Link>` — child interactive elements unreachable
Clicking the favorite heart inside a pick card navigates to the product instead of toggling favorite.
- **Fix:** Move the favorite heart outside the Link (or stopPropagation + preventDefault in its onClick).

### D-004 🟡 LoadCurtain referenced in `global-canvas.tsx` is exported but no longer used
Dead code — `LoadCurtain` was removed from the dashboard in the perf pass but the export remains.
- **Fix:** Remove the `LoadCurtain` export from `components/dashboard-v3/global-canvas.tsx`.

### D-005 🟢 Dashboard skeleton on first visit
There's no `app/(app)/dashboard/loading.tsx`. First visit flashes briefly.
- **Fix (deferred):** Add a tier-specific skeleton. Out of scope for this pass.

---

## `/compare` (`app/(app)/compare/page.tsx`) — **STILL v1**

### C-001 🔴 The page imports v1 components, not the v2 build we shipped
`compare-v2/` directory contains champion cards, hook-angle-aware comparison, judge verdict, tie-breaker, what-if mode, PDF export — none of it is wired up. The shipped `/compare` page renders the old 3-slot table.
- **Visible impact:** User goes to /compare expecting the verdict feature, sees the old v1 page. The README and changelog claim v2 features that don't exist on the deployed route.
- **Fix:** Rewrite `app/(app)/compare/page.tsx` to use `components/compare-v2/` — OR delete `compare-v2/` entirely as unused. **Decision needed from product.**
- **This is the single biggest broken claim in the app right now.**

### C-002 🟠 No "saved comparisons" UI in v1
v1 doesn't expose the `comparison_verdicts` table contents to users — there's no history of past comparisons.
- **Fix (depends on C-001):** Either wire v2 (which has the history rail) or build into v1.

### C-003 🟡 v1 product picker uses different design tokens than the rest of the app
Older modal pattern. Fine on its own, drifts from the unified dialog style.
- **Fix (depends on C-001):** Resolved if v2 ships.

---

## `/insights` (`app/(app)/insights/page.tsx`) — v2

### I-001 🟢 Auto-load is cache-only (post perf pass)
All three Gemini calls (profile-tags, strengths-blindspots, brief) pass `cacheOnly: true` on mount. Confirmed working.

### I-002 🟠 Calendar heatmap cells + score-distribution bars have no click target
We removed the `/vault` drill links in the vault-removal pass. The cells are now display-only but the cursor still shows pointer in some states.
- **Fix:** Verify `cursor: default` everywhere on those cells; update aria-label to reflect "view only".

### I-003 🟡 "Export insights as PDF" button label inconsistent
Card text says "Export insights as PDF", aria-label says "Export PDF".
- **Fix:** Pick one. Prefer "Export PDF" everywhere for consistency.

### I-004 🟢 Comparison history rail
Renders past comparisons from `comparison_verdicts`. Confirmed working but blocked by C-001 (compare v1 doesn't write to that table).

---

## `/scan` and sub-steps

### S-001 🟢 Three-tier scan now does grounded research
Post-upgrade (commits `baa2aad` → `92ae0e3`). End-to-end works. No critical findings.

### S-002 🟠 Step 1 (product details) form has no inline validation
Empty name/price submits and fails server-side, no inline feedback.
- **Fix:** Add `react-hook-form` + zod schema. **Deferred — this is the entry-point form rewrite called for in Part 7 of the spec.**

### S-003 🟠 No abort button mid-scan
Live research UI shows progress but no way to cancel a scan in flight. User has to wait the full ~75s for Deep.
- **Fix:** Add a cancel button that calls `abortRef.current?.abort()`. The route already releases the rate-limit slot via the stream `cancel()` callback.

### S-004 🟡 Cost-preview hidden behind depth selector
Selector shows credit costs per tier card, but if the user is mid-form on Step 1, there's no "this will cost ✦ X" indicator near the Generate button.
- **Fix:** Sticky cost summary in Step 3.

### S-005 🟡 Image upload error states unclear
Failed uploads (file too large, network error) just toast generic message.
- **Fix:** Specific messages per failure mode.

---

## `/product/[id]` (`app/(app)/product/[id]/page.tsx`)

### P-001 🟢 Hook angles section + sources panel landed
Confirmed rendering post-scan-upgrade.

### P-002 🟠 "Generate ads from this angle" button is intentionally disabled
The placeholder tooltip is correct ("coming soon"). But the button visually looks identical to working ones, so users click it expecting work.
- **Fix:** Stronger disabled styling — `cursor-not-allowed`, more opacity reduction, no hover effect.

### P-003 🟠 Source citations in non-angle sections aren't rendered
Personas, pricing, competitor landscape all have a `sources: number[]` field on the type — but only the hook-angles section renders citation superscripts. Other sections show no inline citations.
- **Fix (deferred):** Walk each results-page section, add `<Citations sources={section.sources} all={report.sources} />` at the end of cited claims. Per-section refactor — substantial work.

### P-004 🟡 Back button uses `window.history.back()`
If the user lands on a product detail page from a direct link, "Back" does nothing or goes to a previous unrelated tab.
- **Fix:** Fallback to `/dashboard` when `window.history.length <= 1`.

### P-005 🟢 Re-score / favorite / archive all work
Confirmed.

---

## `/credits` (`app/(app)/credits/page.tsx`)

### CR-001 🟠 Transaction history has no pagination
All transactions render in one list. Heavy users (post-launch) will scroll a thousand rows.
- **Fix:** Paginate to 50 per page, or virtualize.

### CR-002 🟡 "View related product" link absent from credit-spend rows
Each `credit_transactions.product_id` could deep-link to the product. Currently doesn't.
- **Fix:** Add an inline icon-link when `product_id` is present.

### CR-003 🟢 Top-up + upgrade CTAs work
Both flow into `/pricing` correctly.

---

## `/pricing` (`app/pricing/page.tsx`)

### PR-001 🟢 Stripe checkout flow exists
`/api/checkout/subscription` + `/api/checkout/topup` route handlers exist. End-to-end is gated on real Stripe products + price IDs being configured in `stripe-config.ts` (see LAUNCH_CHECKLIST.md).

### PR-002 🟡 `?highlight=` param ignored
Spec calls for upsell modals to pass `?highlight={plan}` and have the pricing page visually emphasize that plan. Currently the param is ignored.
- **Fix:** Read `searchParams.highlight`, scroll to the matching plan card on mount, add a ring/glow until interacted with.

---

## `/settings` (`app/(app)/settings/page.tsx`)

### ST-001 🟠 No "Export all data" implementation
Settings page mentions data export per spec, but there's no actual button/route.
- **Fix (deferred):** Build an `/api/data/export` route that bundles the user's products + transactions + briefings into a downloadable JSON. Real work — out of scope here.

### ST-002 🟡 Compact-mode toggle copy mentions "vault" (we removed it)
Caught in vault-removal pass and patched. ✓ Confirmed clean.

### ST-003 🟢 Theme toggle, profile name save, default-country save all working
Confirmed.

---

## `/admin` (`app/admin/page.tsx`)

### AD-001 🟠 No row-level admin tools beyond diagnostics
Spec calls for force-refresh-briefing, prompt+response viewer, cost report. Some of these exist on individual pages (insights/dashboard admin-diagnostics cards) but no `/admin` central control panel.
- **Fix (deferred):** Out of scope for this pass. Acceptable for launch — admin is the operator alone.

### AD-002 🟢 Server-side admin check works
`is_admin` is set via DB trigger from `ADMIN_EMAILS`. RLS policies on admin-readable tables verified.

---

## API routes — security + reliability

### API-001 🟠 No structured error response shape
Different routes return different error shapes: some `{ error: "string" }`, some `{ error: { code, message } }`, some plain text.
- **Fix:** Standardize on `{ error: { code, message, details? } }`. Adopt over time.

### API-002 🟠 No global rate limiting on credit-spending endpoints
`/api/research/stream` has per-user concurrent limit (3 active). Other endpoints (`/api/credits/spend`, `/api/scrape/product`, `/api/voice`) have no rate limit at all.
- **Fix:** Wrap mutating endpoints with `@upstash/ratelimit` or a similar middleware. Out of scope for this pass — Vercel-edge limit can hold for soft launch.

### API-003 🟢 RLS policies enforced on all user-data tables
Verified via migration files. Profiles, daily_briefings, comparison_verdicts, strategic_briefs, strengths_blindspots, operator_profile_tags all have "user owns row" + admin-readable policies.

### API-004 🟡 `/api/health` returns minimal info
Just `{ ok: true }`. Could include DB ping + Gemini reachability for uptime monitors.
- **Fix (deferred):** Optional pre-launch polish.

---

## Deferred — work explicitly punted to follow-up passes

These items are real findings from the spec but require substantial refactors beyond the launch-readiness foundation. Each is its own ticket-sized piece of work.

1. **Form validation overhaul** — install `react-hook-form` + `zod`, refactor scan/auth/settings/collection forms. (Part 7)
2. **Consistency pass across the design system** — audit every button/typography/color usage across ~150 components. (Part 11)
3. **Accessibility pass** — ARIA labels, focus management, keyboard nav, screen-reader testing. (Part 12)
4. **Performance pass** — Lighthouse runs, image opt audit, dynamic imports, query optimization. (Part 13)
5. **Inline citations on every results-page section** — personas, pricing, competitor landscape, risk. (P-003)
6. **Per-route loading skeletons** matching the final layout. (CC-005)
7. **Saved-comparisons UI history** — depends on C-001 decision.
8. **Compare v1 → v2 migration** — biggest single decision, depends on product preference. (C-001)
9. **Data export route** — `/api/data/export` to bundle user data. (ST-001)
10. **Central admin panel** — beyond per-page diagnostics cards. (AD-001)

---

## What this pass fixes (commit-tracked)

This audit pass directly addresses:
- CC-001, CC-002, CC-003 — global + route error boundaries + 404 (`app/error.tsx`, `app/(app)/error.tsx`, `app/not-found.tsx`)
- CC-004 — API error helper (`lib/utils/api-error.ts`)
- CC-006 — env example
- D-001, D-002 — keyboard shortcut docs synced
- D-004 — dead code removal
- I-002 — display-only cursor on heatmap cells
- I-003 — PDF button label consistency
- P-002 — disabled button styling
- P-004 — back-button fallback
- PR-002 — `?highlight=` plan emphasis

Everything else moves into the deferred list above and gets tracked per item in `/docs/LAUNCH_CHECKLIST.md`.
