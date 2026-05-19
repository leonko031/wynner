import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "./env";

/**
 * Server-side Supabase client. Reads / writes the session cookie via
 * Next.js `cookies()` (which is async in Next 16 — note the await).
 *
 * Use in: server components, route handlers, server actions.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — Next's cookie store is read-only
          // there, so we just ignore. Middleware refreshes the session anyway.
        }
      },
    },
  });
}

export { isSupabaseConfigured };
