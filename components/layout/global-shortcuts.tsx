"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CommandPalette } from "./command-palette";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { useProductStore } from "@/lib/store/products";
import { usePreferences } from "@/lib/store/preferences";

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  return false;
}

function hasOpenDialog(): boolean {
  return Boolean(document.querySelector('[role="dialog"][data-state="open"]'));
}

export function GlobalShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const toggleFavorite = useProductStore((s) => s.toggleFavorite);
  const setVaultLayout = usePreferences((s) => s.setVaultLayout);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // ⌘K — command palette
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }

      // ⌘1..4 — numeric nav
      if (mod && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        const map: Record<string, string> = {
          "1": "/dashboard",
          "2": "/vault",
          "3": "/compare",
          "4": "/scan",
        };
        router.push(map[e.key]);
        return;
      }

      // ⌘, — settings
      if (mod && e.key === ",") {
        e.preventDefault();
        router.push("/settings");
        return;
      }

      // Single-letter shortcuts only fire when not typing & no dialog open
      if (mod || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (hasOpenDialog()) return;

      const key = e.key;

      // The /compare page owns A / V / E for its own shortcuts (add product,
      // regenerate verdict, export). Skip the global handlers for those keys
      // there so they don't double-fire (e.g. V → /vault while the user is
      // trying to regenerate a verdict).
      if (pathname.startsWith("/compare")) {
        const k = key.toLowerCase();
        if (k === "a" || k === "v" || k === "e") return;
      }
      // The /insights page owns R / T / E for regenerate brief, cycle period,
      // and export. Skip the matching globals there.
      if (pathname.startsWith("/insights")) {
        const k = key.toLowerCase();
        if (k === "r" || k === "t" || k === "e") return;
      }
      // The /dashboard page owns B (regenerate briefing), N (next move),
      // and 1-5 (jump to section) for its cinematic redesign. Skip the
      // matching globals so they don't double-fire.
      if (pathname.startsWith("/dashboard")) {
        const k = key.toLowerCase();
        if (k === "b" || k === "n") return;
        if (["1", "2", "3", "4", "5"].includes(key)) return;
        // Space scrolls past the first fold — also belongs to the dashboard.
        if (e.key === " " || e.key === "Spacebar") return;
      }

      if (key === "?") {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
        return;
      }
      if (key === "/") {
        // Try to focus the search input if visible; if not, fall through.
        const search = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Search" i], input[type="search"]',
        );
        if (search) {
          e.preventDefault();
          search.focus();
          search.select();
        }
        return;
      }
      if (key === "Escape") {
        // Close any of our managed dialogs explicitly (Radix handles its own,
        // but our state-controlled ones need a nudge).
        if (paletteOpen) setPaletteOpen(false);
        if (shortcutsOpen) setShortcutsOpen(false);
        return;
      }

      const lower = key.toLowerCase();
      if (lower === "s") {
        e.preventDefault();
        router.push("/scan");
        return;
      }
      if (lower === "v") {
        e.preventDefault();
        router.push("/vault");
        return;
      }
      if (lower === "c") {
        e.preventDefault();
        router.push("/compare");
        return;
      }
      if (lower === "f") {
        // Favorite the product currently visible (works on /product/[id])
        const match = pathname.match(/^\/product\/([^/]+)/);
        if (!match) return;
        e.preventDefault();
        const id = match[1];
        toggleFavorite(id);
        toast("Favorite toggled", { description: id });
        return;
      }
      // E — trigger export PNG on product detail page
      if (lower === "e" && /^\/product\//.test(pathname)) {
        const btn = Array.from(
          document.querySelectorAll<HTMLButtonElement>("button"),
        ).find((b) => /Export PNG|Exporting/.test(b.textContent ?? ""));
        if (btn) {
          e.preventDefault();
          btn.click();
        }
        return;
      }
      // R — trigger re-score on product detail page
      if (lower === "r" && /^\/product\//.test(pathname)) {
        const btn = Array.from(
          document.querySelectorAll<HTMLButtonElement>("button"),
        ).find((b) => /Re-score|Scoring…/.test(b.textContent ?? ""));
        if (btn && !btn.disabled) {
          e.preventDefault();
          btn.click();
        }
        return;
      }
      // G / L — vault layout switch
      if ((lower === "g" || lower === "l") && pathname.startsWith("/vault")) {
        e.preventDefault();
        setVaultLayout(lower === "g" ? "grid" : "list");
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, pathname, toggleFavorite, setVaultLayout, paletteOpen, shortcutsOpen]);

  return (
    <>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}
