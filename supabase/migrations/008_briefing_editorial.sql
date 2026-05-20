-- ===========================================================================
-- Wynner — daily_briefings editorial extensions (v8)
-- ===========================================================================
-- Adds the editorial fields the cinematic /dashboard relies on:
--
--   editorial_title  — the magazine headline above today's picks
--   opening_hook     — the italic sub-headline on the first fold
--   sub_headline     — the brief-section sub-headline (replaces the static one)
--   recommendation   — the "next move" editorial card payload
--
-- All nullable so older briefing rows still load. The API/Zod schema treats
-- these as optional too.
--
-- Idempotent: safe to re-run.
-- ===========================================================================

alter table if exists public.daily_briefings
  add column if not exists editorial_title text,
  add column if not exists opening_hook    text,
  add column if not exists sub_headline    text,
  add column if not exists recommendation  jsonb;
