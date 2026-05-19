"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNowStrict } from "date-fns";
import { Award, Heart, Sparkles, TrendingUp } from "lucide-react";
import { PulseDot } from "@/components/animated/pulse-dot";
import { useActivityFeed } from "@/lib/hooks";
import type { ActivityEvent, ActivityType } from "@/types";

const ICON_BY_TYPE: Record<ActivityType, React.ElementType> = {
  scan_complete: Sparkles,
  favorite_added: Heart,
  trend_alert: TrendingUp,
  milestone: Award,
};

function useNow(intervalMs = 5_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function relative(ts: string, now: number): string {
  const ms = now - new Date(ts).getTime();
  if (ms < 8_000) return "just now";
  return `${formatDistanceToNowStrict(new Date(ts), { addSuffix: false })} ago`;
}

function FeedItem({ ev, now }: { ev: ActivityEvent; now: number }) {
  const Icon = ICON_BY_TYPE[ev.type];
  const age = now - new Date(ev.timestamp).getTime();
  const dim = age > 30_000;
  const fresh = age < 1500;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{
        opacity: dim ? 0.6 : 1,
        height: "auto",
        marginTop: 0,
      }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative overflow-hidden"
    >
      {/* Soft accent flash on freshly-arrived events */}
      {fresh && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-full w-1.5"
          style={{
            background: `linear-gradient(to right, ${ev.accentColor}, transparent)`,
          }}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      )}
      <div
        className="flex items-start gap-3 border-l-2 py-2 pl-3"
        style={{ borderColor: ev.accentColor }}
      >
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${ev.accentColor}1F`, color: ev.accentColor }}
        >
          <Icon className="h-3 w-3" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-text">{ev.message}</p>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            {relative(ev.timestamp, now)}
          </span>
        </div>
      </div>
    </motion.li>
  );
}

export function ActivityFeed() {
  const events = useActivityFeed();
  const now = useNow(5_000);
  const visible = events.slice(0, 8);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-5 flex items-center gap-2">
        <h2 className="text-xl font-medium tracking-tight md:text-2xl">
          Live activity
        </h2>
        <PulseDot color="#00D26A" size={6} />
      </div>
      <div className="rounded-2xl border border-border-soft bg-surface/40 p-3 md:p-4">
        {visible.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-text-muted">
            Waiting for the first signal…
          </div>
        ) : (
          <motion.ul layout className="space-y-1">
            <AnimatePresence initial={false}>
              {visible.map((ev) => (
                <FeedItem key={ev.id} ev={ev} now={now} />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>
    </section>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-5 h-7 w-40 animate-pulse rounded-md bg-surface-elevated" />
      <div className="space-y-2 rounded-2xl border border-border-soft bg-surface/40 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-md bg-surface-elevated"
          />
        ))}
      </div>
    </section>
  );
}
