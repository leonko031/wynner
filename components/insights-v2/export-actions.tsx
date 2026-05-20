"use client";

import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  Blindspot,
  OperatorLevelBreakdown,
  ProfileTag,
  StrategicBrief,
  Strength,
} from "@/types/insights";

type Props = {
  firstName: string;
  periodLabel: string;
  operatorLevel: OperatorLevelBreakdown;
  profileTags: ProfileTag[];
  brief: StrategicBrief | null;
  strengths: Strength[];
  blindspots: Blindspot[];
  metrics: {
    totalScans: number;
    avgScore: number;
    winRate: number;
    actionRate: number;
    highestScore: number;
    creditsSpent: number;
    topNiche: string;
    topCountry: string;
  };
  topNicheRows: Array<{ label: string; count: number; avgScore: number }>;
  topCountryRows: Array<{ label: string; count: number; avgScore: number }>;
};

/**
 * "Export insights as PDF" button — free for everyone. Dynamically imports
 * @react-pdf/renderer + the InsightsPdfDocument so the main bundle stays slim.
 */
export function InsightsExportActions(props: Props) {
  const [busy, setBusy] = useState(false);

  async function exportPdf() {
    if (busy) return;
    setBusy(true);
    try {
      const [{ pdf }, { InsightsPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/insights-pdf"),
      ]);
      const blob = await pdf(
        <InsightsPdfDocument
          firstName={props.firstName}
          generatedAt={new Date().toISOString()}
          periodLabel={props.periodLabel}
          operatorLevel={props.operatorLevel}
          profileTags={props.profileTags}
          brief={props.brief}
          strengths={props.strengths}
          blindspots={props.blindspots}
          metrics={props.metrics}
          topNicheRows={props.topNicheRows}
          topCountryRows={props.topCountryRows}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `wynner-insights-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.href = url;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success("Insights report exported");
    } catch (err) {
      toast.error("Couldn't export PDF", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={exportPdf}
        disabled={busy}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-4 text-xs text-text hover:border-aurora-purple/55 disabled:opacity-50"
      >
        {busy ? (
          <Download className="h-3.5 w-3.5 animate-pulse" />
        ) : (
          <FileText className="h-3.5 w-3.5" />
        )}
        {busy ? "Generating…" : "Export insights as PDF"}
      </button>
    </div>
  );
}
