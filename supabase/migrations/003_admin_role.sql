-- ===========================================================================
-- Wynner — admin role (v3)
-- ===========================================================================
-- Adds an `is_admin` flag to profiles + a SECURITY DEFINER helper function
-- so RLS policies can check admin status without recursive policy evaluation.
--
-- Idempotent: safe to re-run.
-- ===========================================================================

-- ---------- 1. Column ------------------------------------------------------
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create index if not exists idx_profiles_is_admin
  on public.profiles (is_admin)
  where is_admin = true;

-- ---------- 2. RLS-safe admin check helper --------------------------------
-- SECURITY DEFINER lets the function bypass RLS itself, so when a policy
-- calls it from inside a SELECT on profiles it doesn't recurse into the
-- same policy. Returns false for anon / unknown users.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = uid),
    false
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;

-- ---------- 3. Policy: admins can read all profiles ------------------------
-- Stacks alongside the existing "Users can view own profile" policy
-- (Supabase OR's permissive policies — either match grants access).
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin(auth.uid()));

-- ---------- 4. Lock writes to is_admin ------------------------------------
-- The existing "Users can update own profile" policy lets users update their
-- own row — but they must NEVER be able to flip is_admin. Replace that
-- policy with one that explicitly blocks the column.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Block any update that would flip is_admin from its current value.
    -- Service role bypasses RLS so syncAdminFlag still works.
    and is_admin = (select is_admin from public.profiles where id = auth.uid())
  );
