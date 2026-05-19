/**
 * Centralized Supabase env-var access. When any of these are missing we
 * degrade gracefully — auth UI shows a setup banner, middleware bypasses
 * route protection — instead of crashing the dev server.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Supabase renamed `anon` → `publishable` and `service_role` → `secret` in
// mid-2025. We accept either name so existing setup docs + new dashboards
// both work. New `sb_publishable_*` keys start with that prefix; old anon
// keys are JWTs starting with `eyJ...`.
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** True if both the public URL and anon key are set. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** True if the privileged service-role key is available (server-only). */
export function isSupabaseAdminConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(SUPABASE_SERVICE_ROLE_KEY);
}
