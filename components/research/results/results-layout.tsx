"use client";

import { motion } from "framer-motion";
import type { DeepResearchReport } from "@/types/research";
import { ResultsHero } from "./results-hero";
import { ExecutiveSummary } from "./executive-summary";
import { CustomerAvatars } from "./customer-avatars";
import { MarketDeepDive } from "./market-deep-dive";
import { CompetitiveLandscape } from "./competitive-landscape";
import { PricingStrategySection } from "./pricing-strategy";
import { SixAngles } from "./six-angles";
import { HookAnglesSection } from "./hook-angles";
import { SourcesPanel } from "./sources-panel";
import { LaunchPlaybookSection } from "./launch-playbook";
import { RiskAnalysisSection } from "./risk-analysis";
import { FinalVerdictSection } from "./final-verdict";
import { MethodologyFooter } from "./methodology-footer";

/**
 * The full results page layout. Mounted by the product detail page when a
 * DeepResearchReport exists for the product. Each section reveals on scroll.
 */
export function ResultsLayout({
  report,
  fresh,
}: {
  report: DeepResearchReport;
  fresh?: boolean;
}) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-7xl space-y-14 px-6 py-10 pb-24"
    >
      <ResultsHero report={report} fresh={fresh} />
      <ExecutiveSummary report={report} />
      {/* New centerpiece — only renders when hookAngles is populated (new
          grounded engine). Older reports keep showing the legacy SixAngles
          via the fallthrough below. */}
      {report.hookAngles && report.hookAngles.length > 0 ? (
        <HookAnglesSection report={report} />
      ) : (
        <SixAngles report={report} />
      )}
      <CustomerAvatars report={report} />
      <MarketDeepDive report={report} />
      <CompetitiveLandscape report={report} />
      <PricingStrategySection report={report} />
      <LaunchPlaybookSection report={report} />
      <RiskAnalysisSection report={report} />
      <FinalVerdictSection report={report} />
      <SourcesPanel report={report} />
      <MethodologyFooter report={report} />
    </motion.main>
  );
}
