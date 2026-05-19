"use client";

import { useEffect } from "react";
import { useUser } from "@/lib/auth/use-user";
import { useCollectionsStore } from "@/lib/store/collections";
import { useProductStatusStore } from "@/lib/store/product-status";

/**
 * Mounted once on the vault page. Pulls collections + product status from
 * Supabase into the local Zustand caches whenever the auth state changes.
 *
 * Renders nothing; pure side effect.
 */
export function VaultDataLoader() {
  const { user, configured } = useUser();
  const fetchCollections = useCollectionsStore((s) => s.fetchAll);
  const fetchStatuses = useProductStatusStore((s) => s.fetchAll);

  useEffect(() => {
    // Re-fetch when the user changes (sign in / sign out / account swap).
    // The stores no-op when Supabase isn't configured.
    void fetchCollections();
    void fetchStatuses();
    // We don't need to clear on sign-out — Supabase RLS makes the queries
    // return empty results, which the stores treat as "nothing here".
    void user;
    void configured;
  }, [user, configured, fetchCollections, fetchStatuses]);

  return null;
}
