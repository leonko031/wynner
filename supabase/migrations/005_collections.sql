-- ===========================================================================
-- Wynner — vault data (v5)
-- ===========================================================================
-- Collections + per-product status + vault chat history.
--
-- IMPORTANT: products themselves still live in the client's local Zustand
-- store (deferred Postgres migration). We store product_ids here as plain
-- text columns (NOT foreign keys) so collection assignments survive even
-- though the products live elsewhere. The vault UI gracefully ignores
-- collection entries whose product_id no longer exists locally.
--
-- Idempotent: safe to re-run.
-- ===========================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- collections — user-made, smart (AI-generated), or system (built-in)
-- ---------------------------------------------------------------------------
create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade not null,
  name        text not null,
  description text,
  color       text not null default 'aurora_blue'
              check (color in (
                'aurora_blue', 'aurora_purple', 'aurora_pink',
                'aurora_peach', 'aurora_mint'
              )),
  type        text not null check (type in ('user', 'smart', 'system')),
  rationale   text,  -- For smart collections, Gemini's reasoning blurb
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists idx_collections_user
  on public.collections (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- collection_products — junction. product_id is plain text (see header).
-- ---------------------------------------------------------------------------
create table if not exists public.collection_products (
  collection_id uuid references public.collections on delete cascade,
  product_id    text not null,
  added_at      timestamptz default now(),
  primary key (collection_id, product_id)
);

create index if not exists idx_collection_products_product
  on public.collection_products (product_id);

-- ---------------------------------------------------------------------------
-- product_status — user-controlled status per product (separate from AI verdict).
-- Keyed by (user_id, product_id) so different users can have independent
-- statuses on shared seed products.
-- ---------------------------------------------------------------------------
create table if not exists public.product_status (
  user_id    uuid references auth.users on delete cascade not null,
  product_id text not null,
  status     text not null
             check (status in (
               'active', 'watchlist', 'testing', 'won', 'killed', 'archived'
             )),
  updated_at timestamptz default now(),
  primary key (user_id, product_id)
);

create index if not exists idx_product_status_user
  on public.product_status (user_id, status);

-- ---------------------------------------------------------------------------
-- vault_conversations — Ask Wynner chat history (one row per conversation).
-- `messages` is a JSON array of {role, content, timestamp, productRefs?}.
-- ---------------------------------------------------------------------------
create table if not exists public.vault_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  messages   jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_vault_conversations_user
  on public.vault_conversations (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- updated_at auto-bump triggers (reuses the touch_updated_at function from
-- migration 001, creating it again here if it doesn't exist)
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists collections_touch_updated_at on public.collections;
create trigger collections_touch_updated_at
  before update on public.collections
  for each row execute function public.touch_updated_at();

drop trigger if exists product_status_touch_updated_at on public.product_status;
create trigger product_status_touch_updated_at
  before update on public.product_status
  for each row execute function public.touch_updated_at();

drop trigger if exists vault_conversations_touch_updated_at on public.vault_conversations;
create trigger vault_conversations_touch_updated_at
  before update on public.vault_conversations
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: standard "own-row" policies. Admins can read everything via the
-- public.is_admin() helper from migration 003.
-- ---------------------------------------------------------------------------
alter table public.collections          enable row level security;
alter table public.collection_products  enable row level security;
alter table public.product_status       enable row level security;
alter table public.vault_conversations  enable row level security;

-- collections
drop policy if exists "Users own their collections" on public.collections;
create policy "Users own their collections"
  on public.collections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists "Admins can view all collections" on public.collections;
create policy "Admins can view all collections"
  on public.collections for select
  using (public.is_admin(auth.uid()));

-- collection_products — access mirrors the parent collection's owner
drop policy if exists "Users own their collection_products" on public.collection_products;
create policy "Users own their collection_products"
  on public.collection_products for all
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

-- product_status
drop policy if exists "Users own their product_status" on public.product_status;
create policy "Users own their product_status"
  on public.product_status for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- vault_conversations
drop policy if exists "Users own their conversations" on public.vault_conversations;
create policy "Users own their conversations"
  on public.vault_conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
