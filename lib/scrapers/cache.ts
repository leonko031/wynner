/**
 * Tiny in-memory cache used by the scrape API routes to avoid burning
 * ScrapingBee credits on duplicate hits. 24-hour TTL.
 *
 * For personal use this lives in the Node process memory. Production would
 * back this with Redis / Supabase. The interface is intentionally minimal so
 * a swap is one file.
 */

type Entry = { value: unknown; expiresAt: number };

const store = new Map<string, Entry>();
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export function cacheGet<T>(key: string): T | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    store.delete(key);
    return null;
  }
  return e.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

export function cacheStats(): { size: number; keys: string[] } {
  return { size: store.size, keys: Array.from(store.keys()) };
}
