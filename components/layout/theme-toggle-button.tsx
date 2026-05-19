"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePreferences, type ThemeMode } from "@/lib/store/preferences";
import { cn } from "@/lib/utils";

export function ThemeToggleButton() {
  const themeMode = usePreferences((s) => s.themeMode);
  const setThemeMode = usePreferences((s) => s.setThemeMode);
  const [mounted, setMounted] = useState(false);

  // Just track mount for icon swap. Theme application happens pre-paint via
  // ThemeScript and on every change via setThemeMode itself — we don't need
  // a separate effect to re-apply (and doing so was clobbering the persisted
  // value before Zustand had finished hydrating).
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  const Icon =
    themeMode === "dark" ? Moon : themeMode === "light" ? Sun : Monitor;

  const ITEMS: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
    { value: "system", label: "System", icon: Monitor },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Theme: ${themeMode}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border-soft bg-surface text-text-muted transition-colors hover:border-border-strong hover:text-text"
        >
          {mounted ? (
            <Icon className="h-3.5 w-3.5" />
          ) : (
            // Hide the icon SSR to avoid a flash mismatch
            <span className="block h-3.5 w-3.5" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-36">
        {ITEMS.map((it) => (
          <DropdownMenuItem
            key={it.value}
            onClick={() => setThemeMode(it.value)}
            className={cn(
              "flex items-center gap-2 text-sm",
              themeMode === it.value && "text-text",
            )}
          >
            <it.icon className="h-3.5 w-3.5" />
            <span className="flex-1">{it.label}</span>
            {themeMode === it.value && (
              <span className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-aurora-blue" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
