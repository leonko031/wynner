"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Search, Sparkle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The live source feed — left column of the cinematic live-scan UI.
 *
 * Three event types stream in from the SSE channel and render here:
 *
 *   query — "🔍 Searching: '...'" with the query text TYPING IN.
 *   source — "{domain title}" + {domain} caption with favicon + slide-in.
 *   signal — "Found N {type} ({stage})" with a sparkle scale-bounce.
 *
 * Newest at top, older items fade. Counter at the bottom shows the running
 * totals so the user always knows how much real research has happened.
 */

export type FeedEvent =
  | { kind: "query"; id: string; query: string; stage: string; ts: number }
  | {
      kind: "source";
      id: string;
      uri: string;
      title: string;
      domain: string;
      stage: string;
      ts: number;
    }
  | {
      kind: "signal";
      id: string;
      count: number;
      type: string;
      stage: string;
      ts: number;
    };

type Props = {
  events: FeedEvent[];
  sourceCount: number;
  queryCount: number;
  className?: string;
};

export function SourceFeed({ events, sourceCount, queryCount, className }: Props) {
  // We render newest first; the events array is appended chronologically so
  // we reverse a slice (capped at 80 to keep DOM lean on long scans).
  const recent = [...events].slice(-80).reverse();

  return (
    <aside
      className={cn(
        "glass relative flex h-full flex-col rounded-3xl p-5",
        className,
      )}
    >
      <header className="mb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
          What Wynner is reading
        </div>
        <p className="mt-1 text-xs text-text-dim">
          Live web research stream
        </p>
      </header>

      <div className="relative -mr-1 flex-1 overflow-y-auto pr-1">
        {/* Top fade so newest event slides in from a soft edge */}
        <div
          className="pointer-events-none sticky top-0 z-10 -mb-4 h-4"
          style={{
            background:
              "linear-gradient(to bottom, var(--surface-glass-strong) 0%, transparent 100%)",
          }}
        />
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {recent.map((ev, i) => (
              <motion.li
                key={ev.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{
                  opacity: ageOpacity(ev.ts, i === 0),
                  x: 0,
                }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <EventRow event={ev} isLatest={i === 0} />
              </motion.li>
            ))}
          </AnimatePresence>
          {recent.length === 0 && (
            <li className="rounded-xl border border-dashed border-border-soft px-3 py-3 text-center text-xs text-text-dim">
              Waiting for the first search…
            </li>
          )}
        </ul>
      </div>

      <footer className="mt-3 border-t border-border-soft pt-3 text-xs text-text-muted">
        <span className="font-mono tabular-nums text-text">{sourceCount}</span>{" "}
        source{sourceCount === 1 ? "" : "s"} ·{" "}
        <span className="font-mono tabular-nums text-text">{queryCount}</span>{" "}
        quer{queryCount === 1 ? "y" : "ies"}
      </footer>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* Event row                                                                   */
/* -------------------------------------------------------------------------- */

function EventRow({ event, isLatest }: { event: FeedEvent; isLatest: boolean }) {
  if (event.kind === "query") {
    return <QueryRow query={event.query} isLatest={isLatest} />;
  }
  if (event.kind === "source") {
    return (
      <SourceRow
        uri={event.uri}
        title={event.title}
        domain={event.domain}
      />
    );
  }
  return <SignalRow count={event.count} type={event.type} stage={event.stage} />;
}

function QueryRow({ query, isLatest }: { query: string; isLatest: boolean }) {
  // The latest query types in character-by-character; older queries render
  // statically (no need to animate everything when scrolling).
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(isLatest && !reduce ? "" : query);

  useEffect(() => {
    if (!isLatest || reduce) {
      setShown(query);
      return;
    }
    const chars = Array.from(query);
    let i = 0;
    const interval = window.setInterval(() => {
      i += 2;
      if (i >= chars.length) {
        setShown(query);
        window.clearInterval(interval);
        return;
      }
      setShown(chars.slice(0, i).join(""));
    }, 20);
    return () => window.clearInterval(interval);
  }, [query, isLatest, reduce]);

  return (
    <div className="flex items-start gap-2 rounded-xl border border-border-soft/60 bg-surface/40 px-3 py-2.5">
      <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aurora-purple" />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          Searching
        </div>
        <div className="mt-0.5 truncate text-sm text-text">
          “{shown}
          {isLatest && shown !== query && (
            <span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-text-muted" />
          )}
          ”
        </div>
      </div>
    </div>
  );
}

function SourceRow({
  uri,
  title,
  domain,
}: {
  uri: string;
  title: string;
  domain: string;
}) {
  return (
    <div className="group flex items-start gap-2 rounded-xl border border-border-soft/60 bg-surface/40 px-3 py-2.5">
      <motion.img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
        alt=""
        width={14}
        height={14}
        initial={{ opacity: 0, rotate: -90 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-text">{title}</div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          {domain}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="mt-1 inline-flex items-center gap-1 text-[10px] text-go"
        >
          <span>Read by Wynner ✓</span>
        </motion.div>
      </div>
      <a
        href={uri}
        target="_blank"
        rel="noreferrer noopener"
        className="shrink-0 text-text-dim opacity-0 transition-opacity group-hover:opacity-100 hover:text-text"
        aria-label="Open source"
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function SignalRow({
  count,
  type,
  stage,
}: {
  count: number;
  type: string;
  stage: string;
}) {
  return (
    <motion.div
      initial={{ scale: 0.92 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
      className="flex items-center gap-2 rounded-xl border border-go/35 bg-go/8 px-3 py-2 text-sm text-text"
      style={{ backgroundColor: "rgba(61,214,140,0.07)" }}
    >
      <Sparkle className="h-3.5 w-3.5 shrink-0 text-go" />
      <span>
        Found <span className="font-mono tabular-nums">{count}</span> {type}{" "}
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          ({stage})
        </span>
      </span>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Age-based opacity                                                           */
/* -------------------------------------------------------------------------- */

function ageOpacity(ts: number, isLatest: boolean): number {
  if (isLatest) return 1;
  const ageSec = (Date.now() - ts) / 1000;
  if (ageSec < 8) return 1;
  if (ageSec < 20) return 0.55;
  return 0.3;
}
