"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * Browser-side Supabase client. Singleton — calling more than once returns
 * the same instance so we share the auth state across the app.
 *
 * If env vars are missing this still constructs a client (using empty
 * strings, which Supabase rejects on actual network calls). Callers should
 * check isSupabaseConfigured() before invoking auth flows.
 */

type AnyClient = ReturnType<typeof createBrowserClient>;
let cached: AnyClient | null = null;

export function createClient(): AnyClient {
  if (cached) return cached;
  cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cached;
}

export { isSupabaseConfigured };
