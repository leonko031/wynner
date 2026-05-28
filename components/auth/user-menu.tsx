"use client";

import Link from "next/link";
import {
  CreditCard,
  Crown,
  LogOut,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react";
import { useUser } from "@/lib/auth/use-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function initialsOf(displayName: string | null | undefined, email: string | null | undefined): string {
  const name = (displayName ?? "").trim();
  if (name) {
    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("") || "?";
  }
  const e = (email ?? "").trim();
  return (e[0]?.toUpperCase() ?? "?");
}

const PLAN_COLORS = {
  starter: "#5B8DFF",
  pro: "#A788FF",
  operator: "#FF89C5",
  agency: "#FFB088",
} as const;

/**
 * Top-nav avatar + dropdown for authenticated users. When unauthenticated,
 * renders nothing — the parent shows the Sign in / Get started buttons instead.
 */
export function UserMenu() {
  const { user, profile, signOut } = useUser();
  if (!user) return null;

  const planColor = PLAN_COLORS[profile?.plan ?? "starter"];
  const initials = initialsOf(profile?.display_name, user.email);
  const isAdmin = profile?.is_admin === true;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="relative h-8 w-8 overflow-hidden rounded-full border border-border-soft bg-gradient-to-br from-surface-elevated to-surface transition-all hover:border-border-strong"
          style={{
            boxShadow: `inset 0 0 0 1px ${planColor}33`,
          }}
        >
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center font-mono text-[10px] font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, ${planColor}, ${planColor}AA)`,
              }}
            >
              {initials}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-2xl border-0 p-1.5 shadow-[0_24px_48px_-16px_rgba(91,141,255,0.30)]"
      >
        <DropdownMenuLabel className="px-2.5 pt-2 pb-1.5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, ${planColor}, ${planColor}AA)`,
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text">
                {profile?.display_name || user.email?.split("@")[0]}
              </div>
              <div className="truncate text-[11px] text-text-muted">{user.email}</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
              style={{
                background: `${planColor}1A`,
                color: planColor,
                border: `1px solid ${planColor}45`,
              }}
            >
              <Sparkles className="h-2.5 w-2.5" />
              {profile?.plan ?? "starter"} plan
            </span>
            {isAdmin && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                  boxShadow: "0 4px 14px -4px rgba(167,136,255,0.55)",
                }}
              >
                <Crown className="h-2.5 w-2.5" />
                Admin
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/credits" className="cursor-pointer">
            <CreditCard className="h-3.5 w-3.5" />
            Credits & billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer">
              <Shield className="h-3.5 w-3.5" />
              Admin panel
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={signOut}
          className="cursor-pointer text-text-muted focus:text-text"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** "Sign in" + "Get started" buttons for the unauthenticated state. */
export function GuestAuthButtons({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="rounded-full text-text-muted hover:text-text"
      >
        <Link href="/auth">Sign in</Link>
      </Button>
      <Button asChild size="sm" className="rounded-full">
        <Link href="/auth?mode=signup">Get started</Link>
      </Button>
    </div>
  );
}
