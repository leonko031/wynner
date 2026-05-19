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
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-10">
        <Stepper current={step} />
      </div>

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
            <div className="space-y-4">
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
            className="space-y-5"
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
              <div className="glass mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <SparkIcon size={16} />
                  <div className="text-sm">
                    <span className="font-medium text-text">
                      {meta.label} → ✦ {meta.creditCost} credits
                    </span>
                    <span className="ml-2 text-text-muted">
                      Balance after: {balanceAfter}
                    </span>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={() => setStep(3)}
                  className="rounded-full"
                  disabled={balance < meta.creditCost}
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
    <div className="flex items-center justify-between rounded-2xl border border-border-soft bg-surface/60 px-4 py-2.5 text-xs">
      <div className="flex items-center gap-2">
        <SparkIcon size={12} />
        <span className="text-text-muted">Depth:</span>
        <span className="font-medium text-text">{meta.label}</span>
        <span className="font-mono tabular-nums text-text-dim">
          · ✦ {meta.creditCost}
        </span>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="text-text-muted underline-offset-2 hover:text-text hover:underline"
      >
        Change
      </button>
    </div>
  );
}

