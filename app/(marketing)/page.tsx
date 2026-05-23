"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Globe2,
  Megaphone,
  Play,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import CountUp from "react-countup";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import {
  FallbackAvatar,
  FallbackDemoVideo,
  FallbackFeatureCard,
  FallbackHeroVisual,
  VideoModal,
  VideoSlot,
} from "@/components/marketing/video-primitives";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────── */
/* Reveal helpers — every section uses the same entrance pattern.           */
/* ──────────────────────────────────────────────────────────────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 25 },
  },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-aurora-purple">
      {children}
    </div>
  );
}

function SectionHeader({
  kicker,
  headline,
  subhead,
  align = "center",
  className,
}: {
  kicker?: string;
  headline: string;
  subhead?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-12",
        align === "center" && "mx-auto max-w-3xl text-center",
        className,
      )}
    >
      {kicker && <Kicker>{kicker}</Kicker>}
      <motion.h2
        variants={fadeUp}
        className="mt-3 font-serif text-4xl leading-[0.95] tracking-tight text-text md:text-5xl lg:text-6xl"
      >
        {headline}
      </motion.h2>
      {subhead && (
        <motion.p
          variants={fadeUp}
          className="mt-4 text-base leading-relaxed text-text-muted md:text-lg"
        >
          {subhead}
        </motion.p>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* The page                                                                 */
/* ──────────────────────────────────────────────────────────────────────── */

export default function MarketingLanding() {
  const [vslOpen, setVslOpen] = useState(false);

  return (
    <main>
      <MarketingNav />
      <Hero onOpenVsl={() => setVslOpen(true)} />
      <SocialProofStrip />
      <ProblemSection />
      <SolutionSection />
      <FeaturePillars />
      <HowItWorks />
      <ComparisonSection />
      <TestimonialsSection />
      <PricingTeaser />
      <FaqSection />
      <FinalCta />
      <Footer />
      <VideoModal
        open={vslOpen}
        onClose={() => setVslOpen(false)}
        videoSrc="/marketing/hero-vsl.mp4"
        title="Wynner — 40-second story"
      />
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* HERO                                                                     */
/* ──────────────────────────────────────────────────────────────────────── */

function Hero({ onOpenVsl }: { onOpenVsl: () => void }) {
  const reduce = useReducedMotion();

  // Per-word reveal of the headline. Two lines, six words total.
  const words = useMemo(
    () => [
      { text: "Know", gradient: false },
      { text: "before", gradient: false },
      { text: "you", gradient: false, lineBreak: true },
      { text: "launch", gradient: true },
      { text: ".", gradient: true, attach: true },
    ],
    [],
  );

  return (
    <section className="relative min-h-[calc(100vh-80px)] w-full px-6 pb-20 pt-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-[1.2fr_1fr]">
        {/* LEFT — editorial */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/pricing"
              className="group inline-flex items-center gap-2 rounded-full border border-aurora-purple/45 bg-aurora-purple/10 px-3 py-1 text-xs text-text backdrop-blur-md transition-all hover:border-aurora-purple/65"
            >
              <Sparkles className="h-3 w-3 text-aurora-purple" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-aurora-purple">
                NEW
              </span>
              <span className="text-text-muted">
                AI-powered hook angles in every scan
              </span>
              <ArrowRight className="h-3 w-3 text-text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Headline — word stagger */}
          <h1 className="mt-6 font-serif leading-[0.95] tracking-tight text-text">
            <motion.span
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: reduce ? 0 : 0.12,
                    delayChildren: 0.15,
                  },
                },
              }}
              className="block text-5xl md:text-6xl lg:text-7xl"
            >
              {words.map((w, i) => (
                <motion.span
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "inline-block",
                    w.gradient &&
                      "bg-gradient-to-r from-aurora-blue via-aurora-purple to-aurora-pink bg-clip-text text-transparent",
                    !w.attach && "mr-3",
                    w.lineBreak && "after:block after:content-['']",
                  )}
                >
                  {w.text}
                </motion.span>
              ))}
            </motion.span>
          </h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-6 max-w-md text-lg leading-relaxed text-text-muted md:text-xl"
          >
            Wynner scores any dropshipping product against the country you&apos;re
            selling in. Real web research. Real customer voice. Real hook
            angles. In 60 seconds.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/auth?mode=signup"
              className="group relative inline-flex h-14 items-center gap-2 rounded-full px-8 text-base font-medium text-white transition-all hover:brightness-110"
              style={{
                background:
                  "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                boxShadow: "0 14px 40px -10px rgba(167,136,255,0.65)",
                animation: reduce ? undefined : "hero-cta-pulse 4s ease-in-out infinite",
              }}
            >
              Start scanning free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              type="button"
              onClick={onOpenVsl}
              className="group inline-flex h-14 items-center gap-2 rounded-full border border-border-soft bg-surface/70 px-6 text-base text-text backdrop-blur-md transition-all hover:border-aurora-blue/55 hover:bg-aurora-blue/5"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-aurora-blue/15">
                <Play className="h-3 w-3 text-aurora-blue" fill="currentColor" />
              </span>
              Watch the 40-second story
            </button>
          </motion.div>

          {/* Trust micro-line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.0 }}
            className="mt-5 text-sm text-text-dim"
          >
            ✦ 10 free credits to start · No card required · Cancel anytime
          </motion.p>

          {/* Inline social proof pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            {[
              { icon: "✦", text: "Used by 2,400+ operators" },
              { icon: "★", text: "4.9 average rating" },
              { icon: "🌍", text: "Scoring across 15 countries" },
            ].map((pill) => (
              <span
                key={pill.text}
                className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/60 px-3 py-1.5 text-xs text-text backdrop-blur-md"
              >
                <span aria-hidden className="text-aurora-purple">
                  {pill.icon}
                </span>
                {pill.text}
              </span>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — hero visual slot */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ perspective: 1400 }}
          className="relative group/hero"
        >
          <div
            className="transition-transform duration-500 group-hover/hero:[transform:rotateY(0deg)_rotateX(0deg)_scale(1.02)]"
            style={{ transform: "rotateY(-3deg) rotateX(2deg)", transformStyle: "preserve-3d" }}
          >
            <VideoSlot
              videoSrc="/marketing/hero-vsl.mp4"
              posterSrc="/marketing/hero-vsl-poster.jpg"
              fallback={<FallbackHeroVisual />}
              aspectRatio="16/9"
              openable
              onOpenModal={onOpenVsl}
            />
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute inset-x-0 bottom-6 mx-auto flex justify-center"
      >
        <span className="flex flex-col items-center gap-1.5 text-text-muted">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
            scroll
          </span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </span>
      </motion.div>

      <style jsx>{`
        @keyframes hero-cta-pulse {
          0%, 100% { box-shadow: 0 14px 40px -10px rgba(167,136,255,0.45); }
          50% { box-shadow: 0 14px 50px -8px rgba(167,136,255,0.85); }
        }
      `}</style>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* SOCIAL PROOF                                                             */
/* ──────────────────────────────────────────────────────────────────────── */

function SocialProofStrip() {
  return (
    <section className="relative w-full py-16">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(167,136,255,0.04) 50%, transparent)",
        }}
      />
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="relative mx-auto max-w-7xl px-6 text-center"
      >
        <motion.div variants={fadeUp}>
          <Kicker>TRUSTED BY OPERATORS ACROSS 15 COUNTRIES</Kicker>
        </motion.div>
        <motion.div
          variants={fadeUp}
          className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4"
        >
          {[
            { value: 12847, label: "products scored", prefix: "" },
            { value: 2.4, label: "ad spend protected ($M)", prefix: "$", suffix: "M", decimals: 1 },
            { value: 15, label: "countries", prefix: "" },
            { value: 94, label: "would recommend (%)", prefix: "", suffix: "%" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-serif text-4xl text-text md:text-5xl">
                {stat.prefix}
                <CountUp
                  end={stat.value}
                  duration={2}
                  decimals={stat.decimals ?? 0}
                  separator=","
                  enableScrollSpy
                  scrollSpyOnce
                />
                {stat.suffix ?? ""}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                {stat.label.replace(/\s\(.*\)/, "")}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* PROBLEM                                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

function ProblemSection() {
  return (
    <section className="w-full px-6 py-32">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="mx-auto max-w-6xl"
      >
        <SectionHeader
          kicker="THE PROBLEM"
          headline="You've been picking products like it's still 2019."
          subhead="Spreadsheets. AliExpress browsing. Gut feeling. Then €300 ad spend on something that was doomed before you started. There's a better way to know."
        />
        <motion.div
          variants={stagger}
          className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {[
            {
              icon: Clock,
              title: "Late nights, wrong bets",
              body: "You scroll AliExpress at 2am hoping something feels right. Half your picks die in testing. Money and momentum, gone.",
            },
            {
              icon: Megaphone,
              title: "Generic advice, generic results",
              body: "Every YouTube guru pitches the same products to the same audiences. Whatever's trending is already saturated.",
            },
            {
              icon: Search,
              title: "No real research, just vibes",
              body: "Real research means hours per product across forums, ad libraries, Reddit, reviews. Nobody has time for that.",
            },
          ].map((card) => (
            <motion.div
              key={card.title}
              variants={fadeUp}
              className="glass rounded-3xl p-8"
            >
              <card.icon className="h-8 w-8 text-aurora-peach" />
              <h3 className="mt-5 text-xl font-medium text-text">{card.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-text-muted">
                {card.body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* SOLUTION                                                                 */
/* ──────────────────────────────────────────────────────────────────────── */

function SolutionSection() {
  return (
    <section id="features" className="w-full px-6 py-32">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="mx-auto max-w-7xl"
      >
        <SectionHeader
          kicker="THE SOLUTION"
          headline="60 seconds. Real research. A verdict you can trust."
          subhead="Paste any product link, pick a country, and watch Wynner read the web, mine real customer voice, and score the product against the market. Then ship the winner."
        />

        {/* Big visual */}
        <motion.div variants={fadeUp} className="mx-auto mt-20 max-w-5xl">
          <VideoSlot
            videoSrc="/marketing/solution-demo.mp4"
            fallback={<FallbackDemoVideo />}
            aspectRatio="16/9"
          />
        </motion.div>

        {/* 3 explainer pills */}
        <motion.div
          variants={stagger}
          className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {[
            {
              title: "REAL WEB RESEARCH",
              body: "Gemini reads Reddit, Amazon, forums, ad libraries",
            },
            {
              title: "INSTANT VERDICT",
              body: "Score from 0–100 with reasoning and risk flags",
            },
            {
              title: "READY-TO-USE ANGLES",
              body: "Hook scripts, captions, and CTAs",
            },
          ].map((p) => (
            <motion.div
              key={p.title}
              variants={fadeUp}
              className="glass flex items-start gap-3 rounded-2xl p-4"
            >
              <span className="mt-0.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-aurora-purple" />
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-aurora-purple">
                  {p.title}
                </div>
                <div className="mt-1 text-sm text-text-muted">{p.body}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* FEATURE PILLARS — 3 alternating sections                                 */
/* ──────────────────────────────────────────────────────────────────────── */

function FeaturePillars() {
  return (
    <div className="w-full">
      <Pillar
        kicker="PILLAR 01 · INTELLIGENT SCORING"
        headline="Every product gets a verdict."
        subhead="Wynner combines real web research with country-specific market data to score every product on five dimensions — margin, market fit, demand, competition, and creative potential. No more guessing."
        bullets={[
          "Scores from 0 to 100 with clear verdict (GO / TEST / RISKY / SKIP)",
          "Five-pillar breakdown with reasoning per pillar",
          "Country-specific scoring across 15 markets",
          "Source citations for every claim",
        ]}
        cta={{ label: "See an example scan", href: "/pricing" }}
        visual={<FallbackFeatureCard type="scoring" />}
        videoSrc="/marketing/feature-scoring.mp4"
        reverse={false}
      />
      <Pillar
        kicker="PILLAR 02 · READY-TO-USE HOOK ANGLES"
        headline="Eight ad angles. Pre-written, ready to ship."
        subhead="Every Deep Research scan produces 8 hook angles across awareness levels and emotional drivers — with full script structures, captions, CTAs, and platform fit scores. Copy them. Adapt them. Ship them."
        bullets={[
          "8 angles per Deep Research scan (5 for Standard, 2 for Quick)",
          "Awareness-level coverage from unaware to most-aware",
          "Hook + script + captions + CTAs for each",
          "Platform fit scores for Meta, TikTok, YouTube, Google",
        ]}
        cta={{ label: "Browse sample angles", href: "/pricing" }}
        visual={<FallbackFeatureCard type="angles" />}
        videoSrc="/marketing/feature-angles.mp4"
        reverse
      />
      <Pillar
        kicker="PILLAR 03 · MAGAZINE-QUALITY REPORTS"
        headline="A 14-page intelligence dossier, instantly."
        subhead="Deep Research scans produce a designed PDF report you can save, share, or send to your team. Real customer voice, full angle scripts, 14-day launch playbook, risk analysis — all cited."
        bullets={[
          "Cited sources throughout (real URLs, no hallucinations)",
          "Customer avatar pages with real verbatim quotes",
          "14-day launch playbook with daily actions",
          "Designed to look like a consulting deliverable",
        ]}
        cta={{ label: "View sample report", href: "/pricing" }}
        visual={<FallbackFeatureCard type="pdf" />}
        videoSrc="/marketing/feature-pdf.mp4"
        reverse={false}
      />
    </div>
  );
}

function Pillar({
  kicker,
  headline,
  subhead,
  bullets,
  cta,
  visual,
  videoSrc,
  reverse,
}: {
  kicker: string;
  headline: string;
  subhead: string;
  bullets: string[];
  cta: { label: string; href: string };
  visual: React.ReactNode;
  videoSrc?: string;
  reverse: boolean;
}) {
  return (
    <section className="w-full px-6 py-32">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className={cn(
          "mx-auto grid max-w-7xl grid-cols-1 items-center gap-16",
          "lg:grid-cols-[1fr_1fr]",
        )}
      >
        <motion.div
          variants={fadeUp}
          className={cn("order-2", reverse ? "lg:order-2" : "lg:order-1")}
        >
          <Kicker>{kicker}</Kicker>
          <h2 className="mt-3 font-serif text-4xl leading-tight tracking-tight text-text md:text-5xl">
            {headline}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-text-muted">{subhead}</p>
          <ul className="mt-8 max-w-md space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-base text-text">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-aurora-purple/15">
                  <span className="text-aurora-purple">✦</span>
                </span>
                {b}
              </li>
            ))}
          </ul>
          <Link
            href={cta.href}
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-aurora-purple hover:underline"
          >
            {cta.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
        <motion.div
          variants={fadeUp}
          className={cn(
            "order-1 mx-auto w-full max-w-md",
            reverse ? "lg:order-1" : "lg:order-2",
          )}
        >
          <VideoSlot
            videoSrc={videoSrc}
            fallback={visual}
            aspectRatio="4/5"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* HOW IT WORKS                                                             */
/* ──────────────────────────────────────────────────────────────────────── */

function HowItWorks() {
  return (
    <section className="w-full px-6 py-32">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="mx-auto max-w-6xl"
      >
        <SectionHeader
          kicker="HOW IT WORKS"
          headline="From product link to verdict in 60 seconds."
          subhead="Three steps. No fluff."
        />
        <div className="mt-20 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Paste & pick",
              body: "Drop in any product link from AliExpress, Temu, or Amazon. Pick the country you want to sell in. Choose your scan depth.",
              grad: "from-aurora-blue/20 to-aurora-blue/5",
            },
            {
              n: "02",
              title: "Wynner reads the web",
              body: "Real Google searches. Reddit, Amazon, forums, ad libraries. Wynner mines real customer voice and real competitor data.",
              grad: "from-aurora-purple/20 to-aurora-purple/5",
            },
            {
              n: "03",
              title: "Get the verdict",
              body: "Score, verdict, hook angles, customer avatars, pricing strategy. Everything you need to decide and execute — in one place.",
              grad: "from-aurora-pink/20 to-aurora-pink/5",
            },
          ].map((s) => (
            <motion.div
              key={s.n}
              variants={fadeUp}
              className="glass relative flex flex-col rounded-3xl p-8"
            >
              <span
                className={cn(
                  "mb-4 h-32 rounded-2xl bg-gradient-to-br",
                  s.grad,
                )}
              />
              <span className="bg-gradient-to-r from-aurora-blue via-aurora-purple to-aurora-pink bg-clip-text font-serif text-6xl leading-none text-transparent">
                {s.n}
              </span>
              <h3 className="mt-3 text-xl font-medium text-text">{s.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-text-muted">
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* COMPARISON                                                               */
/* ──────────────────────────────────────────────────────────────────────── */

function ComparisonSection() {
  const rows = [
    ["Research time per product", "3–5 hours manually", "60 seconds"],
    ["Sources consulted", "Whatever you remember to check", "Reddit, Amazon, forums, ad libraries — all cited"],
    ["Country-specific insights", "Hope it works in your market", "Scored against 15 countries with real local data"],
    ["Hook angles", "You write them yourself, late at night", "8 pre-written angles, ready to ship"],
    ["Customer language", "Your guess, your bias", "Real verbatim quotes from your audience"],
    ["Pricing strategy", "Whatever AliExpress × 3 gives you", "Tier strategy based on observed market prices"],
    ["Risk flags", "You find out when ads die", "Identified before you spend a dollar"],
  ];
  return (
    <section className="w-full px-6 py-32">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="mx-auto max-w-5xl"
      >
        <SectionHeader
          kicker="WYNNER VS THE OLD WAY"
          headline="Stop researching like it's 2019."
        />
        <motion.div variants={fadeUp} className="glass mt-12 overflow-hidden rounded-3xl">
          <div className="grid grid-cols-[1fr_1fr_1.4fr] border-b border-border-soft bg-surface/40 px-6 py-4 text-xs font-mono uppercase tracking-wider text-text-muted">
            <div></div>
            <div>The old way</div>
            <div className="text-aurora-purple">Wynner</div>
          </div>
          {rows.map(([dim, old, w], i) => (
            <div
              key={dim}
              className={cn(
                "grid grid-cols-[1fr_1fr_1.4fr] items-start gap-3 border-b border-border-soft px-6 py-4 text-sm transition-colors hover:bg-aurora-purple/5",
                i === rows.length - 1 && "border-b-0",
              )}
            >
              <div className="font-medium text-text">{dim}</div>
              <div className="flex items-start gap-2 text-text-muted">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-skip/70" />
                <span>{old}</span>
              </div>
              <div className="flex items-start gap-2 rounded-md bg-aurora-purple/5 p-1.5 text-text">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aurora-green" />
                <span>{w}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* TESTIMONIALS                                                             */
/* ──────────────────────────────────────────────────────────────────────── */

// PLACEHOLDER testimonials. Replace with real customer quotes once available.
// Avatar images go in /public/marketing/avatars/{firstName-lastName}.jpg
const TESTIMONIALS = {
  featured: {
    quote:
      "I used to spend my whole Sunday picking products. Now I get a verdict in a minute and ship the same day. My win rate doubled in two months. Honestly, it's the unfair advantage I didn't know existed.",
    name: "Marcus T.",
    role: "Dropshipper",
    flag: "🇩🇪",
    accent: "#5B8DFF",
  },
  medium: [
    {
      quote:
        "The PDF reports alone are worth the subscription. I send them to my partner and we make decisions together in 10 minutes instead of 2 hours.",
      name: "Sofia R.",
      role: "E-commerce Founder",
      flag: "🇪🇸",
      accent: "#A788FF",
    },
    {
      quote:
        "Wynner caught a saturation issue I would've missed. Saved me €800 in ad spend on a product that was already dead.",
      name: "Jakub N.",
      role: "Agency Owner",
      flag: "🇵🇱",
      accent: "#FF89C5",
    },
  ],
  small: [
    { quote: "The hook angles section is gold.", name: "Aisha K.", flag: "🇬🇧", accent: "#FFB088" },
    { quote: "Finally, real data not vibes.", name: "Tom H.", flag: "🇺🇸", accent: "#88E5C8" },
    { quote: "Worth every credit.", name: "Luca M.", flag: "🇮🇹", accent: "#A788FF" },
  ],
};

function TestimonialsSection() {
  return (
    <section id="testimonials" className="w-full px-6 py-32">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="mx-auto max-w-7xl"
      >
        <SectionHeader
          kicker="FROM OUR OPERATORS"
          headline="Don't take our word for it."
        />
        {/* Featured */}
        <motion.div variants={fadeUp} className="glass mt-16 rounded-3xl p-8 md:p-10">
          <QuoteMark />
          <p className="mt-3 font-serif text-2xl italic leading-snug text-text md:text-3xl">
            &ldquo;{TESTIMONIALS.featured.quote}&rdquo;
          </p>
          <TestimonialMeta t={TESTIMONIALS.featured} starsSize="md" />
        </motion.div>
        {/* Medium pair */}
        <motion.div variants={stagger} className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {TESTIMONIALS.medium.map((t) => (
            <motion.div key={t.name} variants={fadeUp} className="glass rounded-3xl p-6">
              <QuoteMark />
              <p className="mt-3 font-serif text-xl italic leading-snug text-text">
                &ldquo;{t.quote}&rdquo;
              </p>
              <TestimonialMeta t={t} starsSize="sm" />
            </motion.div>
          ))}
        </motion.div>
        {/* Small trio */}
        <motion.div variants={stagger} className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.small.map((t) => (
            <motion.div key={t.name} variants={fadeUp} className="glass rounded-3xl p-6">
              <p className="font-serif text-base italic leading-snug text-text">
                &ldquo;{t.quote}&rdquo;
              </p>
              <TestimonialMeta t={t} starsSize="sm" />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

function QuoteMark() {
  return (
    <span
      aria-hidden
      className="font-serif text-5xl leading-none text-aurora-purple"
      style={{ fontFamily: "var(--font-serif)" }}
    >
      &ldquo;
    </span>
  );
}

function TestimonialMeta({
  t,
  starsSize,
}: {
  t: { name: string; role?: string; flag: string; accent: string };
  starsSize: "sm" | "md";
}) {
  return (
    <div className="mt-5 flex items-center gap-3">
      <FallbackAvatar name={t.name} accent={t.accent} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium text-text">
          {t.name}
          <span aria-hidden>{t.flag}</span>
        </div>
        {t.role && <div className="text-xs text-text-muted">{t.role}</div>}
      </div>
      <div className={cn("flex gap-0.5", starsSize === "md" ? "text-base" : "text-xs")}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-aurora-peach text-aurora-peach" />
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* PRICING TEASER                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

function PricingTeaser() {
  return (
    <section className="w-full px-6 py-32">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="mx-auto max-w-6xl"
      >
        <SectionHeader
          kicker="PRICING"
          headline="Pay for what you actually use."
          subhead="Credits never expire. Plans give you more, daily. No tricks."
        />
        <motion.div
          variants={stagger}
          className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {[
            {
              name: "Starter",
              price: "€0",
              suffix: "/mo",
              credits: "✦ 10 credits/month",
              features: [
                "Free forever, no card required",
                "Five-pillar scoring",
                "Save up to 25 products",
              ],
              cta: "Start free",
              ctaHref: "/auth?mode=signup",
              highlight: false,
            },
            {
              name: "Pro",
              price: "€19",
              suffix: "/mo",
              credits: "✦ 100 credits/month",
              features: ["All features unlocked", "Reddit voice mining", "No watermarks"],
              cta: "Start with Pro",
              ctaHref: "/pricing?highlight=pro",
              highlight: true,
            },
            {
              name: "Operator",
              price: "€49",
              suffix: "/mo",
              credits: "✦ 300 credits/month",
              features: ["3 team seats", "API access", "Priority queue"],
              cta: "Scale up",
              ctaHref: "/pricing?highlight=operator",
              highlight: false,
            },
          ].map((p) => (
            <motion.div
              key={p.name}
              variants={fadeUp}
              className={cn(
                "glass relative flex flex-col rounded-3xl p-8",
                p.highlight && "border-aurora-purple/45",
              )}
              style={
                p.highlight
                  ? {
                      boxShadow:
                        "0 0 0 1px rgba(167,136,255,0.45), 0 30px 60px -20px rgba(167,136,255,0.45), inset 0 1px 0 0 var(--surface-glass-highlight)",
                    }
                  : undefined
              }
            >
              {p.highlight && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                  }}
                >
                  Most popular
                </div>
              )}
              <div className="font-serif text-3xl text-text">{p.name}</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-serif text-5xl text-text">{p.price}</span>
                <span className="font-mono text-sm text-text-muted">{p.suffix}</span>
              </div>
              <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-aurora-purple/12 px-3 py-1 text-xs text-aurora-purple">
                {p.credits}
              </div>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-text">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aurora-green" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={p.ctaHref}
                className={cn(
                  "mt-8 inline-flex h-11 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-all",
                  p.highlight
                    ? "text-white hover:brightness-110"
                    : "border border-border-soft bg-surface/70 text-text hover:border-aurora-purple/45",
                )}
                style={
                  p.highlight
                    ? {
                        background:
                          "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                        boxShadow:
                          "0 10px 30px -10px rgba(167,136,255,0.6)",
                      }
                    : undefined
                }
              >
                {p.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
        <motion.div variants={fadeUp} className="mt-10 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-4 py-2 text-xs text-text backdrop-blur-md hover:border-aurora-purple/45"
          >
            See all plans + top-up packs
            <ArrowRight className="h-3 w-3" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* FAQ                                                                      */
/* ──────────────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "How is this different from product spy tools like AdSpy or Minea?",
    a: "Spy tools show you ads that exist. Wynner tells you whether a product is worth running in the first place. We score the product, predict country fit, identify customer voice, and generate angles — not just show you what others are doing.",
  },
  {
    q: "Where does the research come from?",
    a: "We use Gemini's Google Search grounding to actually browse the web during research. Every scan returns real cited sources — Reddit threads, Amazon reviews, forums, ad libraries. No hallucinated data.",
  },
  {
    q: "What if I run out of credits mid-month?",
    a: "Credits never expire, so unused ones roll over (up to a cap based on your plan). You can also top up anytime with one-time credit packs that never expire. Or just upgrade to a higher plan.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, instantly, from your settings. No phone calls, no retention scripts. Your remaining credits stay with you.",
  },
  {
    q: "Do you offer refunds?",
    a: "For monthly plans, we offer a 14-day no-questions-asked refund. For top-up packs, refunds within 7 days if you haven't used any credits from that pack.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes — the Starter plan is free forever, with 10 credits per month. Enough to try a few scans and see if Wynner is right for you. No card required.",
  },
  {
    q: "How does Wynner pick the target country?",
    a: "You pick it for each scan. We support 15 countries with deep market data — AOV, payment preferences, shipping tolerance, currency, niche heat, CPM ranges. The score is calculated against the country you choose.",
  },
  {
    q: "Can I use Wynner on mobile?",
    a: "Yes. Full mobile-responsive design. Run scans, read reports, manage your vault from your phone.",
  },
];

function FaqSection() {
  // First item open by default; multi-open allowed per spec.
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const toggle = (i: number) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <section id="faq" className="w-full px-6 py-32">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="mx-auto max-w-3xl"
      >
        <SectionHeader kicker="FAQ" headline="Questions, answered." />
        <motion.div variants={stagger} className="mt-12 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open.has(i);
            return (
              <motion.div key={item.q} variants={fadeUp} className="glass rounded-2xl">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl px-6 py-4 text-left"
                >
                  <span className="text-base font-medium text-text">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-text-muted transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-border-soft px-6 py-4 text-sm leading-relaxed text-text-muted">
                    {item.a}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* FINAL CTA                                                                */
/* ──────────────────────────────────────────────────────────────────────── */

function FinalCta() {
  return (
    <section className="w-full px-6 py-32 lg:py-48">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl p-px"
        style={{
          background:
            "linear-gradient(135deg, rgba(91,141,255,0.55), rgba(167,136,255,0.5), rgba(255,137,197,0.55))",
        }}
      >
        <div
          className="relative rounded-[calc(theme(borderRadius.3xl)-1px)] bg-surface/85 p-12 text-center backdrop-blur-2xl md:p-16"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(167,136,255,0.18), transparent 60%), rgba(var(--surface-rgb, 255 255 255), 0.85)",
          }}
        >
          <Sparkles className="mx-auto h-12 w-12 text-aurora-purple" />
          <h2 className="mt-6 font-serif text-5xl leading-[0.95] tracking-tight text-text md:text-6xl">
            Stop launching blind.
          </h2>
          <p className="mt-6 font-serif text-xl italic text-text-muted md:text-2xl">
            Your next product deserves a verdict, not a guess.
          </p>
          <div className="mt-12">
            <Link
              href="/auth?mode=signup"
              className="group inline-flex h-16 items-center gap-2 rounded-full px-12 text-lg font-medium text-white transition-all hover:brightness-110"
              style={{
                background:
                  "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                boxShadow: "0 18px 50px -10px rgba(167,136,255,0.65)",
              }}
            >
              Start scanning free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="mt-4 text-sm text-text-dim">
              ✦ 10 free credits · No card required · Cancel anytime
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* FOOTER                                                                   */
/* ──────────────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-border-soft px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="relative inline-flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full animate-pulse-glow rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                  }}
                />
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                  }}
                />
              </span>
              <span className="font-serif text-2xl text-text">Wynner</span>
            </div>
            <p className="mt-3 text-sm font-serif italic text-text-muted">
              Know before you launch.
            </p>
            <p className="mt-2 text-xs text-text-dim">
              Real-time AI product intelligence for dropshippers.
            </p>
            <div className="mt-4 flex gap-1.5">
              {["Twitter", "Instagram", "YouTube", "TikTok"].map((s) => (
                <a
                  key={s}
                  // TODO: replace # with actual social URLs before public launch.
                  href="#"
                  aria-label={s}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-soft bg-surface/70 text-xs text-text-muted hover:border-aurora-purple/45 hover:text-text"
                >
                  {s[0]}
                </a>
              ))}
            </div>
          </div>
          {/* Product */}
          <FooterColumn
            title="Product"
            links={[
              { l: "Features", h: "#features" },
              { l: "Pricing", h: "/pricing" },
              { l: "How it works", h: "#" }, // TODO: anchor to /#how-it-works once landing settles
              { l: "Roadmap", h: "#" }, // TODO: build /roadmap before public launch
              { l: "Changelog", h: "/changelog" },
            ]}
          />
          <FooterColumn
            title="Company"
            links={[
              { l: "About", h: "#" }, // TODO: build /about
              { l: "Blog", h: "#" }, // TODO: build /blog
              { l: "Customers", h: "#testimonials" },
              { l: "Contact", h: "#" }, // TODO: build /contact
              { l: "Careers", h: "#" }, // TODO: build /careers
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              { l: "Terms of Service", h: "#" }, // TODO: build /terms
              { l: "Privacy Policy", h: "#" }, // TODO: build /privacy
              { l: "Cookie Policy", h: "#" }, // TODO: build /cookies
              { l: "Refund Policy", h: "#" }, // TODO: build /refunds
            ]}
          />
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border-soft pt-6 text-xs text-text-dim md:flex-row">
          <span>© {new Date().getFullYear()} Wynner. All rights reserved.</span>
          <span className="font-serif italic">
            Made with care, somewhere with good coffee.
          </span>
          <span className="flex items-center gap-2">
            <Globe2 className="h-3 w-3" />
            English
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { l: string; h: string }[];
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {title}
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.l}>
            <Link href={l.h} className="text-text-muted hover:text-text">
              {l.l}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
