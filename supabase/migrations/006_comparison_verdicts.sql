-- ===========================================================================
-- Wynner — comparison verdicts cache (v6)
-- ===========================================================================
-- Stores every Gemini-generated comparison verdict so:
--   • Re-opening the same comparison doesn't re-call Gemini (cache hit)
--   • Re-scoring any of the products invalidates the cache (scores_hash)
--   • Users get a "saved comparisons" history for free
--
-- product_ids is `text[]`, NOT `uuid[]`, because products themselves still
-- live in the client's local store (deferred Postgres migration). See the
-- header on supabase/migrations/005_collections.sql for the rationale.
--
-- Idempotent: safe to re-run.
-- ===========================================================================

create extension if not exists pgcrypto;

create table if not exists public.comparison_verdicts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users on delete cascade not null,
  product_ids        text[] not null,
  /**
   * Deterministic hash of the participating products' current sell scores.
   * The API recomputes this on every request — if it doesn't match what's
   * stored, the cached row is stale and we regenerate.
   */
  scores_hash        text not null,
  winner_product_id  text not null,
  declaration        text not null,
  why_bullets        text[] not null,
  tradeoff_bullets   text[] not null,
  recommendation     text not null,
  confidence_level   text not null check (confidence_level in ('low', 'medium', 'high')),
  created_at         timestamptz default now()
);

create index if not exists idx_comparison_verdicts_user_created
  on public.comparison_verdicts (user_id, created_at desc);

-- Cache lookup uses (user_id, product_ids, scores_hash). Postgres can't put
-- arrays in a regular b-tree, but a GIN on product_ids + a b-tree on the
-- pair (user_id, scores_hash) is enough — at the row count we'll see per
-- user, a sequential scan over user's rows + array equality is fine.
create index if not exists idx_comparison_verdicts_lookup
  on public.comparison_verdicts (user_id, scores_hash);

-- ---------- RLS ----------------------------------------------------------
alter table public.comparison_verdicts enable row level security;

drop policy if exists "Users own their verdicts" on public.comparison_verdicts;
create policy "Users own their verdicts"
  on public.comparison_verdicts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins can view all verdicts" on public.comparison_verdicts;
create policy "Admins can view all verdicts"
  on public.comparison_verdicts for select
  using (public.is_admin(auth.uid()));
