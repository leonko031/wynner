"use client";

import { create } from "zustand";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ProductStatus } from "@/types/vault";

/**
 * Per-product user-controlled status.
 *
 * Lives in Supabase (table `public.product_status`, keyed by user+product).
 * Cached in memory so the UI can color status pills synchronously after
 * the initial load. Every setStatus call write-throughs to Supabase.
 */

type State = {
  /** product_id → status. Absent entries default to "active". */
  statuses: Record<string, ProductStatus>;
  loaded: boolean;
  loading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  setStatus: (productId: string, status: ProductStatus) => Promise<void>;
  setStatusBulk: (productIds: string[], status: ProductStatus) => Promise<void>;
  clearStatus: (productId: string) => Promise<void>;
};

export const useProductStatusStore = create<State>((set) => ({
  statuses: {},
  loaded: false,
  loading: false,
  error: null,

  fetchAll: async () => {
    if (!isSupabaseConfigured()) {
      set({ loaded: true });
      return;
    }
    set({ loading: true, error: null });
    const supabase = createClient();
    const { data, error } = await supabase
      .from("product_status")
      .select("product_id, status");
    if (error) {
      set({ loading: false, loaded: true, error: error.message });
      return;
    }
    const rows = (data ?? []) as { product_id: string; status: ProductStatus }[];
    const statuses: Record<string, ProductStatus> = {};
    for (const row of rows) statuses[row.product_id] = row.status;
    set({ statuses, loading: false, loaded: true });
  },

  setStatus: async (productId, status) => {
    set((s) => ({ statuses: { ...s.statuses, [productId]: status } }));
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("product_status") as any).upsert(
      { user_id: user.id, product_id: productId, status },
      { onConflict: "user_id,product_id" },
    );
  },

  setStatusBulk: async (productIds, status) => {
    set((s) => {
      const next = { ...s.statuses };
      for (const id of productIds) next[id] = status;
      return { statuses: next };
    });
    if (!isSupabaseConfigured() || productIds.length === 0) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const rows = productIds.map((pid) => ({
      user_id: user.id,
      product_id: pid,
      status,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("product_status") as any).upsert(rows, {
      onConflict: "user_id,product_id",
    });
  },

  clearStatus: async (productId) => {
    set((s) => {
      const next = { ...s.statuses };
      delete next[productId];
      return { statuses: next };
    });
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.from("product_status").delete().eq("product_id", productId);
  },
}));
