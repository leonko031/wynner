"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNowStrict } from "date-fns";
import { Award, Bell, Check, Sparkles, TrendingUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/lib/store/notifications";
import { useProductStore } from "@/lib/store/products";
import { usePreferences } from "@/lib/store/preferences";
import type { NotificationKind } from "@/lib/store/notifications";
import { cn } from "@/lib/utils";

const ICON_BY_KIND: Record<NotificationKind, React.ElementType> = {
  scan_complete: Sparkles,
  milestone: Award,
  inactivity: TrendingUp,
  tip: Bell,
};

const INACTIVITY_THRESHOLD_DAYS = 7;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function NotificationBell() {
  const items = useNotifications((s) => s.items);
  const push = useNotifications((s) => s.push);
  const markAllRead = useNotifications((s) => s.markAllRead);
  const markRead = useNotifications((s) => s.markRead);
  const remove = useNotifications((s) => s.remove);
  const inactivityOn = usePreferences(
    (s) => s.notifications.inactivityReminders,
  );
  const products = useProductStore((s) => s.products);

  const unread = useMemo(() => items.filter((it) => !it.readAt).length, [items]);

  // Inactivity reminder: if it's been ≥ 7 days since the most recent createdAt
  // among products AND we haven't fired one in the last 7 days.
  useEffect(() => {
    if (!inactivityOn || products.length === 0) return;
    const t = window.setTimeout(() => {
      const lastCreated = Math.max(
        ...products.map((p) => new Date(p.createdAt).getTime()),
      );
      const days = (Date.now() - lastCreated) / ONE_DAY_MS;
      if (days < INACTIVITY_THRESHOLD_DAYS) return;
      const recent = items.find(
        (n) =>
          n.kind === "inactivity" &&
          Date.now() - new Date(n.createdAt).getTime() < 7 * ONE_DAY_MS,
      );
      if (recent) return;
      push({
        kind: "inactivity",
        title: "It's been a quiet week",
        body: `${Math.round(days)} days since your last scan — try something new?`,
        href: "/scan",
      });
    }, 1500);
    return () => window.clearTimeout(t);
  }, [products, items, inactivityOn, push]);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && unread > 0) {
          // Mark read after a small pause so the user sees the unread state once.
          window.setTimeout(() => markAllRead(), 800);
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
          className="relative flex h-8 w-8 items-center justify-center rounded-full border border-border-soft bg-surface/80 text-text-muted transition-colors hover:border-border-strong hover:text-text"
        >
          <Bell className="h-3.5 w-3.5" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key={unread}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-go px-1 font-mono text-[8px] font-semibold tabular-nums text-ink shadow-[0_0_8px_rgba(0,210,106,0.7)]"
              >
                {unread > 9 ? "9+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-80 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b border-border-soft px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Notifications
          </span>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => markAllRead()}
              className="text-[11px] text-text-muted hover:text-text"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-text-muted">
              Nothing yet. Score something.
            </div>
          ) : (
            <ul className="divide-y divide-border-soft">
              {items.slice(0, 12).map((it) => {
                const Icon = ICON_BY_KIND[it.kind];
                const content = (
                  <div
                    className={cn(
                      "group flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-surface-elevated",
                      !it.readAt && "bg-go/5",
                    )}
                  >
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{
                        backgroundColor: `${it.accentColor}1F`,
                        color: it.accentColor,
                      }}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-text">
                        {it.title}
                      </div>
                      {it.body && (
                        <p className="mt-0.5 text-[11px] leading-relaxed text-text-muted">
                          {it.body}
                        </p>
                      )}
                      <span className="mt-1 inline-block font-mono text-[9px] uppercase tracking-wider text-text-dim">
                        {formatDistanceToNowStrict(new Date(it.createdAt))} ago
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        remove(it.id);
                      }}
                      aria-label="Dismiss"
                      className="ml-1 text-text-dim opacity-0 transition-opacity group-hover:opacity-100 hover:text-text"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                );
                return (
                  <li key={it.id} onClick={() => markRead(it.id)}>
                    {it.href ? (
                      <Link href={it.href} className="block">
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
