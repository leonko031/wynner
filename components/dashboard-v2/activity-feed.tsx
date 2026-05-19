"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Gift,
  Heart,
  History,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useProductStore } from "@/lib/store/products";
import { useCreditsStore } from "@/lib/store/credits";
import {
  buildActivityFeed,
  userProducts,
  type ActivityEvent,
} from "@/lib/dashboard/momentum";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Filter = "all" | "scans" | "favorites" | "credits";

const PAGE = 20;

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.round(hr / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function iconFor(type: ActivityEvent["type"]) {
  switch (type) {
    case "scan":
      return Sparkles;
    case "favorite":
      return Heart;
    case "compare":
      return Activity;
    case "regenerate":
      return RefreshCw;
    case "credit_grant":
      return Gift;
    case "credit_spend":
      return Sparkles;
    default:
      return Activity;
  }
}

function accentFor(type: ActivityEvent["type"]): string {
  switch (type) {
    case "scan":
      return "#5B8DFF";
    case "favorite":
      return "#FF89C5";
    case "compare":
      return "#A788FF";
    case "regenerate":
      return "#88E5C8";
    case "credit_grant":
      return "#3DD68C";
    case "credit_spend":
      return "#9DA0BF";
  }
}

export function ActivityFeed() {
  // Stable selector + memoized filter — see greeting-bar.tsx for the rationale.
  // Returning userProducts() directly from the selector churns refs each render.
  const allProducts = useProductStore((s) => s.products);
  const products = useMemo(() => userProducts(allProducts), [allProducts]);
  const favorites = useProductStore((s) => s.favorites);
  const transactions = useCreditsStore((s) => s.transactions);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  // Both `relativeTime()` and `Date.toLocaleString()` depend on the client
  // clock; gating their output behind `mounted` avoids the SSR/CSR mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  const events = useMemo(
    () => buildActivityFeed(products, favorites, transactions),
    [products, favorites, transactions],
  );

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filter === "all") return true;
      if (filter === "scans") return e.type === "scan" || e.type === "regenerate";
      if (filter === "favorites") return e.type === "favorite";
      if (filter === "credits")
        return e.type === "credit_grant" || e.type === "credit_spend";
      return true;
    });
  }, [events, filter]);

  const visible = filtered.slice(0, page * PAGE);
  const canLoadMore = visible.length < filtered.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-text-dim" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Your trail
            </span>
          </div>
          <h2 className="font-serif text-2xl tracking-tight text-text md:text-3xl">
            Recent activity
          </h2>
        </div>
        <Select
          value={filter}
          onValueChange={(v) => {
            setFilter(v as Filter);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-[140px] rounded-full border-border-soft bg-surface/70 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activity</SelectItem>
            <SelectItem value="scans">Scans</SelectItem>
            <SelectItem value="favorites">Favorites</SelectItem>
            <SelectItem value="credits">Credits</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass rounded-3xl p-3">
        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-1">
            <AnimatePresence initial={false}>
              {visible.map((event) => {
                const Icon = iconFor(event.type);
                const accent = accentFor(event.type);
                return (
                  <motion.li
                    key={event.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface/60"
                  >
                    <span
                      aria-hidden
                      className="absolute left-0 top-2 bottom-2 w-[3px] origin-top scale-y-0 rounded-full transition-transform duration-200 group-hover:scale-y-100"
                      style={{ background: accent }}
                    />
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: `${accent}1A`,
                        color: accent,
                        border: `1px solid ${accent}33`,
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-text">{event.text}</div>
                      <div
                        className="text-[11px] text-text-dim"
                        title={mounted ? new Date(event.timestamp).toLocaleString() : undefined}
                        suppressHydrationWarning
                      >
                        {mounted ? relativeTime(event.timestamp) : "—"}
                      </div>
                    </div>
                    {event.href && (
                      <Link
                        href={event.href}
                        className="rounded-full border border-border-soft bg-surface/70 px-2.5 py-1 text-[11px] font-medium text-text-muted hover:border-aurora-blue/45 hover:text-text"
                      >
                        {event.cta ?? "Open"}
                      </Link>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
        {canLoadMore && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-border-soft bg-surface/70 px-4 py-1.5 text-xs text-text-muted hover:border-border-strong hover:text-text"
            >
              Load {Math.min(PAGE, filtered.length - visible.length)} more
            </button>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(91,141,255,0.15), rgba(167,136,255,0.20), rgba(255,137,197,0.15))",
          border: "1px solid rgba(167,136,255,0.30)",
        }}
      >
        <Sparkles className="h-5 w-5 text-aurora-purple" />
      </div>
      <h3 className="font-serif text-lg text-text">Your journey starts with your first scan</h3>
      <p className="max-w-sm text-sm text-text-muted">
        Every product you score, favorite, or compare shows up here.
      </p>
      <Link
        href="/scan"
        className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-aurora-blue/15 px-4 text-xs font-medium text-aurora-blue hover:bg-aurora-blue/20"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Start your first scan
      </Link>
    </div>
  );
}
