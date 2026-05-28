"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Stepper } from "@/components/scan/stepper";
import { Step1Details } from "@/components/scan/step-1-details";
import { Step2Country } from "@/components/scan/step-2-country";
import type { Draft } from "@/components/scan/live-preview-card";
import { LivePreviewCard } from "@/components/scan/live-preview-card";
import { DepthSelector } from "@/components/research/depth-selector";
import {
  LiveResearchExperience,
  type LiveResearchInput,
} from "@/components/research/live-research-experience";
import { useProductStore } from "@/lib/store/products";
import { useCreditsStore } from "@/lib/store/credits";
import { RESEARCH_MODE_META, type ResearchMode } from "@/types/research";
import { SparkIcon } from "@/components/credits/spark-icon";
import { Button } from "@/components/ui/button";
import type { Niche, Source } from "@/types";

const EMPTY_DRAFT: Draft = {
  name: "",
  description: "",
  image: "",
  category: "",
  costUSD: 0,
  suggestedPriceUSD: 0,
  shippingCostUSD: 0,
  source: "aliexpress",
  sourceUrl: "",
  targetCountry: undefined,
};

type Step = 0 | 1 | 2 | 3;

/**
 * The 4-step Deep Research scan.
 *   0: Depth selector (Quick / Standard / Deep)
 *   1: Product details (form + live preview)
 *   2: Target country (grid + "Why this country?" textarea)
 *   3: Live research takeover (SSE-driven AI orb + stage cards)
 */
export default function ScanPage() {
  const params = useSearchParams();
  const getById = useProductStore((s) => s.getById);
  const balance = useCreditsStore((s) => s.balance);

  const [step, setStep] = useState<Step>(0);
  const [mode, setMode] = useState<ResearchMode>("standard");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [context, setContext] = useState("");

  // "Scan similar" pre-fills from an existing product, then jumps to step 1.
  const similarId = params.get("similar");
  useEffect(() => {
    if (!similarId) return;
    const src = getById(similarId);
    if (!src) return;
    const t = window.setTimeout(() => {
      setDraft({
        name: `${src.name} (variant)`,
        description: src.description,
        image: src.image,
        category: src.category,
        costUSD: src.costUSD,
        suggestedPriceUSD: src.suggestedPriceUSD,
        shippingCostUSD: src.shippingCostUSD,
        source: src.source,
        sourceUrl: src.sourceUrl ?? "",
        targetCountry: src.targetCountry,
      });
      setStep(1);
    }, 0);
    return () => window.clearTimeout(t);
  }, [similarId, getById]);

  const meta = RESEARCH_MODE_META[mode];
  const balanceAfter = Math.max(0, balance - meta.creditCost);

  // Final input handed to the LiveResearchExperience once step 3 mounts.
  const researchInput: LiveResearchInput | null = useMemo(() => {
    if (step !== 3) return null;
    if (!draft.targetCountry) return null;
    return {
      mode,
      product: {
        name: draft.name,
        description: draft.description,
        image: draft.image,
        category: draft.category as Niche,
        costUSD: draft.costUSD,
        suggestedPriceUSD: draft.suggestedPriceUSD,
        shippingCostUSD: draft.shippingCostUSD,
        source: draft.source as Source,
        sourceUrl: draft.sourceUrl?.trim() ? draft.sourceUrl.trim() : undefined,
      },
      countryCode: draft.targetCountry,
      userContext: context,
    };
  }, [step, mode, draft, context]);

  // Step 3 is a full-page takeover — no stepper, no padding chrome.
  if (step === 3 && researchInput) {
    return <LiveResearchExperience input={researchInput} />;
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 md:py-12">
      <header className="mb-10 md:mb-12 space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
          New scan
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="font-serif text-4xl md:text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-text">
              Run a deep research scan
            </h1>
            <p className="text-sm md:text-base text-text-muted">
              Four steps, one verdict — depth, details, target, then live research.
            </p>
          </div>
        </div>
        <div className="pt-2">
          <Stepper current={step} />
        </div>
      </header>

      <AnimatePresence mode="popLayout" initial={false}>
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <DepthSelector
              onSelect={(m) => {
                setMode(m);
                setStep(1);
              }}
            />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 gap-8 md:grid-cols-[5fr_4fr]"
          >
            <div className="space-y-5">
              <ModeBadge mode={mode} onChange={() => setStep(0)} />
              <Step1Details
                draft={draft}
                setDraft={setDraft}
                onNext={() => setStep(2)}
              />
            </div>
            <LivePreviewCard draft={draft} />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <ModeBadge mode={mode} onChange={() => setStep(0)} />
            <Step2Country
              category={draft.category}
              selected={draft.targetCountry}
              onSelect={(code) => setDraft({ ...draft, targetCountry: code })}
              context={context}
              setContext={setContext}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />

            {/* Cost summary right above the continue gate */}
            {draft.targetCountry && (
              <div
                className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-soft bg-surface-elevated/90 p-5 backdrop-blur-2xl md:p-6"
                style={{
                  boxShadow: "0 24px 60px -24px rgba(0,0,0,0.45)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(91,141,255,0.10), rgba(167,136,255,0.14), rgba(255,137,197,0.10))",
                    }}
                  >
                    <SparkIcon size={16} />
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
                      Cost preview
                    </p>
                    <div className="text-sm">
                      <span className="font-medium text-text">
                        {meta.label} · ✦ {meta.creditCost} credits
                      </span>
                      <span className="ml-2 text-text-muted">
                        Balance after: {balanceAfter}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={() => setStep(3)}
                  className="rounded-full text-white"
                  disabled={balance < meta.creditCost}
                  style={
                    balance < meta.creditCost
                      ? undefined
                      : {
                          background:
                            "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                          boxShadow:
                            "0 8px 22px -6px rgba(91,141,255,0.55)",
                        }
                  }
                >
                  {balance < meta.creditCost
                    ? `Need ${meta.creditCost - balance} more credits`
                    : `Start ${meta.label.toLowerCase()}`}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ModeBadge({
  mode,
  onChange,
}: {
  mode: ResearchMode;
  onChange: () => void;
}) {
  const meta = RESEARCH_MODE_META[mode];
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border-soft bg-surface/60 px-4 py-3 text-xs">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-inset ring-white/10"
          style={{
            background:
              "linear-gradient(135deg, rgba(91,141,255,0.10), rgba(167,136,255,0.14), rgba(255,137,197,0.10))",
          }}
        >
          <SparkIcon size={12} />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
          Depth
        </span>
        <span className="font-medium text-text">{meta.label}</span>
        <span className="font-mono tabular-nums text-text-dim">
          · ✦ {meta.creditCost}
        </span>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
      >
        Change
      </button>
    </div>
  );
}

