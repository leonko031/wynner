"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Wynner v3 theme system.
 *
 * Three intended user states:
 *   "light"  — force light, regardless of OS preference
 *   "dark"   — force dark, regardless of OS preference
 *   "system" — defer to OS prefers-color-scheme (default)
 *
 * The resolved theme (always "light" or "dark") is what's actually
 * applied to the document. When the user picks "system", we
 * subscribe to prefers-color-scheme and re-resolve on change so the
 * page switches live with the OS.
 *
 * Storage:
 *   localStorage["theme"] — one of "light" | "dark" | "system".
 *   Missing/invalid value defaults to "system".
 *
 * DOM effect:
 *   - When resolved = "dark":  `<html>` gets the `.dark` class
 *     and `data-theme="dark"`.
 *   - When resolved = "light": both are cleared (data-theme="light").
 *
 * The dual write of `.dark` class AND `data-theme` is deliberate
 * during the v3 migration — globals.css's `@custom-variant dark`
 * matches both, and legacy components still read `data-theme`
 * directly. Once every component is migrated to `.dark`, we can
 * drop the data-theme write.
 */

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? systemTheme() : theme;
}

function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (resolved === "dark") {
    html.classList.add("dark");
    html.setAttribute("data-theme", "dark");
  } else {
    html.classList.remove("dark");
    html.setAttribute("data-theme", "light");
  }
}

/**
 * useTheme — light/dark/system theme hook.
 *
 * Returns:
 *   theme     — what the user picked
 *   resolved  — what's actually rendered (system → light or dark)
 *   setTheme  — switch to a new value (persists to localStorage)
 *
 * Hydration-safe: server render returns the default ("system" + "light"
 * resolved), then on mount we read localStorage and re-apply. There's a
 * brief flash possible on first paint before useEffect runs — the
 * existing /components/layout/theme-script.tsx prevents that for the
 * data-theme attribute. Both selectors are honored in globals.css so
 * the FOUC path keeps working.
 *
 * Usage:
 *   const { theme, resolved, setTheme } = useTheme();
 *   <button onClick={() => setTheme("dark")}>Dark</button>
 */
export function useTheme(): {
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (next: Theme) => void;
} {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  // Mount: hydrate from localStorage and apply.
  useEffect(() => {
    const t = readStoredTheme();
    const r = resolveTheme(t);
    setThemeState(t);
    setResolved(r);
    applyTheme(r);
  }, []);

  // Reapply when the user changes the picked theme.
  useEffect(() => {
    const r = resolveTheme(theme);
    setResolved(r);
    applyTheme(r);
  }, [theme]);

  // When in "system" mode, follow prefers-color-scheme live.
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const r: ResolvedTheme = mq.matches ? "dark" : "light";
      setResolved(r);
      applyTheme(r);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // private mode / storage disabled — ignore, in-memory state still updates
    }
    setThemeState(next);
  }, []);

  return { theme, resolved, setTheme };
}
