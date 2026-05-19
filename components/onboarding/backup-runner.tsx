"use client";

import { useEffect } from "react";
import { shouldRunBackup, takeBackup } from "@/lib/store/backups";

/**
 * Mounts once globally; takes a backup snapshot at most once per 24h.
 * Defer with setTimeout(0) so it never blocks first paint.
 */
export function BackupRunner() {
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (shouldRunBackup()) takeBackup();
    }, 0);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}
