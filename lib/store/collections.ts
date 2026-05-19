"use client";

import { create } from "zustand";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  Collection,
  CollectionColor,
  CollectionType,
  CollectionWithProducts,
} from "@/types/vault";

/* -------------------------------------------------------------------------- */
/* Collections store                                                           */
/* -------------------------------------------------------------------------- */
/*
 * Source of truth lives in Supabase. The store caches the user's collections
 * + product memberships in memory so the UI can render synchronously after
 * the initial fetch. All mutations write-through to Supabase, then update
 * local state on success.
 *
 * We keep collection_products as a flat map (collectionId → Set<productId>)
 * so add/remove are O(1) and lookups by collection are easy.
 */

type State = {
  collections: Collection[];
  memberships: Record<string, Set<string>>; // collectionId → product IDs
  loading: boolean;
  loaded: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  createCollection: (input: {
    name: string;
    description?: string;
    color?: CollectionColor;
    type?: CollectionType;
    rationale?: string;
  }) => Promise<Collection | null>;
  renameCollection: (id: string, name: string, description?: string) => Promise<void>;
  setCollectionColor: (id: string, color: CollectionColor) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  /** Replace the membership of an entire smart collection in one shot. */
  setMembership: (collectionId: string, productIds: string[]) => Promise<void>;
  addProducts: (collectionId: string, productIds: string[]) => Promise<void>;
  removeProducts: (collectionId: string, productIds: string[]) => Promise<void>;
  /** Drop every smart collection (used before regenerating). */
  clearSmartCollections: () => Promise<void>;
};

function withProducts(
  c: Collection,
  memberships: Record<string, Set<string>>,
): CollectionWithProducts {
  return { ...c, productIds: [...(memberships[c.id] ?? [])] };
}

export const useCollectionsStore = create<State>((set, get) => ({
  collections: [],
  memberships: {},
  loading: false,
  loaded: false,
  error: null,

  fetchAll: async () => {
    if (!isSupabaseConfigured()) {
      set({ loaded: true });
      return;
    }
    set({ loading: true, error: null });
    const supabase = createClient();
    const [{ data: cols, error: ce }, { data: cps, error: cpe }] = await Promise.all([
      supabase.from("collections").select("*").order("created_at", { ascending: false }),
      supabase.from("collection_products").select("collection_id, product_id"),
    ]);
    if (ce || cpe) {
      set({ loading: false, loaded: true, error: ce?.message ?? cpe?.message ?? null });
      return;
    }
    const memberships: Record<string, Set<string>> = {};
    for (const row of (cps ?? []) as { collection_id: string; product_id: string }[]) {
      if (!memberships[row.collection_id]) memberships[row.collection_id] = new Set();
      memberships[row.collection_id].add(row.product_id);
    }
    set({
      collections: (cols ?? []) as Collection[],
      memberships,
      loading: false,
      loaded: true,
    });
  },

  createCollection: async ({ name, description, color, type, rationale }) => {
    if (!isSupabaseConfigured()) return null;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("collections") as any)
      .insert({
        name,
        description: description ?? null,
        color: color ?? "aurora_blue",
        type: type ?? "user",
        rationale: rationale ?? null,
      })
      .select()
      .single();
    if (error || !data) return null;
    const col = data as Collection;
    set((s) => ({ collections: [col, ...s.collections] }));
    return col;
  },

  renameCollection: async (id, name, description) => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("collections") as any)
      .update({ name, description: description ?? null })
      .eq("id", id);
    set((s) => ({
      collections: s.collections.map((c) =>
        c.id === id ? { ...c, name, description: description ?? null } : c,
      ),
    }));
  },

  setCollectionColor: async (id, color) => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("collections") as any).update({ color }).eq("id", id);
    set((s) => ({
      collections: s.collections.map((c) => (c.id === id ? { ...c, color } : c)),
    }));
  },

  deleteCollection: async (id) => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.from("collections").delete().eq("id", id);
    set((s) => {
      const memberships = { ...s.memberships };
      delete memberships[id];
      return {
        collections: s.collections.filter((c) => c.id !== id),
        memberships,
      };
    });
  },

  setMembership: async (collectionId, productIds) => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    // Wipe and re-insert. Smart collections call this when Gemini regenerates.
    await supabase.from("collection_products").delete().eq("collection_id", collectionId);
    if (productIds.length > 0) {
      const rows = productIds.map((pid) => ({ collection_id: collectionId, product_id: pid }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("collection_products") as any).insert(rows);
    }
    set((s) => ({
      memberships: { ...s.memberships, [collectionId]: new Set(productIds) },
    }));
  },

  addProducts: async (collectionId, productIds) => {
    if (!isSupabaseConfigured() || productIds.length === 0) return;
    const supabase = createClient();
    const existing = get().memberships[collectionId] ?? new Set();
    const fresh = productIds.filter((id) => !existing.has(id));
    if (fresh.length === 0) return;
    const rows = fresh.map((pid) => ({ collection_id: collectionId, product_id: pid }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("collection_products") as any)
      .upsert(rows, { onConflict: "collection_id,product_id" });
    if (error) return;
    set((s) => {
      const next = new Set([...(s.memberships[collectionId] ?? []), ...fresh]);
      return { memberships: { ...s.memberships, [collectionId]: next } };
    });
  },

  removeProducts: async (collectionId, productIds) => {
    if (!isSupabaseConfigured() || productIds.length === 0) return;
    const supabase = createClient();
    await supabase
      .from("collection_products")
      .delete()
      .eq("collection_id", collectionId)
      .in("product_id", productIds);
    set((s) => {
      const next = new Set(s.memberships[collectionId] ?? []);
      for (const id of productIds) next.delete(id);
      return { memberships: { ...s.memberships, [collectionId]: next } };
    });
  },

  clearSmartCollections: async () => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const ids = get().collections.filter((c) => c.type === "smart").map((c) => c.id);
    if (ids.length === 0) return;
    await supabase.from("collections").delete().in("id", ids);
    set((s) => {
      const memberships = { ...s.memberships };
      for (const id of ids) delete memberships[id];
      return {
        collections: s.collections.filter((c) => c.type !== "smart"),
        memberships,
      };
    });
  },
}));

/* -------------------------------------------------------------------------- */
/* Pure helpers                                                                */
/* -------------------------------------------------------------------------- */
/*
 * NEVER use these as Zustand selectors directly — they create new arrays
 * every render which triggers an infinite re-render loop ("snapshot should
 * be cached" warning).
 *
 * The correct pattern is:
 *   const collections = useCollectionsStore((s) => s.collections);   // stable ref
 *   const memberships = useCollectionsStore((s) => s.memberships);   // stable ref
 *   const withMembers = useMemo(
 *     () => collectionsWithProducts(collections, memberships),
 *     [collections, memberships],
 *   );
 */

export function collectionsWithProducts(
  collections: Collection[],
  memberships: Record<string, Set<string>>,
): CollectionWithProducts[] {
  return collections.map((c) => withProducts(c, memberships));
}

/**
 * @deprecated Don't pass this to useCollectionsStore — it creates a new array
 * each render and triggers an infinite loop. Use `collectionsWithProducts`
 * inside a `useMemo` instead. Kept exported so the deprecation can land
 * incrementally; new code should not call this.
 */
export function selectCollectionsWithProducts(s: State): CollectionWithProducts[] {
  return collectionsWithProducts(s.collections, s.memberships);
}

/** Map of product_id → collection_ids[] — used for "in collection" lookups. */
export function buildProductCollectionsIndex(
  collections: Collection[],
  memberships: Record<string, Set<string>>,
): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const c of collections) {
    const ids = memberships[c.id];
    if (!ids) continue;
    for (const pid of ids) {
      const prev = out.get(pid) ?? [];
      prev.push(c.id);
      out.set(pid, prev);
    }
  }
  return out;
}
