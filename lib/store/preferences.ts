"use client";

import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";

export type ThemeMode = "system" | "light" | "dark";
export type ScraperToggleId =
  | "productScrape"
  | "metaAds"
  | "tiktok"
  | "googleTrends";

export type ScraperToggles = Record<ScraperToggleId, boolean>;

export const DEFAULT_SCRAPER_TOGGLES: ScraperToggles = {
  productScrape: false,
  metaAds: false,
  tiktok: false,
  googleTrends: false,
};

export type UserProfile = {
  displayName: string;
};

export type NotificationToggles = {
  inactivityReminders: boolean;
  milestoneCelebrations: boolean;
  scanComplete: boolean;
};

export const DEFAULT_NOTIFICATION_TOGGLES: NotificationToggles = {
  inactivityReminders: true,
  milestoneCelebrations: true,
  scanComplete: true,
};

type PreferencesState = {
  redditVoiceEnabled: boolean;
  setRedditVoiceEnabled: (enabled: boolean) => void;
  compactMode: boolean;
  setCompactMode: (enabled: boolean) => void;
  preferProModel: boolean;
  setPreferProModel: (enabled: boolean) => void;
  premiumCursor: boolean;
  setPremiumCursor: (enabled: boolean) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  debugMode: boolean;
  setDebugMode: (enabled: boolean) => void;
  scrapers: ScraperToggles;
  setScraperEnabled: (id: ScraperToggleId, enabled: boolean) => void;
  profile: UserProfile;
  setProfile: (next: Partial<UserProfile>) => void;
  notifications: NotificationToggles;
  setNotificationToggle: (key: keyof NotificationToggles, value: boolean) => void;
  defaultCountry: string;
  setDefaultCountry: (code: string) => void;
  // Onboarding
  completedOnboarding: boolean;
  setCompletedOnboarding: (done: boolean) => void;
  tourStep: number; // -1 means tour not running
  setTourStep: (step: number) => void;
  startTour: () => void;
  endTour: () => void;
};

type PersistedPrefs = {
  redditVoiceEnabled: boolean;
  compactMode: boolean;
  preferProModel: boolean;
  premiumCursor: boolean;
  themeMode: ThemeMode;
  debugMode: boolean;
  scrapers: ScraperToggles;
  profile: UserProfile;
  notifications: NotificationToggles;
  defaultCountry: string;
  completedOnboarding: boolean;
};

const storage: PersistStorage<PersistedPrefs> = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(name);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StorageValue<PersistedPrefs>;
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

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      redditVoiceEnabled: false,
      setRedditVoiceEnabled: (redditVoiceEnabled) =>
        set({ redditVoiceEnabled }),
      compactMode: false,
      setCompactMode: (compactMode) => set({ compactMode }),
      preferProModel: true,
      setPreferProModel: (preferProModel) => set({ preferProModel }),
      premiumCursor: false,
      setPremiumCursor: (premiumCursor) => set({ premiumCursor }),
      themeMode: "system",
      setThemeMode: (themeMode) => {
        set({ themeMode });
        if (typeof window !== "undefined") {
          window.localStorage.setItem("wynner.themeMode", themeMode);
          applyTheme(themeMode);
        }
      },
      debugMode: false,
      setDebugMode: (debugMode) => set({ debugMode }),
      scrapers: DEFAULT_SCRAPER_TOGGLES,
      setScraperEnabled: (id, enabled) =>
        set((s) => ({ scrapers: { ...s.scrapers, [id]: enabled } })),
      profile: { displayName: "" },
      setProfile: (next) =>
        set((s) => ({ profile: { ...s.profile, ...next } })),
      notifications: DEFAULT_NOTIFICATION_TOGGLES,
      setNotificationToggle: (key, value) =>
        set((s) => ({ notifications: { ...s.notifications, [key]: value } })),
      defaultCountry: "US",
      setDefaultCountry: (defaultCountry) => set({ defaultCountry }),
      completedOnboarding: false,
      setCompletedOnboarding: (completedOnboarding) =>
        set({ completedOnboarding }),
      tourStep: -1,
      setTourStep: (tourStep) => set({ tourStep }),
      startTour: () => set({ tourStep: 0 }),
      endTour: () => set({ tourStep: -1 }),
    }),
    {
      name: "wynner.prefs.v1",
      storage,
      partialize: (s) =>
        ({
          redditVoiceEnabled: s.redditVoiceEnabled,
          compactMode: s.compactMode,
          preferProModel: s.preferProModel,
          premiumCursor: s.premiumCursor,
          themeMode: s.themeMode,
          debugMode: s.debugMode,
          scrapers: s.scrapers,
          profile: s.profile,
          notifications: s.notifications,
          defaultCountry: s.defaultCountry,
          completedOnboarding: s.completedOnboarding,
        }) satisfies PersistedPrefs,
    },
  ),
);

/**
 * Reads system color-scheme + the stored theme override and applies a
 * `data-theme="light" | "dark"` attribute on <html>. Safe to call from the
 * pre-paint inline script (no React deps).
 */
export function applyTheme(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  const resolved =
    mode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : mode;
  document.documentElement.dataset.theme = resolved;
}
