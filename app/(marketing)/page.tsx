"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  ChevronDown,
  Globe2,
  MessageSquareQuote,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PulseDot } from "@/components/animated/pulse-dot";

export default function MarketingLanding() {
  const reduce = useReducedMotion();
  return (
    <main className="relative">
      {/* Top nav strip */}
      <nav className="sticky top-0 z-30 h-14 w-full border-b border-border-soft bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-pulse-glow rounded-full bg-go" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-go shadow-[0_0_10px_rgba(0,210,106,0.9)]" />
            </span>
            <span className="font-medium tracking-tight text-text">Wynner</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-text-muted md:flex">
            <a href="#features" className="hover:text-text">Features</a>
            <a href="#how" className="hover:text-text">How it works</a>
            <a href="#pricing" className="hover:text-text">Pricing</a>
            <Link href="/docs" className="hover:text-text">Docs</Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full text-text-muted hover:text-text"
            >
              <Link href="/dashboard">Try the demo</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link href="/auth?mode=signup">
                Sign up <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[640px]"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(0,210,106,0.10) 0%, transparent 65%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/60 px-3 py-1 text-xs text-text-muted"
          >
            <PulseDot color="#00D26A" size={6} />
            Dropshipping intelligence · built for operators
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-8 text-balance text-6xl font-medium leading-[1.05] tracking-tight md:text-7xl"
          >
            Know before you{" "}
            <span className="bg-gradient-to-r from-text via-text to-go bg-clip-text text-transparent">
              launch
            </span>
            .
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-text-muted"
          >
            Score any product against margin, market fit, demand, competition,
            and creative potential. Surface real Reddit buyer language. Ship
            winners with confidence.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Button asChild size="lg" className="rounded-full">
              <Link href="/dashboard">
                <Sparkles className="mr-1.5 h-4 w-4" />
                Try the demo
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-border-soft bg-surface/60"
            >
              <Link href="/auth?mode=signup">
                Sign up <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
          {/* Animated demo loop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-16 max-w-3xl"
          >
            <DemoLoop reduced={Boolean(reduce)} />
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative border-t border-border-soft px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-2xl text-3xl font-medium tracking-tight md:text-4xl">
            Three signals nobody else gives you in one place.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Feature
              icon={Brain}
              title="Five-pillar scoring engine"
              body="Margin · market fit · demand · competition · creative. Pure heuristics that fall back when AI's off; sharper with it on. Always grounded in real numbers."
              accent="#00D26A"
            />
            <Feature
              icon={MessageSquareQuote}
              title="Real Reddit voice mining"
              body="Pulls verbatim quotes from buyer communities. Surfaces the exact slang, pains, and objections your customers use when nobody's selling to them."
              accent="#F5A623"
            />
            <Feature
              icon={Globe2}
              title="Country-fit modeling"
              body="15 countries with hand-curated AOV, CPM, COD preference, niche heat, return-rate, and trending lists. Score the same product 15 different ways."
              accent="#3B82F6"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-border-soft px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-2xl text-3xl font-medium tracking-tight md:text-4xl">
            From a product link to a launch decision in 60 seconds.
          </h2>
          <ol className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-2xl border border-border-soft bg-surface p-5"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs tabular-nums text-text-dim">
                    0{i + 1}
                  </span>
                  <s.icon className="h-4 w-4 text-go" />
                </div>
                <h3 className="mt-3 text-base font-medium text-text">
                  {s.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-text-muted">
                  {s.body}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* PRICING — full page lives at /pricing */}
      <section id="pricing" className="relative border-t border-border-soft px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
              Pay for what you actually use.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-text-muted">
              Credits never expire. Plans give you more, daily. No tricks.
              From €0 to €49 — pick what works.
            </p>
          </div>

          {/* Three plan teaser pills */}
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <PlanTeaser name="Starter" price="€0" credits={10} accent="#5B8DFF" />
            <PlanTeaser name="Pro" price="€19" credits={100} accent="#A788FF" highlight />
            <PlanTeaser name="Operator" price="€49" credits={300} accent="#FF89C5" />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/pricing">
                <Sparkles className="mr-1.5 h-4 w-4" />
                See full pricing
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-border-soft bg-surface/60"
            >
              <Link href="/dashboard">Try the demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border-soft px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-xs text-text-dim">
          <div className="flex items-center gap-3">
            <span>© {new Date().getFullYear()} Wynner</span>
            <span>·</span>
            <span>v0.10</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="hover:text-text">Docs</Link>
            <Link href="/changelog" className="hover:text-text">Changelog</Link>
            <Link href="/dashboard" className="hover:text-text">App</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

const STEPS = [
  {
    title: "Paste a product URL",
    body: "AliExpress, Temu, Amazon — Wynner auto-fills name, price, image.",
    icon: Sparkles,
  },
  {
    title: "Pick a target country",
    body: "15 countries with hand-curated AOV, CPM, niche heat, and return-rate data.",
    icon: Globe2,
  },
  {
    title: "Generate the score",
    body: "Five pillars compute in ~5 seconds. AI reasoning blends with real-data signals.",
    icon: Zap,
  },
  {
    title: "Decide and ship",
    body: "Verdict + creative angle + Reddit voice quotes — all in one dossier.",
    icon: BarChart3,
  },
];

function Feature({
  icon: Icon,
  title,
  body,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface p-6">
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${accent}1A`,
          color: accent,
          border: `1px solid ${accent}33`,
        }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="mt-4 text-lg font-medium tracking-tight text-text">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">{body}</p>
    </div>
  );
}

function PlanTeaser({
  name,
  price,
  credits,
  accent,
  highlight,
}: {
  name: string;
  price: string;
  credits: number;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href="/pricing"
      className={
        "group relative flex flex-col items-start gap-3 rounded-2xl border bg-surface/60 p-5 backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-surface " +
        (highlight ? "border-transparent" : "border-border-soft")
      }
      style={
        highlight
          ? {
              boxShadow: `0 0 0 1px ${accent}55, 0 16px 40px -12px ${accent}55`,
            }
          : undefined
      }
    >
      {highlight && (
        <span
          className="absolute -top-2 right-4 inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white shadow-md"
          style={{ background: accent }}
        >
          Most popular
        </span>
      )}
      <div className="flex items-baseline justify-between gap-2 w-full">
        <h3 className="text-base font-medium text-text">{name}</h3>
        <span className="font-mono text-lg tabular-nums text-text">{price}</span>
      </div>
      <div
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px]"
        style={{
          backgroundColor: `${accent}1A`,
          color: accent,
          border: `1px solid ${accent}33`,
        }}
      >
        <span className="font-mono font-semibold tabular-nums">{credits}</span>
        <span className="opacity-80">credits / mo</span>
      </div>
    </Link>
  );
}

/**
 * A small "demo loop" — a fake product card that cycles its score every 2.5s.
 * Pure visual; no real interaction. Designed to draw the eye, not distract.
 */
function DemoLoop({ reduced }: { reduced: boolean }) {
  const samples = [
    { name: "Magnetic posture corrector belt", score: 88, verdict: "GO LIVE", color: "#00D26A" },
    { name: "Self-stirring travel mug", score: 82, verdict: "GO LIVE", color: "#00D26A" },
    { name: "LED motion-sensor toilet light", score: 86, verdict: "GO LIVE", color: "#00D26A" },
    { name: "Heated Bluetooth eye massager", score: 76, verdict: "TEST IT", color: "#F5A623" },
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-soft bg-surface p-6">
      <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-go/40 bg-go/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-go">
        <PulseDot color="#00D26A" size={5} />
        Scoring
      </div>
      <div className="grid grid-cols-1 gap-6 text-left sm:grid-cols-[1fr_140px]">
        <motion.div
          key={reduced ? "static" : undefined}
          animate={reduced ? undefined : { opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 2.6,
            times: [0, 0.15, 0.85, 1],
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        >
          {/* We just show the first sample's text; the score badge cycles below */}
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Today&apos;s pick
          </div>
          <div className="mt-2 text-2xl font-medium tracking-tight text-text">
            {samples[0].name}
          </div>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-text-muted">
            Pain-point creative writes itself. 7× markup, evergreen demand,
            healthy CPA buffer.
          </p>
        </motion.div>
        <div className="relative flex items-center justify-center">
          <CycleScore samples={samples} reduced={reduced} />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-1 text-text-dim">
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </div>
    </div>
  );
}

function CycleScore({
  samples,
  reduced,
}: {
  samples: { score: number; verdict: string; color: string }[];
  reduced: boolean;
}) {
  // Show the score values rotating. We render them stacked; opacity cycles.
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, #00D26A 70%, transparent 30%)",
          mask: "radial-gradient(closest-side, transparent 76%, black 78%)",
          WebkitMask:
            "radial-gradient(closest-side, transparent 76%, black 78%)",
          opacity: 0.7,
        }}
      />
      {samples.map((s, i) => (
        <motion.div
          key={s.score}
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: i === 0 ? 1 : 0 }}
          animate={
            reduced
              ? undefined
              : {
                  opacity: [0, 1, 1, 0],
                }
          }
          transition={
            reduced
              ? undefined
              : {
                  duration: samples.length * 2.5,
                  times: [
                    (i / samples.length) - 0.02 < 0 ? 0 : (i / samples.length) - 0.02,
                    i / samples.length + 0.05,
                    (i + 1) / samples.length - 0.02,
                    (i + 1) / samples.length,
                  ],
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        >
          <span
            className="font-mono text-4xl font-semibold tabular-nums"
            style={{ color: s.color }}
          >
            {s.score}
          </span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-text-dim">
            {s.verdict}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
