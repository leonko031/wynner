"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronDown, Sparkle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ScoreNumber } from "@/components/animated/score-number";
import { Kicker } from "./editorial-primitives";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { Product, Verdict } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  firstName: string;
  topPick: Product | null;
  hook: string;
  hookLoading: boolean;
  metadata: {
    minRead: number;
    newSignals: number;
    hoursSinceLastScan: number | null;
  };
  scrollTargetId: string;
};

const VERDICT_GLOW: Record<Verdict, string> = {
  go: "rgba(61, 214, 140, 0.5)",
  test: "rgba(255, 171, 64, 0.45)",
  risky: "rgba(255, 126, 95, 0.4)",
  skip: "rgba(255, 92, 124, 0.35)",
};

const VERDICT_LABEL: Record<Verdict, string> = {
  go: "GO",
  test: "TEST",
  risky: "RISKY",
  skip: "SKIP",
};

/**
 * The first fold — magazine cover. Editorial text on the left, hero product
 * visual on the right.
 *
 * v2 of this component swapped a CharStagger greeting + cursor parallax +
 * scroll parallax + combined motion-value transforms for plain CSS and a
 * single CSS-transition hover. Looked nearly identical; the input latency
 * on clicks was the cost we were paying for the "magazine" feel.
 */
export function CinematicOpening({
  firstName,
  topPick,
  hook,
  hookLoading,
  metadata,
  scrollTargetId,
}: Props) {
  const today = useMemo(() => formatLongDate(), []);
  const greeting = useMemo(() => greetingFor(new Date()), []);

  return (
    <section className="relative min-h-[calc(100vh-72px)] w-full">
      <div className="mx-auto grid h-full w-full max-w-[1440px] grid-cols-1 items-center gap-12 px-6 py-10 md:px-12 lg:grid-cols-[1.22fr_1fr] lg:gap-16 lg:py-16">
        <div className="order-2 lg:order-1">
          <Kicker>WYNNER DAILY · {today}</Kicker>

          <h1 className="mt-6 font-serif leading-[0.95] tracking-tight text-text">
            <span className="block text-[44px] md:text-5xl lg:text-[68px]">
              {greeting},
            </span>
            <span className="mt-1 block bg-gradient-to-r from-aurora-blue via-aurora-purple to-aurora-pink bg-clip-text text-[44px] italic text-transparent md:text-5xl lg:text-[68px]">
              {firstName}
            </span>
          </h1>

          <p
            className={cn(
              "mt-8 max-w-xl font-serif text-xl italic leading-[1.25] text-text transition-opacity duration-300 md:text-2xl lg:text-[28px]",
              hookLoading && "opacity-60",
            )}
          >
            {hook}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
            <span>
              <span className="font-mono tabular-nums">{metadata.minRead}</span> min read
            </span>
            <span aria-hidden>·</span>
            <span>
              <span className="font-mono tabular-nums">{metadata.newSignals}</span> new signals
            </span>
            <span aria-hidden>·</span>
            <span>
              {metadata.hoursSinceLastScan === null
                ? "no scans yet"
                : metadata.hoursSinceLastScan < 1
                  ? "last scan just now"
                  : `last scan ${metadata.hoursSinceLastScan}h ago`}
            </span>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById(scrollTargetId);
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(167,136,255,0.65)] transition-all hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              }}
            >
              Read today&apos;s brief
              <ArrowDownRight className="h-4 w-4" />
            </button>
            <Link
              href="/scan"
              className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-5 text-sm text-text backdrop-blur-md transition-all hover:border-aurora-purple/45"
            >
              <Sparkle className="h-3.5 w-3.5" />
              Start new scan
            </Link>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <HeroProduct product={topPick} />
        </div>
      </div>

      <ScrollIndicator scrollTargetId={scrollTargetId} />
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function HeroProduct({ product }: { product: Product | null }) {
  if (!product) {
    return <HeroProductFallback />;
  }

  const verdictGlow = VERDICT_GLOW[product.verdict];
  const niche = NICHES[product.category];
  const country = COUNTRIES[product.targetCountry];

  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      {/* Static halo glow — no JS animation, just a soft radial gradient. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-12%] -z-10 rounded-full blur-[80px]"
        style={{
          background: `radial-gradient(closest-side, ${verdictGlow}, transparent 70%)`,
          opacity: 0.75,
        }}
      />

      <Link
        href={`/product/${product.id}`}
        className="group block overflow-hidden rounded-[28px] border border-border-soft bg-surface shadow-[0_30px_60px_-20px_rgba(26,27,58,0.25)] transition-transform duration-300 hover:scale-[1.015] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]"
      >
        <div className="relative aspect-[4/5] w-full bg-surface-elevated">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 440px, 50vw"
              priority
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-dim">
              no image
            </div>
          )}

          <div className="absolute left-4 top-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/70 px-3 py-1.5 text-xs text-text backdrop-blur-xl dark:bg-black/40 dark:text-white">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: niche?.color ?? "#A788FF" }}
              />
              <span>{niche?.label ?? product.category}</span>
              <span>·</span>
              <span aria-hidden>{country?.flag ?? "🌐"}</span>
            </div>
          </div>

          <div className="absolute right-4 top-4">
            <div
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-white shadow-[0_10px_24px_-8px_rgba(167,136,255,0.7)]"
              style={{
                background:
                  "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              }}
            >
              <ScoreNumber
                value={product.sellScore}
                duration={1.0}
                className="font-serif text-2xl text-white"
              />
            </div>
          </div>

          <div className="absolute inset-x-4 bottom-4">
            <div className="rounded-2xl border border-white/30 bg-white/70 p-4 backdrop-blur-xl dark:bg-black/40">
              <div className="font-serif text-xl leading-tight text-text dark:text-white">
                {product.name}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${verdictGlow.replace("0.5", "0.20").replace("0.45", "0.18").replace("0.4", "0.16").replace("0.35", "0.16")}`,
                    color:
                      product.verdict === "go"
                        ? "#21B97A"
                        : product.verdict === "test"
                          ? "#D69230"
                          : product.verdict === "risky"
                            ? "#E66B52"
                            : "#E64862",
                  }}
                >
                  {VERDICT_LABEL[product.verdict]}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted dark:text-white/60">
                  Today&apos;s top pick
                </span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 right-4">
            <div className="flex h-9 items-center gap-1.5 rounded-full bg-white/80 px-3 font-mono text-[10px] uppercase tracking-wider text-text opacity-70 transition-opacity group-hover:opacity-100 dark:bg-black/50 dark:text-white">
              Open
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

function HeroProductFallback() {
  return (
    <div className="relative mx-auto flex aspect-[4/5] w-full max-w-[440px] items-center justify-center rounded-[28px] border border-dashed border-border-soft bg-surface/40 text-center">
      <div className="px-8">
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          Today&apos;s top pick
        </div>
        <p className="mt-3 font-serif text-2xl leading-tight text-text">
          Score your first product to put it here.
        </p>
        <Link
          href="/scan"
          className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-medium text-white"
          style={{
            background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
          }}
        >
          <Sparkle className="h-3 w-3" />
          Start a scan
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ScrollIndicator({ scrollTargetId }: { scrollTargetId: string }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    function onScroll() {
      setHidden(window.scrollY > 100);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        document
          .getElementById(scrollTargetId)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className={cn(
        "absolute inset-x-0 bottom-6 mx-auto flex flex-col items-center gap-1.5 text-text-muted transition-opacity duration-300",
        hidden ? "pointer-events-none opacity-0" : "opacity-100",
      )}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
        Scroll · or press Space
      </span>
      <ChevronDown className="h-4 w-4 animate-bounce" />
    </button>
  );
}

/* -------------------------------------------------------------------------- */

function formatLongDate(): string {
  const d = new Date();
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  const month = d.toLocaleDateString("en-US", { month: "long" });
  return `${weekday.toUpperCase()} · ${month.toUpperCase()} ${d.getDate()}`;
}

function greetingFor(d: Date): string {
  const h = d.getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good evening";
}
