"use client";

import { motion, useMotionValue, useSpring, useTransform, useScroll, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronDown, Sparkle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScoreNumber } from "@/components/animated/score-number";
import { CharStagger, Kicker } from "./editorial-primitives";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { Product, Verdict } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  firstName: string;
  topPick: Product | null;
  /** Editorial sub-headline from the daily briefing's `openingHook`. */
  hook: string;
  /** Whether the briefing is still loading — used to soften the hook fade. */
  hookLoading: boolean;
  /** Micro-metadata rendered just under the hook. */
  metadata: {
    minRead: number;
    newSignals: number;
    hoursSinceLastScan: number | null;
  };
  /** id of the next section so the primary button can scroll-jump. */
  scrollTargetId: string;
};

const VERDICT_GLOW: Record<Verdict, string> = {
  go: "rgba(61, 214, 140, 0.55)",
  test: "rgba(255, 171, 64, 0.5)",
  risky: "rgba(255, 126, 95, 0.45)",
  skip: "rgba(255, 92, 124, 0.4)",
};

const VERDICT_LABEL: Record<Verdict, string> = {
  go: "GO",
  test: "TEST",
  risky: "RISKY",
  skip: "SKIP",
};

/**
 * The first fold — magazine cover. Editorial text on the left, hero product
 * visual on the right with 3D tilt + cursor parallax + halo glow.
 *
 * Stacks to single column under 1024px (image moves above text on mobile).
 */
export function CinematicOpening({
  firstName,
  topPick,
  hook,
  hookLoading,
  metadata,
  scrollTargetId,
}: Props) {
  const reduce = useReducedMotion();
  const today = useMemo(() => formatLongDate(), []);
  const greeting = useMemo(() => greetingFor(new Date()), []);

  return (
    <section className="relative min-h-[calc(100vh-72px)] w-full">
      <div className="mx-auto grid h-full w-full max-w-[1440px] grid-cols-1 items-center gap-12 px-6 py-10 md:px-12 lg:grid-cols-[1.22fr_1fr] lg:gap-16 lg:py-16">
        {/* LEFT — Editorial opener (renders second on mobile via order-2) */}
        <div className="order-2 lg:order-1">
          <Kicker>WYNNER DAILY · {today}</Kicker>

          <h1 className="mt-6 font-serif leading-[0.95] tracking-tight text-text">
            <CharStagger
              className="block text-[44px] md:text-5xl lg:text-[68px]"
              delay={0.1}
            >
              {`${greeting},`}
            </CharStagger>
            <CharStagger
              className="mt-1 block text-[44px] md:text-5xl lg:text-[68px]"
              italic
              gradient
              delay={0.35}
            >
              {firstName}
            </CharStagger>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: hookLoading ? 0.6 : 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 max-w-xl font-serif text-xl italic leading-[1.25] text-text md:text-2xl lg:text-[28px]"
          >
            {hook}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.05 }}
            className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted"
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 1.2 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
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
          </motion.div>
        </div>

        {/* RIGHT — Hero product visual */}
        <div className="order-1 lg:order-2">
          <HeroProduct product={topPick} reduce={reduce ?? false} />
        </div>
      </div>

      {/* Scroll indicator */}
      <ScrollIndicator scrollTargetId={scrollTargetId} />
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function HeroProduct({ product, reduce }: { product: Product | null; reduce: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Cursor parallax — translate the image at most ±8px in each axis.
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const xSpring = useSpring(cursorX, { stiffness: 90, damping: 18 });
  const ySpring = useSpring(cursorY, { stiffness: 90, damping: 18 });
  // Scroll parallax — image moves slightly faster than the page (1.1x).
  const { scrollY } = useScroll();
  const scrollLift = useTransform(scrollY, [0, 400], [0, -40]);
  // Combine cursor-y + scroll-lift into a single MotionValue.
  const combinedY = useTransform([ySpring, scrollLift], (values) => {
    const list = values as number[];
    return list[0] + list[1];
  });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    function onMove(e: MouseEvent) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      cursorX.set(px * 16);
      cursorY.set(py * 16);
    }
    function onLeave() {
      cursorX.set(0);
      cursorY.set(0);
    }
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [cursorX, cursorY, reduce]);

  if (!product) {
    return <HeroProductFallback />;
  }

  const verdictGlow = VERDICT_GLOW[product.verdict];
  const niche = NICHES[product.category];
  const country = COUNTRIES[product.targetCountry];

  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{ perspective: 1200 }}
      className="relative mx-auto w-full max-w-[440px]"
    >
      {/* Halo glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-[-12%] -z-10 rounded-full blur-[80px]"
        animate={{
          opacity: hovering ? 0.95 : 0.7,
          scale: hovering ? 1.05 : 1,
        }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
        style={{
          background: `radial-gradient(closest-side, ${verdictGlow}, transparent 70%)`,
        }}
      />

      <Link
        href={`/product/${product.id}`}
        className="block focus-visible:outline-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          whileHover={reduce ? undefined : { scale: 1.02 }}
          style={{
            x: reduce ? 0 : xSpring,
            y: reduce ? 0 : combinedY,
            rotateY: reduce ? 0 : -3,
            rotateX: reduce ? 0 : 2,
            transformStyle: "preserve-3d",
          }}
          className="group relative overflow-hidden rounded-[28px] border border-border-soft bg-surface shadow-[0_30px_60px_-20px_rgba(26,27,58,0.25)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]"
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

            {/* Top-left niche/country pill */}
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

            {/* Top-right score badge */}
            <div className="absolute right-4 top-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-white shadow-[0_10px_24px_-8px_rgba(167,136,255,0.7)]"
                style={{
                  background:
                    "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                }}
              >
                <ScoreNumber
                  value={product.sellScore}
                  duration={1.4}
                  className="font-serif text-2xl text-white"
                />
              </motion.div>
            </div>

            {/* Bottom-left title bar */}
            <div className="absolute inset-x-4 bottom-4">
              <div className="rounded-2xl border border-white/30 bg-white/70 p-4 backdrop-blur-xl dark:bg-black/40">
                <div className="font-serif text-xl leading-tight text-text dark:text-white">
                  {product.name}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${verdictGlow.replace("0.55", "0.20").replace("0.5", "0.20").replace("0.45", "0.18").replace("0.4", "0.18")}`,
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

            {/* Bottom-right arrow indicator */}
            <div className="absolute bottom-4 right-4">
              <motion.div
                animate={{ opacity: hovering ? 1 : 0.7 }}
                className="flex h-9 items-center gap-1.5 rounded-full bg-white/80 px-3 text-[10px] font-mono uppercase tracking-wider text-text backdrop-blur-xl dark:bg-black/50 dark:text-white"
              >
                {hovering ? "Open" : "→"}
                <ArrowUpRight className="h-3 w-3" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
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
  const reduce = useReducedMotion();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    function onScroll() {
      setHidden(window.scrollY > 100);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.button
      type="button"
      onClick={() => {
        document
          .getElementById(scrollTargetId)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? -8 : 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "absolute inset-x-0 bottom-6 mx-auto flex flex-col items-center gap-1.5 text-text-muted",
        hidden && "pointer-events-none",
      )}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
        Scroll · or press Space
      </span>
      <motion.div
        animate={reduce ? undefined : { y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="h-4 w-4" />
      </motion.div>
    </motion.button>
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
