"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Flame,
  Gift,
  HandHeart,
  Sparkles,
  Users,
  HelpCircle,
} from "lucide-react";
import { TOPUP_PACKS, CREDIT_COSTS } from "@/lib/credits/config";
import type { BillingInterval, PlanTier } from "@/types/credits";
import { PlanCard } from "@/components/credits/plan-card";
import { TopUpCard } from "@/components/credits/topup-card";
import { FaqAccordion } from "@/components/credits/faq-accordion";
import { SparkIcon } from "@/components/credits/spark-icon";
import { AdminPricingBanner } from "@/components/auth/admin-pricing-banner";
import { cn } from "@/lib/utils";

const COST_ROWS: { label: string; credits: number | "free"; hint: string }[] = [
  { label: "Basic product scan", credits: CREDIT_COSTS.basic_scan, hint: "Score any product against the 5-pillar engine." },
  { label: "+ URL auto-scrape", credits: CREDIT_COSTS.url_scrape, hint: "Pull title, image, price from AliExpress / Temu / Amazon." },
  { label: "+ Reddit voice mining", credits: CREDIT_COSTS.reddit_voice, hint: "Verbatim buyer language pulled from real threads." },
  { label: "+ Meta Ad Library", credits: CREDIT_COSTS.meta_ads, hint: "Count active competitor ads in your country." },
  { label: "+ TikTok trends", credits: CREDIT_COSTS.tiktok_trends, hint: "Hashtag views + velocity blended into demand." },
  { label: "Country comparison (5 countries)", credits: CREDIT_COSTS.country_compare, hint: "Re-score the same product across 5 markets." },
  { label: "Full Power Scan (everything)", credits: CREDIT_COSTS.full_power_scan, hint: "Bundle all power-ups — saves vs à la carte." },
  { label: "Re-score existing product", credits: CREDIT_COSTS.re_score, hint: "Re-run scoring on a saved product." },
  { label: "Exports & sharing", credits: "free", hint: "PNG + CSV + share links are always free." },
];

const PERKS = [
  {
    title: "Streak bonus",
    body: "Scan 7 days in a row → +5 credits, automatic.",
    icon: Flame,
    accent: "#FF7E5F",
  },
  {
    title: "Daily free scan",
    body: "Pro & Operator get 1 free scan, every day.",
    icon: Sparkles,
    accent: "#5B8DFF",
  },
  {
    title: "Refer a friend",
    body: "You both get 20 credits when they upgrade.",
    icon: Users,
    accent: "#A788FF",
  },
  {
    title: "Gift credits",
    body: "Send 5 credits to anyone, anytime. No catch.",
    icon: Gift,
    accent: "#FF89C5",
  },
];

const FAQS = [
  {
    q: "Do credits expire?",
    a: "No. Top-up credits never expire. Monthly plan credits roll over up to your plan's rollover cap (200 for Pro, 600 for Operator).",
  },
  {
    q: "What happens to unused credits at month's end?",
    a: "They roll over, up to your plan's cap. Anything above the cap is forfeited at refill — but since the caps are generous, this only happens if you barely use the product.",
  },
  {
    q: "Can I downgrade or cancel anytime?",
    a: "Yes — no contracts, no minimum terms. Downgrades take effect at the end of your current billing cycle so you keep the credits you paid for.",
  },
  {
    q: "What if I run out mid-scan?",
    a: "We never charge you halfway. If you can't afford a scan, we tell you upfront and offer three ways forward: top up, upgrade, or wait for refill.",
  },
  {
    q: "Are top-up credits the same as plan credits?",
    a: "Yes — credits are credits. Top-up credits get used after your plan credits each cycle so your monthly allowance is the first to spend.",
  },
  {
    q: "Can I share credits with my team?",
    a: "Operator plan includes 3 team seats with shared credit pool. Pro is single-seat. Gifting credits person-to-person works on any plan.",
  },
];

export default function PricingPage() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <main className="relative min-h-screen">
      {/* Slim top bar that works for signed-out + signed-in users */}
      <nav className="sticky top-0 z-30 w-full">
        <div className="glass-flat mx-auto flex h-14 max-w-6xl items-center justify-between border-b border-border-soft px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span
                className="absolute inline-flex h-full w-full animate-pulse-glow rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(167,136,255,0.85)]"
                style={{
                  background:
                    "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                }}
              />
            </span>
            <span className="font-medium tracking-tight text-text">Wynner</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden text-sm text-text-muted hover:text-text sm:inline"
            >
              App
            </Link>
            <Link
              href="/credits"
              className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
            >
              My credits
            </Link>
          </div>
        </div>
      </nav>

      <AdminPricingBanner />

      {/* HERO */}
      <section className="relative px-6 pt-20 pb-12 md:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/60 px-3 py-1 text-xs text-text-muted"
          >
            <SparkIcon size={11} />
            Credits, not surprises
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-6 text-balance text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl"
          >
            Pay for what you{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              }}
            >
              actually use
            </span>
            .
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-text-muted md:text-lg"
          >
            Credits never expire. Plans give you more, daily. No tricks.
          </motion.p>

          {/* Interval toggle */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-8 inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface/70 p-1 backdrop-blur-xl"
          >
            <IntervalChip
              active={interval === "monthly"}
              onClick={() => setInterval("monthly")}
              label="Monthly"
            />
            <IntervalChip
              active={interval === "yearly"}
              onClick={() => setInterval("yearly")}
              label="Yearly"
              suffix={
                <span
                  className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-go"
                  style={{
                    background: "rgba(61, 214, 140, 0.15)",
                    border: "1px solid rgba(61, 214, 140, 0.4)",
                  }}
                >
                  Save 20%
                </span>
              }
            />
          </motion.div>

          {/* Trust line */}
          <p className="mt-4 text-xs text-text-dim">
            Used by 2,400+ dropshippers across 15 countries.
          </p>
        </div>
      </section>

      {/* PLANS */}
      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3 md:items-center">
          {/* Suspense wrapper so useSearchParams stays inside an explicit
              boundary (Next 16 requirement). */}
          <Suspense fallback={null}>
            <HighlightedPlanGrid interval={interval} />
          </Suspense>
        </div>
      </section>

      {/* TOP-UPS */}
      <section
        id="topups"
        className="scroll-mt-20 border-t border-border-soft px-6 py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
              Need more credits? Top up anytime.
            </h2>
            <p className="mt-2 text-base text-text-muted">
              Never expire. Stack with your plan. Buy when you need them.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOPUP_PACKS.map((pack) => (
              <TopUpCard key={pack.id} pack={pack} />
            ))}
          </div>
        </div>
      </section>

      {/* COST TABLE */}
      <section className="border-t border-border-soft px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
              What costs what.
            </h2>
            <p className="mt-2 text-base text-text-muted">
              Total transparency. No surprises.
            </p>
          </div>
          <div className="glass mt-8 overflow-hidden rounded-3xl">
            {COST_ROWS.map((row, i) => (
              <div
                key={row.label}
                className={cn(
                  "group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface/40",
                  i !== COST_ROWS.length - 1 && "border-b border-border-soft/60",
                )}
                title={row.hint}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text">{row.label}</span>
                  <HelpCircle className="h-3 w-3 text-text-dim opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="flex items-center gap-2">
                  {row.credits === "free" ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-go"
                      style={{
                        background: "rgba(61, 214, 140, 0.12)",
                        border: "1px solid rgba(61, 214, 140, 0.40)",
                      }}
                    >
                      Free ✨
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-sm tabular-nums text-text">
                      <SparkIcon size={11} />
                      {row.credits}
                    </span>
                  )}
                  {row.label === "Full Power Scan (everything)" && (
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                      style={{
                        background: "rgba(255, 137, 197, 0.15)",
                        color: "var(--color-aurora-pink)",
                        border: "1px solid rgba(255, 137, 197, 0.40)",
                      }}
                    >
                      Saves 2
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERKS */}
      <section className="border-t border-border-soft px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
              The little things that add up.
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERKS.map(({ title, body, icon: Icon, accent }) => (
              <motion.div
                key={title}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="glass rounded-2xl p-5"
                style={{
                  boxShadow: `inset 0 1px 0 0 var(--surface-glass-highlight), 0 0 36px -8px ${accent}40`,
                }}
              >
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
                <h3 className="mt-3 text-base font-medium text-text">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border-soft px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
              Questions?
            </h2>
            <p className="mt-2 text-base text-text-muted">
              The honest answers, in plain language.
            </p>
          </div>
          <div className="mt-10">
            <FaqAccordion items={FAQS} />
          </div>
        </div>
      </section>

      {/* FINAL CTA STRIP */}
      <section className="px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl p-10 md:p-14"
          style={{
            background:
              "linear-gradient(135deg, rgba(91,141,255,0.18), rgba(167,136,255,0.20), rgba(255,137,197,0.18))",
            border: "1px solid rgba(167,136,255,0.45)",
            boxShadow:
              "0 30px 80px -20px rgba(167,136,255,0.45), inset 0 1px 0 0 rgba(255,255,255,0.30)",
            backdropFilter: "blur(24px) saturate(180%)",
          }}
        >
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-medium tracking-tight text-text md:text-4xl">
                Ready to know before you launch?
              </h2>
              <p className="mt-2 max-w-xl text-base text-text-muted">
                Start free. Upgrade when the credits make sense.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-medium text-white shadow-[0_12px_36px_-8px_rgba(91,141,255,0.7)] transition-all hover:brightness-110"
                style={{
                  background:
                    "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                }}
              >
                <Sparkles className="h-4 w-4" />
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border-strong bg-surface/70 px-5 text-sm text-text-muted backdrop-blur transition-all hover:border-aurora-blue/45 hover:text-text"
              >
                <HandHeart className="h-4 w-4" />
                View pricing in your currency
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border-soft px-6 py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-text-dim">
          <span>© {new Date().getFullYear()} Wynner</span>
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

function IntervalChip({
  active,
  onClick,
  label,
  suffix,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  suffix?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center rounded-full px-4 text-xs transition-colors",
        active
          ? "bg-text/10 text-text"
          : "text-text-muted hover:text-text",
      )}
    >
      {label}
      {suffix}
    </button>
  );
}

/**
 * Renders the 3 plan cards and reads `?highlight={plan}` from the URL. When
 * present, that plan card gets emphasized + the page scrolls to it on mount.
 * Upsell modals across the app deep-link here with the target plan.
 */
function HighlightedPlanGrid({ interval }: { interval: BillingInterval }) {
  const searchParams = useSearchParams();
  const raw = (searchParams.get("highlight") ?? "").toLowerCase();
  const highlightOverride: PlanTier | null =
    raw === "starter" || raw === "pro" || raw === "operator" ? (raw as PlanTier) : null;

  useEffect(() => {
    if (!highlightOverride) return;
    // Defer the scroll so layout settles first.
    const t = window.setTimeout(() => {
      document
        .getElementById(`plan-${highlightOverride}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [highlightOverride]);

  // Default highlight is Pro; explicit ?highlight= wins.
  const highlighted: PlanTier = highlightOverride ?? "pro";

  return (
    <>
      {(["starter", "pro", "operator"] as PlanTier[]).map((p) => (
        <div key={p} id={`plan-${p}`} className="scroll-mt-24">
          <PlanCard plan={p} interval={interval} highlight={p === highlighted} />
        </div>
      ))}
    </>
  );
}
