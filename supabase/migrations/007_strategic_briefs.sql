-- ===========================================================================
-- Wynner — Strategic Briefs (v7) — Insights hub server-side caches
-- ===========================================================================
-- Three related tables, all keyed by user:
--
--   strategic_briefs        — Gemini Pro long-form weekly brief (✦ 5)
--   strengths_blindspots    — Gemini Flash short strengths + blindspots (✦ 1)
--   operator_profile_tags   — Gemini Flash 4 "self-portrait" tags (free)
--
-- Each row stores the inputs (scans_hash, period_start/end) so the API can
-- decide cache hit/miss + invalidate when the user's scan history changes.
--
-- product_ids inside payload jsonb columns are plain strings (products live
-- in localStorage). Same convention as 005/006.
--
-- Idempotent: safe to re-run.
-- ===========================================================================

create extension if not exists pgcrypto;

-- ---------- strategic_briefs ---------------------------------------------
create table if not exists public.strategic_briefs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users on delete cascade not null,
  /** YYYY-MM-DD bounds of the period this brief covers. */
  period_start      date not null,
  period_end        date not null,
  /** Hash of the user's scan history at generation time — invalidates cache. */
  scans_hash        text not null,
  /** Cached Gemini outputs. */
  portrait          text not null,
  whats_working     jsonb not null,
  needs_attention   jsonb not null,
  hypothesis        text not null,
  plan              jsonb not null,
  /** Optional saved label so users can browse past briefs. */
  saved_label       text,
  created_at        timestamptz default now()
);

create index if not exists idx_strategic_briefs_user_created
  on public.strategic_briefs (user_id, created_at desc);

create index if not exists idx_strategic_briefs_lookup
  on public.strategic_briefs (user_id, scans_hash);

alter table public.strategic_briefs enable row level security;

drop policy if exists "Users own their briefs" on public.strategic_briefs;
create policy "Users own their briefs"
  on public.strategic_briefs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins read all briefs" on public.strategic_briefs;
create policy "Admins read all briefs"
  on public.strategic_briefs for select
  using (public.is_admin(auth.uid()));


-- ---------- strengths_blindspots -----------------------------------------
-- Lighter weekly cache for the strengths/blindspots cards (Gemini Flash).
create table if not exists public.strengths_blindspots (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users on delete cascade not null,
  scans_hash        text not null,
  period_start      date not null,
  period_end        date not null,
  /** Array of { category, label, stat, insight, sparkline } */
  strengths         jsonb not null,
  /** Array of { category, label, gap, insight, suggestionUrl? } */
  blindspots        jsonb not null,
  created_at        timestamptz default now()
);

create index if not exists idx_strengths_blindspots_lookup
  on public.strengths_blindspots (user_id, scans_hash);

create index if not exists idx_strengths_blindspots_user_created
  on public.strengths_blindspots (user_id, created_at desc);

alter table public.strengths_blindspots enable row level security;

drop policy if exists "Users own their sb" on public.strengths_blindspots;
create policy "Users own their sb"
  on public.strengths_blindspots for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins read all sb" on public.strengths_blindspots;
create policy "Admins read all sb"
  on public.strengths_blindspots for select
  using (public.is_admin(auth.uid()));


-- ---------- operator_profile_tags ----------------------------------------
-- Tiny weekly cache for the 4 "self-portrait" tags shown in the hero.
-- Only one current row per user (the most recent insert wins).
create table if not exists public.operator_profile_tags (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users on delete cascade not null,
  scans_hash        text not null,
  /** Array of { kind: "niche"|"country"|"pickiness"|"pace", label, emoji? } */
  tags              jsonb not null,
  /** Operator level number (0-100) at generation time, persisted alongside. */
  operator_level    int not null,
  level_tier        text not null check (level_tier in ('apprentice', 'practiced', 'skilled', 'expert', 'master')),
  created_at        timestamptz default now()
);

create index if not exists idx_operator_profile_tags_lookup
  on public.operator_profile_tags (user_id, created_at desc);

alter table public.operator_profile_tags enable row level security;

drop policy if exists "Users own their tags" on public.operator_profile_tags;
create policy "Users own their tags"
  on public.operator_profile_tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins read all tags" on public.operator_profile_tags;
create policy "Admins read all tags"
  on public.operator_profile_tags for select
  using (public.is_admin(auth.uid()));
