"use client";

import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import { nanoid } from "nanoid";

export type NotificationKind =
  | "scan_complete"
  | "milestone"
  | "inactivity"
  | "tip";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  productId?: string;
  href?: string;
  accentColor: string;
  createdAt: string;
  readAt?: string;
};

type NotifState = {
  items: NotificationItem[];
  push: (
    n: Omit<NotificationItem, "id" | "createdAt" | "accentColor"> & {
      accentColor?: string;
    },
  ) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  unreadCount: () => number;
};

const ACCENT: Record<NotificationKind, string> = {
  scan_complete: "#00D26A",
  milestone: "#3B82F6",
  inactivity: "#F5A623",
  tip: "#8B5CF6",
};

const storage: PersistStorage<{ items: NotificationItem[] }> = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(name);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StorageValue<{ items: NotificationItem[] }>;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
  },
};

export const useNotifications = create<NotifState>()(
  persist(
    (set, get) => ({
      items: [],
      push: (n) =>
        set((s) => {
          const item: NotificationItem = {
            id: nanoid(8),
            kind: n.kind,
            title: n.title,
            body: n.body,
            productId: n.productId,
            href: n.href,
            accentColor: n.accentColor ?? ACCENT[n.kind],
            createdAt: new Date().toISOString(),
          };
          return { items: [item, ...s.items].slice(0, 50) };
        }),
      markAllRead: () =>
        set((s) => ({
          items: s.items.map((it) =>
            it.readAt ? it : { ...it, readAt: new Date().toISOString() },
          ),
        })),
      markRead: (id) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id && !it.readAt
              ? { ...it, readAt: new Date().toISOString() }
              : it,
          ),
        })),
      remove: (id) =>
        set((s) => ({ items: s.items.filter((it) => it.id !== id) })),
      clear: () => set({ items: [] }),
      unreadCount: () => get().items.filter((it) => !it.readAt).length,
    }),
    {
      name: "wynner.notifications.v1",
      storage,
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
