-- ===========================================================================
-- Wynner — drop vault tables (v9)
-- ===========================================================================
-- The vault feature was removed from the app. This migration drops the
-- tables that backed it:
--
--   • product_status       (per-user product status: testing/won/killed/…)
--   • collection_products  (join table: collection ↔ product)
--   • collections          (user-defined product collections)
--
-- The previous migration (005_collections.sql) is preserved so the
-- migration history stays linear — this one rolls it back.
--
-- Idempotent: safe to re-run.
-- ===========================================================================

drop table if exists public.product_status cascade;
drop table if exists public.collection_products cascade;
drop table if exists public.collections cascade;
