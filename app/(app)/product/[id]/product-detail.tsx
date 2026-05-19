"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BreadcrumbRow } from "@/components/product/breadcrumb-row";
import { ProductHero } from "@/components/product/product-hero";
import { VerdictBand } from "@/components/product/verdict-band";
import { PillarGrid } from "@/components/product/pillar-grid";
import { CountryRadar } from "@/components/product/country-radar";
import { ProjectionCard } from "@/components/product/projection-card";
import { ReasoningBlock } from "@/components/product/reasoning-block";
import { VoiceOfCustomer } from "@/components/product/voice-of-customer";
import { SimilarStrip } from "@/components/product/similar-strip";
import { useSearchParams } from "next/navigation";
import { ActionBar } from "@/components/product/action-bar";
import { RescoreOverlay } from "@/components/product/rescore-overlay";
import { InsufficientModal } from "@/components/credits/insufficient-modal";
import { ResultsLayout } from "@/components/research/results/results-layout";
import { useProductStore } from "@/lib/store/products";
import { useCreditsStore } from "@/lib/store/credits";
import { useResearchStore } from "@/lib/store/research";
import { CREDIT_COSTS } from "@/lib/credits/config";
import { verdictFromScore, type Product } from "@/types";

const EXPORT_TARGET_ID = "wynner-export-target";

function rng(seed: number) {
  return Math.abs(Math.sin(seed * 9301 + 49297) * 233280) % 1;
}

function jitterPillars(p: Product): Product["pillars"] {
  const out = { ...p.pillars };
  let i = 0;
  for (const k of Object.keys(out) as (keyof Product["pillars"])[]) {
    const delta = Math.round((rng(Date.now() + i) - 0.5) * 12);
    out[k] = Math.max(0, Math.min(100, out[k] + delta));
    i++;
  }
  return out;
}

function newScoreFromPillars(p: Product["pillars"]): number {
  // Weighted blend identical-ish to seed math
  return Math.round(
    p.margin * 0.22 +
      p.marketFit * 0.22 +
      p.demand * 0.22 +
      p.competition * 0.18 +
      p.creative * 0.16,
  );
}

export function ProductDetail({ product }: { product: Product }) {
  const updateProduct = useProductStore((s) => s.updateProduct);
  const markViewed = useProductStore((s) => s.markViewed);
  const spend = useCreditsStore((s) => s.spend);
  const params = useSearchParams();
  const report = useResearchStore((s) => s.getByProductId(product.id));
  const fresh = params.get("fresh") === "true";

  const [rescoring, setRescoring] = useState(false);
  // Local override for animated pillar values during re-score
  const [pillarOverrides, setPillarOverrides] = useState<
    Product["pillars"] | undefined
  >(undefined);
  const [insufficient, setInsufficient] = useState<{ open: boolean; needed: number }>({
    open: false,
    needed: 0,
  });

  useEffect(() => {
    markViewed(product.id);
  }, [product.id, markViewed]);

  const summary = useMemo(
    () => product.reasoning.topAngle,
    [product],
  );

  const onRescore = async () => {
    if (rescoring) return;
    // Charge credits before doing any work
    const result = spend("re_score", {
      productId: product.id,
      description: `Re-score — ${product.name}`,
    });
    if (!result.success) {
      setInsufficient({ open: true, needed: result.needed });
      return;
    }
    setRescoring(true);
    // step 1: collapse all pillars to 0 visually
    setPillarOverrides({
      margin: 0,
      marketFit: 0,
      demand: 0,
      competition: 0,
      creative: 0,
    });
    await new Promise((r) => setTimeout(r, 2400));
    // step 2: compute new values and persist
    const newPillars = jitterPillars(product);
    const newScore = newScoreFromPillars(newPillars);
    const newVerdict = verdictFromScore(newScore);
    updateProduct(product.id, {
      pillars: newPillars,
      sellScore: newScore,
      verdict: newVerdict,
    });
    setPillarOverrides(undefined);
    await new Promise((r) => setTimeout(r, 350));
    setRescoring(false);
    toast.success(
      `Score refreshed — ${newScore} (${newVerdict.toUpperCase()})`,
    );
  };

  // If this product was generated via Deep Research, render the new layout
  // with all stage sections. Otherwise (seed products), keep the old layout.
  if (report) {
    return (
      <>
        <div className="px-6 pt-6">
          <BreadcrumbRow updatedAt={product.updatedAt} />
        </div>
        <ResultsLayout report={report} fresh={fresh} />
        <RescoreOverlay open={rescoring} />
        <InsufficientModal
          open={insufficient.open}
          onOpenChange={(open) => setInsufficient((s) => ({ ...s, open }))}
          needed={insufficient.needed}
          forAction="re-score this product"
        />
      </>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-7xl px-6 py-8 pb-32 md:pb-12"
    >
      <BreadcrumbRow updatedAt={product.updatedAt} />

      <div id={EXPORT_TARGET_ID} className="space-y-10">
        <ProductHero product={product} />
        <VerdictBand verdict={product.verdict} message={summary} />
        <PillarGrid product={product} pillarOverrides={pillarOverrides} />
        <CountryRadar product={product} />
        <VoiceOfCustomer product={product} />
        <ProjectionCard product={product} />
        <ReasoningBlock product={product} />
      </div>

      <div className="mt-10">
        <SimilarStrip product={product} />
      </div>

      <div className="mt-10">
        <ActionBar
          product={product}
          onRescore={onRescore}
          rescoring={rescoring}
          exportTargetId={EXPORT_TARGET_ID}
          rescoreCost={CREDIT_COSTS.re_score}
        />
      </div>

      <RescoreOverlay open={rescoring} />

      <InsufficientModal
        open={insufficient.open}
        onOpenChange={(open) => setInsufficient((s) => ({ ...s, open }))}
        needed={insufficient.needed}
        forAction="re-score this product"
      />
    </motion.main>
  );
}
