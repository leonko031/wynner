"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FileText, GitCompareArrows, Sparkles, Telescope } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Kicker, SectionHeader } from "./editorial-primitives";
import type { EditorialRecommendation } from "@/types/briefing";

type Props = {
  recommendation: EditorialRecommendation | null;
  loading: boolean;
  sectionId: string;
};

const ACTION_HREF: Record<EditorialRecommendation["actionType"], string> = {
  scan: "/scan",
  deepResearch: "/scan?mode=deep",
  compare: "/compare",
};

const ACTION_CTA: Record<EditorialRecommendation["actionType"], string> = {
  scan: "Start a scan",
  deepResearch: "Run Deep Research",
  compare: "Open compare",
};

/**
 * The closing card. Decisive editorial recommendation generated alongside
 * the daily briefing. The visual on the right depends on the action type.
 */
export function NextMove({ recommendation, loading, sectionId }: Props) {
  return (
    <section className="pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-12">
        <SectionHeader
          id={sectionId}
          kicker="YOUR NEXT MOVE"
          headline={recommendation?.headline ?? "What's next"}
          subHeadline={undefined}
        />
        <NextMoveCard recommendation={recommendation} loading={loading} />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function NextMoveCard({
  recommendation,
  loading,
}: {
  recommendation: EditorialRecommendation | null;
  loading: boolean;
}) {
  const reduce = useReducedMotion();
  const [showWhy, setShowWhy] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="relative rounded-[28px] p-px"
      style={{
        background:
          "linear-gradient(135deg, rgba(91,141,255,0.55), rgba(167,136,255,0.45), rgba(255,137,197,0.55))",
      }}
    >
      {/* Slow shimmer band */}
      {!reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[28px]"
          style={{
            background:
              "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)",
            backgroundSize: "300% 100%",
          }}
          animate={{ backgroundPosition: ["-100% 0%", "200% 0%"] }}
          transition={{ duration: 10, ease: "easeInOut", repeat: Infinity }}
        />
      )}

      <div className="glass relative rounded-[27px] p-8 md:p-12 lg:p-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[60%_40%] lg:gap-12">
          {/* LEFT — pitch */}
          <div className="flex flex-col justify-between">
            <div>
              <Kicker>RECOMMENDED ACTION</Kicker>
              {loading || !recommendation ? (
                <LoadingPitch />
              ) : (
                <>
                  <h3 className="mt-4 font-serif text-3xl leading-[1.1] text-text md:text-4xl">
                    {recommendation.headline}
                  </h3>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-text-muted md:text-lg">
                    {recommendation.rationale}
                  </p>
                  {recommendation.actionContext && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface/60 px-3 py-1 font-mono text-[11px] text-text-muted">
                      {recommendation.actionContext}
                    </div>
                  )}
                </>
              )}
            </div>

            {recommendation && (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={ACTION_HREF[recommendation.actionType]}
                  className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-medium text-white shadow-[0_12px_28px_-10px_rgba(167,136,255,0.75)] transition-all hover:brightness-110"
                  style={{
                    background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                  }}
                >
                  {ACTION_CTA[recommendation.actionType]}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setShowWhy((s) => !s)}
                  className="text-sm text-text-muted underline-offset-4 hover:underline"
                >
                  {showWhy ? "Hide why" : "Show me why"}
                </button>
              </div>
            )}

            {showWhy && recommendation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-5 overflow-hidden rounded-2xl border border-border-soft bg-surface/40 p-4 text-xs text-text-muted"
              >
                Generated alongside today&apos;s briefing using your full operator
                profile — recent scans, niche/country preferences, and your
                action history. Refreshes daily.
              </motion.div>
            )}
          </div>

          {/* RIGHT — visual */}
          <div className="flex items-center justify-center">
            <ActionVisual actionType={recommendation?.actionType ?? "scan"} loading={loading} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */

function ActionVisual({
  actionType,
  loading,
}: {
  actionType: EditorialRecommendation["actionType"];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="h-56 w-full max-w-md rounded-2xl shimmer-bg bg-surface-elevated" />
    );
  }
  switch (actionType) {
    case "scan":
      return <ScanFlowVisual />;
    case "deepResearch":
      return <DeepResearchVisual />;
    case "compare":
      return <CompareTriangleVisual />;
  }
}

function ScanFlowVisual() {
  return (
    <div className="relative w-full max-w-md">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Quick", desc: "1 credit", active: false, icon: Sparkles },
          { label: "Standard", desc: "3 credits", active: true, icon: Sparkles },
          { label: "Deep", desc: "11 credits", active: false, icon: Telescope },
        ].map((tier) => {
          const Icon = tier.icon;
          return (
            <motion.div
              key={tier.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: tier.active ? 0.35 : 0.15 }}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center backdrop-blur-md ${
                tier.active
                  ? "border-aurora-purple/55 bg-aurora-purple/10 shadow-[0_10px_24px_-10px_rgba(167,136,255,0.6)]"
                  : "border-border-soft bg-surface/60"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${tier.active ? "text-aurora-purple" : "text-text-muted"}`}
              />
              <div className="font-serif text-base text-text">{tier.label}</div>
              <div className="font-mono text-[10px] text-text-dim">{tier.desc}</div>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
        Recommended: Standard
      </div>
    </div>
  );
}

function CompareTriangleVisual() {
  return (
    <div className="relative h-56 w-full max-w-md">
      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        <Silhouette delay={0.2} />
      </div>
      <div className="absolute bottom-0 left-4">
        <Silhouette delay={0.35} />
      </div>
      <div className="absolute bottom-0 right-4">
        <Silhouette delay={0.5} />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="absolute left-1/2 top-1/2 inline-flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-[0_10px_24px_-8px_rgba(167,136,255,0.7)]"
        style={{ background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)" }}
      >
        <GitCompareArrows className="h-4 w-4" />
      </motion.div>
    </div>
  );
}

function Silhouette({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="h-24 w-20 rounded-2xl border border-border-soft bg-surface/60 backdrop-blur-md"
    >
      <div className="h-14 w-full rounded-t-2xl bg-aurora-purple/15" />
      <div className="px-2 pt-2">
        <div className="h-1.5 w-12 rounded-full bg-border-soft" />
        <div className="mt-1 h-1.5 w-8 rounded-full bg-border-soft" />
      </div>
    </motion.div>
  );
}

function DeepResearchVisual() {
  return (
    <div className="relative flex h-56 w-full max-w-md items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative h-32 w-24 rounded-xl border border-aurora-pink/40 bg-aurora-pink/10 backdrop-blur-md"
      >
        <FileText className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-aurora-pink" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: -16 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="absolute -right-3 -top-3 rounded-full bg-aurora-pink px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white"
        >
          NEW
        </motion.div>
      </motion.div>
      <div className="ml-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
          Deep Research
        </div>
        <p className="mt-2 max-w-xs text-sm text-text-muted">
          Six ad angles, three personas, a 14-day playbook — all in one PDF.
        </p>
      </div>
    </div>
  );
}

function LoadingPitch() {
  return (
    <div className="mt-4 space-y-3">
      <div className="h-8 w-3/4 rounded-md shimmer-bg bg-surface-elevated" />
      <div className="h-4 w-full rounded-md shimmer-bg bg-surface-elevated" />
      <div className="h-4 w-5/6 rounded-md shimmer-bg bg-surface-elevated" />
    </div>
  );
}
