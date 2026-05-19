import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
  isSupabaseAdminConfigured,
} from "./env";

/**
 * Privileged service-role client — bypasses RLS. SERVER ONLY.
 *
 * Use for operations the user can't do themselves: backfilling profiles,
 * granting credits from webhooks, admin scripts. Never import from client code.
 */
let cached: ReturnType<typeof createClient> | null = null;

export function createSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      "Supabase admin client requested but SUPABASE_SERVICE_ROLE_KEY is missing.",
    );
  }
  if (cached) return cached;
  cached = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export { isSupabaseAdminConfigured };
