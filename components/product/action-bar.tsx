"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Download,
  GitCompareArrows,
  Heart,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SharePopover } from "@/components/product/share-popover";
import { useProductStore } from "@/lib/store/products";
import { SparkIcon } from "@/components/credits/spark-icon";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  onRescore: () => void;
  rescoring: boolean;
  exportTargetId: string;
  /** Credit cost of a re-score — surfaced in the button label. */
  rescoreCost?: number;
};

export function ActionBar({
  product,
  onRescore,
  rescoring,
  exportTargetId,
  rescoreCost,
}: Props) {
  const router = useRouter();
  const toggleFavorite = useProductStore((s) => s.toggleFavorite);
  const removeProduct = useProductStore((s) => s.removeProduct);
  const isFav = useProductStore((s) => s.favorites.has(product.id));
  const [confirmDel, setConfirmDel] = useState(false);
  const [exporting, setExporting] = useState(false);

  const onExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const target = document.getElementById(exportTargetId);
      if (!target) throw new Error("export target missing");
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(target, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#0A0A0B",
      });
      const a = document.createElement("a");
      a.download = `${product.name.replace(/\s+/g, "-").toLowerCase()}.png`;
      a.href = dataUrl;
      a.click();
      toast.success("PNG exported");
    } catch (e) {
      toast.error("Export failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "z-30 flex items-center justify-between gap-2 rounded-2xl border border-border-soft bg-surface/80 p-3 backdrop-blur-xl",
          // Sticky on mobile, inline on desktop
          "fixed inset-x-4 bottom-4 shadow-2xl md:static md:shadow-none",
        )}
      >
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={() => toggleFavorite(product.id)}
            whileTap={{ scale: 0.92 }}
            aria-label={isFav ? "Remove from vault" : "Save to vault"}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
              isFav
                ? "border-skip/50 bg-skip/10 text-skip"
                : "border-border-soft bg-surface text-text-muted hover:border-border-strong hover:text-text",
            )}
          >
            <Heart className="h-4 w-4" fill={isFav ? "currentColor" : "none"} />
          </motion.button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-border-soft bg-surface text-text-muted hover:bg-surface-elevated hover:text-text"
            onClick={() =>
              toast(`Compare drawer (coming soon) — ${product.name} pre-selected`)
            }
          >
            <GitCompareArrows className="mr-1.5 h-3.5 w-3.5" />
            Compare
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={exporting}
            className="rounded-full border-border-soft bg-surface text-text-muted hover:bg-surface-elevated hover:text-text"
            onClick={onExport}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {exporting ? "Exporting…" : "Export PNG"}
          </Button>
          <SharePopover product={product} exportTargetId={exportTargetId} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={rescoring}
            onClick={onRescore}
            className="rounded-full"
          >
            <RefreshCw
              className={cn(
                "mr-1.5 h-3.5 w-3.5",
                rescoring && "animate-spin",
              )}
            />
            {rescoring ? "Scoring…" : "Re-score"}
            {!rescoring && rescoreCost !== undefined && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-white/15 px-1.5 py-0.5 font-mono text-[10px] tabular-nums">
                <SparkIcon size={9} color="currentColor" />
                {rescoreCost}
              </span>
            )}
          </Button>
          <button
            type="button"
            aria-label="Delete product"
            onClick={() => setConfirmDel(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft bg-surface text-text-muted transition-colors hover:border-skip/50 hover:text-skip"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <Dialog open={confirmDel} onOpenChange={setConfirmDel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this product?</DialogTitle>
            <DialogDescription>
              {product.name} will be removed from your dashboard and vault.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDel(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                removeProduct(product.id);
                setConfirmDel(false);
                toast.success("Product deleted");
                router.push("/dashboard");
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
