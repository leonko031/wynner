"use client";

import { motion } from "framer-motion";
import { Copy, Download, FileImage, FileText, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { JudgeVerdict } from "@/types/compare";
import type { Product } from "@/types";

type Props = {
  products: Product[];
  verdict: JudgeVerdict | null;
  /** id of the DOM element to capture for the PNG export. */
  pngTargetId: string;
};

/**
 * Action bar at the bottom of the compare page. Save / PNG / PDF / share.
 *
 * PDF uses @react-pdf/renderer (dynamically imported to keep the main
 * bundle slim). PNG uses html-to-image (already a dep). Share is just
 * `navigator.clipboard.writeText(window.location.href)` — the URL already
 * encodes the product ids.
 */
export function ExportActions({ products, verdict, pngTargetId }: Props) {
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);

  async function exportPng() {
    if (busy) return;
    setBusy("png");
    try {
      const target = document.getElementById(pngTargetId);
      if (!target) throw new Error("Capture target missing");
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(target, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#FAFBFF",
      });
      const a = document.createElement("a");
      a.download = `wynner-comparison-${productSlug(products)}.png`;
      a.href = dataUrl;
      a.click();
      toast.success("PNG exported");
    } catch (err) {
      toast.error("Couldn't export PNG", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setBusy(null);
    }
  }

  async function exportPdf() {
    if (busy) return;
    if (!verdict) {
      toast.error("No verdict yet", {
        description: "Generate the verdict first, then export it as PDF.",
      });
      return;
    }
    setBusy("pdf");
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { VerdictPdfDocument } = await import("@/lib/pdf/verdict-pdf");
      const blob = await pdf(
        <VerdictPdfDocument
          verdict={verdict}
          products={products}
          generatedAt={new Date().toISOString()}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `wynner-verdict-${productSlug(products)}.pdf`;
      a.href = url;
      a.click();
      // Best-effort cleanup
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success("PDF exported");
    } catch (err) {
      toast.error("Couldn't export PDF", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setBusy(null);
    }
  }

  function copyShareLink() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url);
      toast.success("Share link copied", { description: url });
    } else {
      toast("Copy this link", { description: url });
    }
  }

  function saveLocal() {
    // The verdict is already persisted server-side (comparison_verdicts).
    // Nothing extra to do — surface that to the user.
    toast.success("Saved to your comparisons", {
      description: verdict
        ? "View this verdict any time by re-opening the same products."
        : "Generate a verdict to make this shareable.",
    });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass flex flex-wrap items-center justify-between gap-3 rounded-full px-5 py-3"
    >
      <div className="text-xs text-text-muted">
        {products.length} product{products.length === 1 ? "" : "s"} ·{" "}
        {verdict ? "verdict generated" : "no verdict yet"}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={saveLocal}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-3 text-xs text-text-muted hover:border-aurora-purple/45 hover:text-text"
        >
          <Save className="h-3.5 w-3.5" />
          Save comparison
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={busy !== null}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-medium text-white shadow-[0_8px_22px_-6px_rgba(91,141,255,0.55)] hover:brightness-110 disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              }}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="w-52">
            <DropdownMenuItem
              onSelect={() => void exportPng()}
              className="cursor-pointer text-xs"
              disabled={busy !== null}
            >
              <FileImage className="h-3.5 w-3.5" />
              Export as PNG
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => void exportPdf()}
              className="cursor-pointer text-xs"
              disabled={busy !== null || !verdict}
            >
              <FileText className="h-3.5 w-3.5" />
              Export verdict as PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={copyShareLink}
              className="cursor-pointer text-xs"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy share link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.section>
  );
}

function productSlug(products: Product[]): string {
  return products
    .slice(0, 3)
    .map((p) => p.name.toLowerCase().replace(/[^\w]+/g, "-"))
    .join("-vs-")
    .slice(0, 80);
}
