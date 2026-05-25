-- ===========================================================================
-- Wynner — waitlist (v10)
-- ===========================================================================
-- Powers the pre-launch waitlist page at / when NEXT_PUBLIC_WAITLIST_MODE=true.
-- Sequential position auto-assigned by trigger. Referrals bump the referrer
-- up by 5 spots (handled server-side in /api/waitlist/signup).
--
-- Spec called this 008 but that number is taken by briefing_editorial; this
-- bumps to 010 (009 is drop_vault_tables).
--
-- Idempotent: safe to re-run.
-- ===========================================================================

create extension if not exists pgcrypto;

create table if not exists public.waitlist (
  id                          uuid primary key default gen_random_uuid(),
  email                       text not null unique,
  position                    integer not null default 0,
  referral_code               text not null unique default substr(md5(random()::text), 1, 8),
  referred_by                 uuid references public.waitlist(id) on delete set null,
  referrals_count             integer not null default 0,
  source                      text,           -- 'organic' | 'twitter' | 'reddit' | utm_source | referer
  ip_address                  text,
  user_agent                  text,
  email_confirmed             boolean default false,
  email_confirmation_token    text default substr(md5(random()::text), 1, 16),
  email_confirmed_at          timestamptz,
  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);

create index if not exists idx_waitlist_email         on public.waitlist(email);
create index if not exists idx_waitlist_referral_code on public.waitlist(referral_code);
create index if not exists idx_waitlist_position      on public.waitlist(position);
create index if not exists idx_waitlist_created_at    on public.waitlist(created_at desc);
create index if not exists idx_waitlist_source        on public.waitlist(source);

-- ---------- Auto-position trigger ----------------------------------------
-- Sequential position assigned on insert. Subsequent referrer bumps happen
-- in the API layer so we can also touch referrals_count atomically.
create or replace function public.assign_waitlist_position()
returns trigger as $$
begin
  if new.position is null or new.position = 0 then
    select coalesce(max(position), 0) + 1
      into new.position
      from public.waitlist;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists before_insert_waitlist on public.waitlist;
create trigger before_insert_waitlist
  before insert on public.waitlist
  for each row execute function public.assign_waitlist_position();

-- ---------- updated_at autotouch -----------------------------------------
create or replace function public.touch_waitlist_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists before_update_waitlist on public.waitlist;
create trigger before_update_waitlist
  before update on public.waitlist
  for each row execute function public.touch_waitlist_updated_at();

-- ---------- RLS -----------------------------------------------------------
alter table public.waitlist enable row level security;

-- Anyone can insert a new signup (the API normalizes + dedupes).
drop policy if exists "Anyone can insert waitlist signups" on public.waitlist;
create policy "Anyone can insert waitlist signups"
  on public.waitlist for insert
  with check (true);

-- Anyone can read — the API filters server-side to one email at a time when
-- a non-admin queries (used by the "already on list" flow). Admins see all
-- via the admin client which bypasses RLS, so this open policy is for the
-- public-signup confirmation path.
drop policy if exists "Anyone can read waitlist (api filters)" on public.waitlist;
create policy "Anyone can read waitlist (api filters)"
  on public.waitlist for select
  using (true);

-- Only admins can update / delete via the regular client. Admin-panel
-- actions go through the service-role client which bypasses RLS, so this
-- policy is the failsafe.
drop policy if exists "Admins can update waitlist" on public.waitlist;
create policy "Admins can update waitlist"
  on public.waitlist for update
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete waitlist" on public.waitlist;
create policy "Admins can delete waitlist"
  on public.waitlist for delete
  using (public.is_admin(auth.uid()));
