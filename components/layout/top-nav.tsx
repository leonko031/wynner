"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { motion } from "framer-motion";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggleButton } from "@/components/layout/theme-toggle-button";
import { CreditPill } from "@/components/credits/credit-pill";
import { GuestAuthButtons, UserMenu } from "@/components/auth/user-menu";
import { useUser } from "@/lib/auth/use-user";
import { usePreferences } from "@/lib/store/preferences";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/vault", label: "Vault" },
  { href: "/compare", label: "Compare" },
  { href: "/insights", label: "Insights" },
  { href: "/scan", label: "Scan", tour: "scan-link" as const },
] as const;

function initialsOf(name: string): string {
  if (!name.trim()) return "LN";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "LN";
}

export function TopNav() {
  const pathname = usePathname();
  const profileName = usePreferences((s) => s.profile.displayName);
  const { user, configured } = useUser();
  // In demo mode (Supabase not configured) we treat everyone as "signed in"
  // for nav purposes — keeps the existing local-only experience intact.
  const authed = !configured || !!user;
  const clickCount = useRef(0);
  const clickTimer = useRef<number | null>(null);

  function handleLogoClick() {
    clickCount.current += 1;
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => {
      clickCount.current = 0;
    }, 1500);
    if (clickCount.current >= 5) {
      clickCount.current = 0;
      window.dispatchEvent(new Event("wynner:debug"));
    }
  }

  return (
    <header
      className="sticky top-0 z-40 h-14 w-full border-b border-border-soft glass-flat"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5">
        {/* Left: wordmark */}
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          onClick={handleLogoClick}
        >
          <span
            aria-hidden
            className="relative flex h-2 w-2 items-center justify-center"
          >
            <span
              className="absolute inline-flex h-full w-full animate-pulse-glow rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              }}
            />
            <span
              className="relative inline-flex h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(167,136,255,0.85)]"
              style={{
                background:
                  "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              }}
            />
          </span>
          <span
            data-wynner-logo
            className="font-medium tracking-tight text-text"
          >
            Wynner
          </span>
        </Link>

        {/* Center: nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-tour={"tour" in item ? item.tour : undefined}
                className={cn(
                  "group relative rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  active ? "text-text" : "text-text-muted hover:text-text",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-surface"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 32,
                    }}
                  />
                )}
                <span className="relative">{item.label}</span>
                <span
                  className={cn(
                    "absolute inset-x-3.5 -bottom-0.5 h-px origin-left scale-x-0 bg-text/60 transition-transform duration-300 ease-out group-hover:scale-x-100",
                    active && "scale-x-0 group-hover:scale-x-0",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Right: cmd-k · bell · settings · avatar (or sign-in CTAs) */}
        <div className="flex items-center gap-2">
          {authed ? (
            <>
              <button
                type="button"
                data-tour="cmdk"
                className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/80 px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-border-strong hover:text-text"
              >
                <span className="hidden sm:inline">Search</span>
                <kbd className="font-mono text-[10px] tracking-wider text-text-dim">
                  ⌘K
                </kbd>
              </button>
              <CreditPill />
              <NotificationBell />
              <ThemeToggleButton />
              {/* Real user signed in via Supabase → dropdown. Demo mode → keep
                  the old initials avatar that links to settings. */}
              {user ? (
                <UserMenu />
              ) : (
                <Link
                  href="/settings"
                  aria-label="Profile"
                  className="relative h-8 w-8 overflow-hidden rounded-full border border-border-soft bg-gradient-to-br from-surface-elevated to-surface"
                >
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-text-muted">
                    {initialsOf(profileName)}
                  </div>
                </Link>
              )}
            </>
          ) : (
            <>
              <ThemeToggleButton />
              <GuestAuthButtons />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
