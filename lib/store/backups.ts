"use client";

/**
 * Lightweight daily backup of the product store.
 *
 * - Snapshot is taken at most once per 24h.
 * - We keep the most recent 7 snapshots, indexed under
 *   `wynner-backup-<ISO date>`.
 * - Triggered opportunistically on app mount (see <BackupRunner />); cheap.
 */

const PRODUCT_KEY = "wynner.products.v1";
const KEEP_COUNT = 7;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const LAST_RUN_KEY = "wynner.backup.lastRun";

export type BackupSnapshot = {
  key: string;
  takenAt: string; // ISO
  productCount: number;
};

export function listBackups(): BackupSnapshot[] {
  if (typeof window === "undefined") return [];
  const out: BackupSnapshot[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k || !k.startsWith("wynner-backup-")) continue;
    try {
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as {
        takenAt?: string;
        state?: { products?: unknown[] };
      };
      out.push({
        key: k,
        takenAt: parsed.takenAt ?? "",
        productCount: Array.isArray(parsed.state?.products)
          ? parsed.state!.products!.length
          : 0,
      });
    } catch {
      // ignore corrupt entries
    }
  }
  return out.sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}

export function shouldRunBackup(): boolean {
  if (typeof window === "undefined") return false;
  const last = window.localStorage.getItem(LAST_RUN_KEY);
  if (!last) return true;
  const lastTs = Number(last);
  if (!Number.isFinite(lastTs)) return true;
  return Date.now() - lastTs >= ONE_DAY_MS;
}

export function takeBackup(): BackupSnapshot | null {
  if (typeof window === "undefined") return null;
  const productsRaw = window.localStorage.getItem(PRODUCT_KEY);
  if (!productsRaw) return null;
  const now = new Date();
  const key = `wynner-backup-${now.toISOString().slice(0, 10)}`; // YYYY-MM-DD
  const payload = {
    takenAt: now.toISOString(),
    state: JSON.parse(productsRaw)?.state ?? {},
  };
  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
    window.localStorage.setItem(LAST_RUN_KEY, String(Date.now()));
    pruneOldBackups();
    return {
      key,
      takenAt: payload.takenAt,
      productCount: Array.isArray(payload.state?.products)
        ? payload.state.products.length
        : 0,
    };
  } catch {
    return null;
  }
}

function pruneOldBackups() {
  const list = listBackups();
  if (list.length <= KEEP_COUNT) return;
  for (const old of list.slice(KEEP_COUNT)) {
    window.localStorage.removeItem(old.key);
  }
}

export function restoreBackup(key: string): { ok: boolean; error?: string } {
  if (typeof window === "undefined") return { ok: false, error: "no window" };
  const raw = window.localStorage.getItem(key);
  if (!raw) return { ok: false, error: "snapshot not found" };
  try {
    const parsed = JSON.parse(raw) as { state?: unknown };
    if (!parsed.state) return { ok: false, error: "snapshot is empty" };
    // Re-wrap into the zustand-persist envelope before writing back.
    const envelope = { state: parsed.state, version: 0 };
    window.localStorage.setItem(PRODUCT_KEY, JSON.stringify(envelope));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "parse failed" };
  }
}

export function deleteBackup(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}
