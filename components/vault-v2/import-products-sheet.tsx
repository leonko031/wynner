"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useProductStore } from "@/lib/store/products";
import type { Product } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * JSON import sheet. Accepts an array of Product objects (or a single
 * object). Useful for restoring after an export or migrating from another
 * vault. Stub-validates by checking required fields exist — invalid items
 * are silently skipped with a toast count.
 */
export function ImportProductsSheet({ open, onOpenChange }: Props) {
  const addProduct = useProductStore((s) => s.addProduct);
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);

  function doImport() {
    if (!raw.trim()) return;
    setBusy(true);
    try {
      const parsed = JSON.parse(raw) as Product | Product[];
      const list = Array.isArray(parsed) ? parsed : [parsed];
      let added = 0;
      let skipped = 0;
      for (const item of list) {
        if (!item || typeof item !== "object") {
          skipped++;
          continue;
        }
        const required = ["id", "name", "image", "category", "sellScore", "verdict"];
        const ok = required.every(
          (k) => (item as unknown as Record<string, unknown>)[k] !== undefined,
        );
        if (!ok) {
          skipped++;
          continue;
        }
        addProduct(item);
        added++;
      }
      toast.success(`Imported ${added} product${added === 1 ? "" : "s"}`, {
        description: skipped > 0 ? `${skipped} item${skipped === 1 ? "" : "s"} skipped — missing required fields.` : undefined,
      });
      setRaw("");
      onOpenChange(false);
    } catch (err) {
      toast.error("Couldn't parse JSON", {
        description: err instanceof Error ? err.message : "Invalid JSON",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-serif">Import products</SheetTitle>
          <SheetDescription>
            Paste a JSON array of Product objects (e.g. from a previous Wynner export).
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder='[ { "id": "...", "name": "...", "sellScore": 87, ... } ]'
            rows={14}
            className="font-mono text-[11px]"
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={doImport}
              disabled={busy || !raw.trim()}
              className="rounded-full"
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Import
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
