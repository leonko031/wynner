"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCollectionsStore } from "@/lib/store/collections";
import { COLLECTION_COLORS, COLLECTION_COLOR_HEX, type CollectionColor } from "@/types/vault";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional: when present, the new collection is created with these products. */
  preselectedProductIds?: string[];
  /** Optional: invoked after the collection is created. */
  onCreated?: (collectionId: string) => void;
};

/**
 * Lightweight modal for creating a user collection.
 */
export function NewCollectionModal({
  open,
  onOpenChange,
  preselectedProductIds,
  onCreated,
}: Props) {
  const create = useCollectionsStore((s) => s.createCollection);
  const addProducts = useCollectionsStore((s) => s.addProducts);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<CollectionColor>("aurora_blue");
  const [submitting, setSubmitting] = useState(false);

  // Reset state when the modal closes.
  useEffect(() => {
    if (!open) {
      const t = window.setTimeout(() => {
        setName("");
        setDescription("");
        setColor("aurora_blue");
      }, 200);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Give your collection a name");
      return;
    }
    setSubmitting(true);
    const col = await create({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      type: "user",
    });
    if (!col) {
      setSubmitting(false);
      toast.error("Couldn't create collection", {
        description: "Make sure you're signed in.",
      });
      return;
    }
    if (preselectedProductIds && preselectedProductIds.length > 0) {
      await addProducts(col.id, preselectedProductIds);
    }
    setSubmitting(false);
    onOpenChange(false);
    toast.success(`Created "${col.name}"`);
    onCreated?.(col.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="glass-strong max-w-md rounded-3xl border-0 p-6"
      >
        <DialogTitle className="font-serif text-xl tracking-tight text-text">
          New collection
        </DialogTitle>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="collection-name"
              className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-text-dim"
            >
              Name
            </label>
            <Input
              id="collection-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Winter wellness winners"
              maxLength={80}
              className="h-11 rounded-xl"
            />
          </div>
          <div>
            <label
              htmlFor="collection-description"
              className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-text-dim"
            >
              Description (optional)
            </label>
            <Textarea
              id="collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What ties this group together?"
              maxLength={280}
              rows={3}
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Color
            </label>
            <div className="flex items-center gap-2">
              {COLLECTION_COLORS.map((c) => {
                const hex = COLLECTION_COLOR_HEX[c];
                const active = color === c;
                return (
                  <motion.button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      active && "ring-2 ring-offset-2 ring-offset-[var(--surface-page)]",
                    )}
                    style={{
                      background: hex,
                      ...(active ? { ["--tw-ring-color" as string]: hex } : {}),
                    }}
                    aria-label={c.replace("aurora_", "")}
                    aria-pressed={active}
                  />
                );
              })}
            </div>
          </div>

          {preselectedProductIds && preselectedProductIds.length > 0 && (
            <div className="rounded-xl border border-aurora-purple/35 bg-aurora-purple/10 px-3 py-2 text-xs text-text">
              {preselectedProductIds.length} product
              {preselectedProductIds.length === 1 ? "" : "s"} will be added to this collection.
            </div>
          )}

          <div className="mt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()} className="rounded-full">
              {submitting ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
