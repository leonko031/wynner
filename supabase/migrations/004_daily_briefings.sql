-- ===========================================================================
-- Wynner — daily briefings cache (v4)
-- ===========================================================================
-- One row per user per day. The dashboard reads today's row on load; if
-- missing, the API generates via Gemini and inserts. Lets us call Gemini
-- at most once per user per day for the "morning briefing".
--
-- Idempotent: safe to re-run.
-- ===========================================================================

create table if not exists public.daily_briefings (
  user_id     uuid references auth.users on delete cascade,
  date        date not null,
  paragraphs  text[] not null,
  chips       jsonb not null,
  created_at  timestamptz default now(),
  primary key (user_id, date)
);

create index if not exists idx_daily_briefings_user_date
  on public.daily_briefings (user_id, date desc);

-- ---------- RLS ------------------------------------------------------------
-- Users can read + insert + delete their own briefings (no service role
-- required, so this works without SUPABASE_SECRET_KEY). UPDATE deliberately
-- omitted — a regenerate is implemented as delete + insert.
alter table public.daily_briefings enable row level security;

drop policy if exists "Users can read own briefings" on public.daily_briefings;
create policy "Users can read own briefings"
  on public.daily_briefings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own briefings" on public.daily_briefings;
create policy "Users can insert own briefings"
  on public.daily_briefings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own briefings" on public.daily_briefings;
create policy "Users can delete own briefings"
  on public.daily_briefings for delete
  using (auth.uid() = user_id);

-- Admins can read all briefings (for the diagnostic panel).
drop policy if exists "Admins can read all briefings" on public.daily_briefings;
create policy "Admins can read all briefings"
  on public.daily_briefings for select
  using (public.is_admin(auth.uid()));
