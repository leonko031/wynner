"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Calculator,
  Map,
  MessageSquareQuote,
  Plug,
  Settings,
  Sparkles,
} from "lucide-react";

type DocLink = {
  href: string;
  icon: React.ElementType;
  title: string;
  blurb: string;
  external?: boolean;
};

const GETTING_STARTED: DocLink[] = [
  {
    href: "/scan",
    icon: Sparkles,
    title: "Score your first product",
    blurb: "Paste a name + cost + price, pick a target country, hit Generate.",
  },
  {
    href: "/dashboard",
    icon: Map,
    title: "Explore the dashboard",
    blurb: "Top pick, ticker, market pulse, live activity — all from the seed data.",
  },
  {
    href: "/settings",
    icon: Settings,
    title: "Turn on the power-ups",
    blurb:
      "Add Gemini, Reddit, ScrapingBee keys to unlock AI scoring, voice mining, live scrapers.",
  },
];

const PILLARS = [
  {
    key: "Margin",
    weight: "25%",
    color: "#00D26A",
    body: "Markup × gross margin × net of estimated CPA. Penalized when price drifts way above or below the country AOV.",
  },
  {
    key: "Market fit",
    weight: "20%",
    color: "#3B82F6",
    body: "Niche-in-trending vs niche-in-dead, shipping tolerance vs source, card-trust vs price, return-rate risk.",
  },
  {
    key: "Demand",
    weight: "20%",
    color: "#F5A623",
    body: "Gemini Flash signal, optionally blended with Google Trends velocity and TikTok hashtag momentum.",
  },
  {
    key: "Competition",
    weight: "20%",
    color: "#F97316",
    body: "Gemini Flash estimate, or real Meta Ad Library active-ad count when the scraper toggle is on.",
  },
  {
    key: "Creative",
    weight: "15%",
    color: "#EC4899",
    body: "Gemini Vision evaluating the product image for hook potential — wow factor, demo-ability, hook diversity.",
  },
];

const FAQ = [
  {
    q: "Do I have to pay for anything to use it?",
    a: "No. Without any API keys, every pillar falls back to deterministic heuristics. You'll still get a working score, a working scan flow, a working dashboard — just with heuristic reasoning instead of AI.",
  },
  {
    q: "How is the final sell score calculated?",
    a: "Weighted average of the five pillars: margin 25%, marketFit 20%, demand 20%, competition 20%, creative 15%. The verdict (Go / Test / Risky / Skip) maps from that score: ≥80 Go, 60–79 Test, 40–59 Risky, <40 Skip.",
  },
  {
    q: "Why Reddit voice mining instead of just AI personas?",
    a: "AI personas are generic. Reddit threads contain the exact slang, complaints, and objections real buyers type when nobody's selling to them. That's the only language that makes ad copy feel native.",
  },
  {
    q: "Is my data stored anywhere?",
    a: "Everything is local — Zustand persists to your browser's localStorage. The API routes are stateless. Export / import / clear-all controls live at /settings.",
  },
  {
    q: "What's the keyboard shortcut for everything?",
    a: "Press ? anywhere outside an input. ⌘K opens the command palette.",
  },
];

const DEEPER: DocLink[] = [
  {
    href: "/changelog",
    icon: Brain,
    title: "Changelog",
    blurb: "What we built, in chronological order.",
  },
  {
    href: "/REDDIT_SETUP.md",
    icon: MessageSquareQuote,
    title: "Reddit setup",
    blurb: "5-minute walkthrough to enable voice mining.",
  },
  {
    href: "/SCRAPER_SETUP.md",
    icon: Plug,
    title: "Scraper setup",
    blurb: "Turn on the live-data power-ups.",
  },
];

export default function DocsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/60 px-3 py-1 text-xs text-text-muted">
          <Brain className="h-3 w-3" />
          Docs
        </div>
        <h1 className="mt-5 text-4xl font-medium tracking-tight md:text-5xl">
          How Wynner works
        </h1>
        <p className="mt-3 max-w-xl text-sm text-text-muted">
          A short tour through the moving parts.
        </p>
      </header>

      <Section title="Getting started" subtitle="Three jumping-off points">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {GETTING_STARTED.map((l, i) => (
            <motion.div
              key={l.href}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Link
                href={l.href}
                className="group flex h-full flex-col rounded-2xl border border-border-soft bg-surface p-5 transition-colors hover:border-border-strong"
              >
                <l.icon className="h-5 w-5 text-text-muted group-hover:text-text" />
                <div className="mt-3 font-medium text-text">{l.title}</div>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-text-muted">
                  {l.blurb}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] text-text-dim group-hover:text-text">
                  Go <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section title="How the score works" subtitle="Five weighted pillars">
        <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface/40">
          {PILLARS.map((p, i) => (
            <div
              key={p.key}
              className="grid grid-cols-[120px_60px_1fr] items-start gap-4 border-b border-border-soft p-5 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <Calculator
                  className="h-4 w-4"
                  style={{ color: p.color }}
                />
                <span className="font-medium text-text">{p.key}</span>
              </div>
              <span
                className="inline-flex h-6 items-center justify-center rounded-full px-2 font-mono text-[11px] tabular-nums"
                style={{
                  backgroundColor: `${p.color}1A`,
                  color: p.color,
                  border: `1px solid ${p.color}33`,
                }}
              >
                {p.weight}
              </span>
              <motion.p
                className="text-sm leading-relaxed text-text-muted"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: i * 0.04 }}
              >
                {p.body}
              </motion.p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="FAQ" subtitle="Things people ask">
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <motion.details
              key={f.q}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="group rounded-2xl border border-border-soft bg-surface p-5 [&[open]>summary>span.chev]:rotate-180"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-text">
                {f.q}
                <span
                  aria-hidden
                  className="chev font-mono text-text-dim transition-transform"
                >
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                {f.a}
              </p>
            </motion.details>
          ))}
        </div>
      </Section>

      <Section title="Going deeper">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {DEEPER.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group flex h-full flex-col rounded-2xl border border-border-soft bg-surface p-5 transition-colors hover:border-border-strong"
            >
              <l.icon className="h-5 w-5 text-text-muted group-hover:text-text" />
              <div className="mt-3 font-medium text-text">{l.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">
                {l.blurb}
              </p>
            </Link>
          ))}
        </div>
      </Section>
    </main>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <header className="mb-4">
        <h2 className="text-xl font-medium tracking-tight">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  );
}
