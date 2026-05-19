"use client";

import { useState } from "react";
import {
  Copy,
  Download,
  ImageIcon,
  Link as LinkIcon,
  Loader2,
  Share2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { wynnerToast } from "@/lib/toast";
import { exportProductPng } from "@/lib/export/product-png";
import type { Product } from "@/types";

type Props = {
  product: Product;
  exportTargetId: string;
};

export function SharePopover({ product, exportTargetId }: Props) {
  const [exporting, setExporting] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/product/${product.id}`;
    try {
      await navigator.clipboard.writeText(url);
      wynnerToast.success("Link copied", { description: url });
    } catch {
      wynnerToast.error("Couldn't copy", { description: url });
    }
  }

  function copyOgUrl() {
    const params = new URLSearchParams({
      name: product.name,
      score: String(product.sellScore),
      verdict: product.verdict,
      niche: product.category,
      country: product.targetCountry,
    });
    if (product.image) params.set("img", product.image);
    const url = `${window.location.origin}/api/og?${params.toString()}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => wynnerToast.success("Share image URL copied"))
      .catch(() => wynnerToast.error("Couldn't copy"));
  }

  async function downloadPng() {
    if (exporting) return;
    const node = document.getElementById(exportTargetId);
    if (!node) {
      wynnerToast.error("Nothing to export");
      return;
    }
    setExporting(true);
    try {
      await exportProductPng(node, product);
      wynnerToast.success("PNG downloaded");
    } catch (e) {
      wynnerToast.error("Export failed", {
        description: e instanceof Error ? e.message : "unknown",
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full border-border-soft bg-surface/60"
        >
          <Share2 className="mr-1.5 h-3.5 w-3.5" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <Row icon={LinkIcon} label="Copy link" onClick={copyLink} />
        <Row icon={Copy} label="Copy share-image URL" onClick={copyOgUrl} />
        <Row
          icon={ImageIcon}
          label="Copy as image (OG card)"
          onClick={() => {
            // Same as download but encourages right-click → copy
            wynnerToast.info("Tip", {
              description:
                "Click the OG image URL in a new tab, then right-click → Copy Image.",
            });
            copyOgUrl();
          }}
        />
        <Row
          icon={exporting ? Loader2 : Download}
          label={exporting ? "Generating…" : "Download as PNG"}
          onClick={downloadPng}
          spinning={exporting}
        />
      </PopoverContent>
    </Popover>
  );
}

function Row({
  icon: Icon,
  label,
  onClick,
  spinning,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  spinning?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-text hover:bg-surface-elevated"
    >
      <Icon className={`h-3.5 w-3.5 text-text-muted ${spinning ? "animate-spin" : ""}`} />
      {label}
    </button>
  );
}
