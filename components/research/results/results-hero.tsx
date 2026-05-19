"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Download, Mail, MessageCircleQuestion, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ScoreNumber } from "@/components/animated/score-number";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PdfPreviewModal } from "@/components/research/pdf-preview-modal";
import type { DeepResearchReport, Verdict } from "@/types/research";
import { ConfidencePill } from "./section";
import { cn } from "@/lib/utils";

const VERDICT_META: Record<Verdict, { label: string; color: string }> = {
  go: { label: "GO LIVE", color: "#3DD68C" },
  test: { label: "TEST IT", color: "#FFAB40" },
  risky: { label: "PROCEED WITH CARE", color: "#FF7E5F" },
  skip: { label: "SKIP", color: "#FF5C7C" },
};

type Props = { report: DeepResearchReport; fresh?: boolean };

export function ResultsHero({ report, fresh }: Props) {
  const [pdfOpen, setPdfOpen] = useState(false);
  const v = report.finalVerdict;
  const verdict = VERDICT_META[v.verdict];
  const isDeep = report.mode === "deep";
  const snap = report.productSnapshot;

  function copyShareLink() {
    const url = `${window.location.origin}/product/${report.productId}`;
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url);
      toast.success("Share link copied", { description: url });
    } else {
      toast("Copy this link", { description: url });
    }
  }

  return (
    <section className="grid grid-cols-1 gap-8 md:grid-cols-[3fr_4fr] md:items-center">
      {/* LEFT — product image */}
      <motion.div
        initial={fresh ? { opacity: 0, scale: 0.95 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative aspect-square w-full overflow-hidden rounded-3xl"
        style={{
          boxShadow: `0 0 0 1px ${verdict.color}33, 0 30px 80px -20px ${verdict.color}55, 0 0 60px ${verdict.color}26`,
        }}
      >
        <Image
          src={snap.image}
          alt={snap.name}
          fill
          sizes="(max-width: 768px) 100vw, 45vw"
          className="object-cover"
          priority
          unoptimized
        />
      </motion.div>

      {/* RIGHT — name + score + actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface/70 px-2 py-0.5 text-text-muted">
            <span aria-hidden>{snap.countryFlag}</span>
            {snap.countryName}
          </span>
          <ConfidencePill level={v.confidenceLevel} />
          <span className="inline-flex items-center rounded-full border border-border-soft bg-surface/70 px-2 py-0.5 font-mono text-text-dim">
            {report.mode === "deep" ? "Deep Research" : report.mode === "standard" ? "Standard Scan" : "Quick Scan"}
          </span>
        </div>

        <h1 className="text-3xl font-medium tracking-tight md:text-5xl">
          {snap.name}
        </h1>

        <div className="flex items-baseline gap-4">
          <div className="flex items-baseline gap-2">
            <ScoreNumber
              value={v.sellScore}
              duration={1.4}
              className={cn("text-6xl font-medium tabular-nums leading-none md:text-7xl")}
            />
            <span className="font-mono text-sm text-text-dim">/ 100</span>
          </div>
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wider"
            style={{
              backgroundColor: `${verdict.color}26`,
              color: verdict.color,
              border: `1px solid ${verdict.color}40`,
              boxShadow: `0 0 16px ${verdict.color}55`,
            }}
          >
            {verdict.label}
          </span>
        </div>

        <p className="max-w-prose text-sm leading-relaxed text-text-muted md:text-base">
          {v.summary}
        </p>

        {/* Actions */}
        <div className="glass mt-2 flex flex-wrap items-center gap-2 rounded-2xl p-3">
          {isDeep && (
            <>
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => setPdfOpen(true)}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download PDF Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-border-soft bg-surface/70"
                onClick={() => setPdfOpen(true)}
              >
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                Email me the PDF
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-border-soft bg-surface/70"
            onClick={copyShareLink}
          >
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            Share
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-border-soft bg-surface/70"
              >
                <MessageCircleQuestion className="mr-1.5 h-3.5 w-3.5" />
                Ask deeper…
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={6}
              className="glass-strong w-72 rounded-2xl border-0 p-3"
            >
              <div className="text-xs font-medium text-text">Coming soon</div>
              <p className="mt-1 text-xs text-text-muted">
                Drill into any section for a deeper take — each follow-up costs
                ✦ 2. We&apos;re calibrating the prompts before launch.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <PdfPreviewModal
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        report={report}
      />
    </section>
  );
}
