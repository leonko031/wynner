"use client";

import { motion } from "framer-motion";
import { ArrowRight, GitCompareArrows, Heart, RefreshCw, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { SectionHeader } from "./editorial-primitives";
import { useProductStore } from "@/lib/store/products";
import { NICHES } from "@/lib/data/niches";
import type { Product } from "@/types";

type TrailEvent =
  | { kind: "scan"; ts: string; product: Product }
  | { kind: "favorite"; ts: string; product: Product }
  | { kind: "compare"; ts: string; products: Product[] }
  | { kind: "regenerate"; ts: string };

type Props = {
  sectionId: string;
  /** Optional pre-computed events from outside — if omitted the component
   * derives a sensible trail from the product store. */
  events?: TrailEvent[];
};

const VERDICT_COLOR: Record<string, string> = {
  go: "#3DD68C",
  test: "#FFAB40",
  risky: "#FF7E5F",
  skip: "#FF5C7C",
};

export function IntelligenceTrail({ sectionId, events }: Props) {
  const products = useProductStore((s) => s.products);
  const favorites = useProductStore((s) => s.favorites);

  // Derive a trail when none provided — most recent products + favorited products.
  const derived = useMemo<TrailEvent[]>(() => {
    if (events) return events;
    const list: TrailEvent[] = [];
    const recent = [...products]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
    for (const p of recent) {
      list.push({ kind: "scan", ts: p.createdAt, product: p });
    }
    const favIds =
      favorites instanceof Set ? Array.from(favorites).slice(0, 4) : (favorites as string[] ?? []).slice(0, 4);
    for (const id of favIds) {
      const p = products.find((x) => x.id === id);
      if (p) {
        list.push({ kind: "favorite", ts: p.updatedAt ?? p.createdAt, product: p });
      }
    }
    // Sort all combined events by ts desc.
    list.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    return list.slice(0, 12);
  }, [events, products, favorites]);

  return (
    <section className="pt-32 md:pt-40">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-12">
        <SectionHeader
          id={sectionId}
          kicker="YOUR TRAIL"
          headline="What you've been doing"
          subHeadline="Your last actions, in order"
        />

        {derived.length < 3 ? (
          <EmptyTrail />
        ) : (
          <FilmReel events={derived} />
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function FilmReel({ events }: { events: TrailEvent[] }) {
  return (
    <div className="relative">
      {/* Top perforation strip */}
      <Perforation />

      <div className="relative">
        <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 py-3 hide-scrollbar">
          {events.map((e, i) => (
            <TrailCard key={`${e.kind}-${i}`} event={e} index={i} />
          ))}
        </div>

        {/* Gradient fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#FCFCFD] to-transparent dark:from-[#0A0B1F]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#FCFCFD] to-transparent dark:from-[#0A0B1F]" />
      </div>

      {/* Bottom perforation strip */}
      <Perforation />
    </div>
  );
}

function Perforation() {
  return (
    <div
      aria-hidden
      className="flex h-4 items-center justify-evenly"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(157,160,191,0.35) 1.5px, transparent 1.5px)",
        backgroundSize: "16px 8px",
        backgroundPosition: "center",
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */

function TrailCard({ event, index }: { event: TrailEvent; index: number }) {
  const label = labelFor(event);
  const href = hrefFor(event);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.45, delay: 0.04 * index, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="w-72 shrink-0 snap-start"
    >
      <Link
        href={href}
        className="glass group block h-96 overflow-hidden rounded-2xl transition-shadow hover:shadow-[0_24px_48px_-16px_rgba(167,136,255,0.45)]"
      >
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
            {iconFor(event)}
            <span>{label}</span>
          </div>

          <div className="mt-3 flex-1">
            <TrailBody event={event} />
          </div>

          <div className="mt-3 flex items-end justify-between border-t border-border-soft pt-3 text-[11px] text-text-muted">
            <time
              title={new Date(event.ts).toLocaleString()}
              dateTime={event.ts}
            >
              {relativeTime(event.ts)}
            </time>
            <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function TrailBody({ event }: { event: TrailEvent }) {
  if (event.kind === "scan" || event.kind === "favorite") {
    const p = event.product;
    return (
      <div className="flex h-full flex-col">
        <div className="relative h-40 w-full overflow-hidden rounded-lg bg-surface-elevated">
          {p.image && (
            <Image
              src={p.image}
              alt={p.name}
              fill
              sizes="280px"
              className="object-cover"
            />
          )}
          <div className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 font-mono text-xs font-medium backdrop-blur-md dark:bg-black/40 dark:text-white"
               style={{ color: VERDICT_COLOR[p.verdict] }}>
            {p.sellScore}
          </div>
          {event.kind === "favorite" && (
            <div className="absolute left-2 top-2 inline-flex h-7 items-center gap-1 rounded-full bg-white/85 px-2 text-[10px] text-aurora-pink backdrop-blur-md dark:bg-black/40">
              <Heart className="h-3 w-3 fill-aurora-pink" /> favorited
            </div>
          )}
        </div>
        <h4 className="mt-3 line-clamp-2 font-serif text-base leading-tight text-text">
          {p.name}
        </h4>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-dim">
          {NICHES[p.category]?.label} · {p.verdict.toUpperCase()}
        </div>
      </div>
    );
  }
  if (event.kind === "compare") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex gap-2">
          {event.products.slice(0, 3).map((p) => (
            <div
              key={p.id}
              className="relative h-24 w-1/3 overflow-hidden rounded-lg bg-surface-elevated"
            >
              {p.image && (
                <Image src={p.image} alt={p.name} fill sizes="100px" className="object-cover" />
              )}
            </div>
          ))}
        </div>
        <h4 className="mt-3 line-clamp-3 font-serif text-base leading-tight text-text">
          {event.products.map((p) => p.name).join(" vs ")}
        </h4>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-dim">
          Comparison · {event.products.length} products
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col items-start justify-center">
      <RefreshCw className="h-6 w-6 text-aurora-mint" />
      <p className="mt-3 font-serif text-base text-text">
        You regenerated today&apos;s briefing.
      </p>
    </div>
  );
}

function labelFor(e: TrailEvent): string {
  switch (e.kind) {
    case "scan":
      return "Scan completed";
    case "favorite":
      return "Favorite added";
    case "compare":
      return "Comparison made";
    case "regenerate":
      return "Briefing refreshed";
  }
}

function iconFor(e: TrailEvent) {
  const props = { className: "h-3 w-3" };
  switch (e.kind) {
    case "scan":
      return <Sparkles {...props} style={{ color: "#5B8DFF" }} />;
    case "favorite":
      return <Heart {...props} style={{ color: "#FF89C5" }} />;
    case "compare":
      return <GitCompareArrows {...props} style={{ color: "#A788FF" }} />;
    case "regenerate":
      return <RefreshCw {...props} style={{ color: "#88E5C8" }} />;
  }
}

function hrefFor(e: TrailEvent): string {
  switch (e.kind) {
    case "scan":
    case "favorite":
      return `/product/${e.product.id}`;
    case "compare":
      return `/compare?products=${e.products.map((p) => p.id).join(",")}`;
    case "regenerate":
      return "/dashboard#dashboard-briefing";
  }
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.round(hr / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function EmptyTrail() {
  return (
    <div className="glass rounded-3xl p-12 text-center">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-aurora-purple/15">
        <Sparkles className="h-5 w-5 text-aurora-purple" />
      </div>
      <p className="font-serif text-2xl italic text-text">
        Your trail begins with your next scan.
      </p>
      <p className="mt-2 text-sm text-text-muted">
        Once you start scoring products, this reel fills with your moves.
      </p>
      <Link
        href="/scan"
        className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-medium text-white"
        style={{ background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)" }}
      >
        Start a scan
      </Link>
    </div>
  );
}
