-- ===========================================================================
-- Wynner — auth & profiles schema (v1)
-- ===========================================================================
-- Apply by pasting this whole file into Supabase Dashboard → SQL Editor →
-- New query → Run. Idempotent: safe to re-run.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- profiles table
-- ---------------------------------------------------------------------------
-- One row per auth.users row, mirroring the public-facing identity + the
-- credit / plan state. Created automatically by the on_auth_user_created
-- trigger below — never insert manually from the client.
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id                  uuid references auth.users on delete cascade primary key,
  email               text not null,
  display_name        text,
  avatar_url          text,

  -- Plan + credits (mirror of /lib/store/credits.ts)
  plan                text not null default 'starter' check (plan in ('starter', 'pro', 'operator')),
  credit_balance      int  not null default 10,
  monthly_credits     int  not null default 10,
  rollover_cap        int  not null default 0,
  plan_renews_at      timestamptz default (now() + interval '1 month'),
  streak_days         int  default 0,
  last_scan_at        timestamptz,
  last_daily_free_at  timestamptz,

  -- Onboarding answers
  preferred_country   text,
  preferred_niches    text[],
  experience_level    text check (experience_level in ('beginner', 'intermediate', 'advanced')),
  onboarding_completed boolean default false,

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- updated_at auto-bump
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert / delete policy — those happen via service role only.

-- ---------------------------------------------------------------------------
-- Auto-create profile when an auth.users row appears
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Indices
-- ---------------------------------------------------------------------------
create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_plan_idx on public.profiles (plan);

-- ---------------------------------------------------------------------------
-- Backfill: if you create this migration AFTER users already exist, run this
-- once to create profiles for them.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, email, display_name)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  )
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
