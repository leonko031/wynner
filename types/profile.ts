/**
 * Mirror of the `public.profiles` row shape from
 * supabase/migrations/001_auth_profiles.sql.
 *
 * Field names match the SQL columns (snake_case). Keep them in sync — when
 * adding columns to the table, add them here too.
 */

import type { PlanTier } from "./credits";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  plan: PlanTier;
  credit_balance: number;
  monthly_credits: number;
  rollover_cap: number;
  plan_renews_at: string | null;
  streak_days: number;
  last_scan_at: string | null;
  last_daily_free_at: string | null;
  preferred_country: string | null;
  preferred_niches: string[] | null;
  experience_level: ExperienceLevel | null;
  onboarding_completed: boolean;
  /** Server-set flag — derived from ADMIN_EMAILS env. Locked from user writes by RLS. */
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}
