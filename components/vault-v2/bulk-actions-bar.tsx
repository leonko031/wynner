"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  Compass,
  Download,
  Folder,
  RefreshCw,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProductStore } from "@/lib/store/products";
import { useProductStatusStore } from "@/lib/store/product-status";
import {
  useCollectionsStore,
  collectionsWithProducts,
} from "@/lib/store/collections";
import {
  PRODUCT_STATUSES,
  STATUS_META,
  type ProductStatus,
} from "@/types/vault";
import { NewCollectionModal } from "./new-collection-modal";
import { cn } from "@/lib/utils";

type Props = {
  selectedIds: string[];
  onClear: () => void;
};

/**
 * Floating bottom bar shown whenever multi-select is active. Bulk actions
 * apply to the selected products.
 */
export function BulkActionsBar({ selectedIds, onClear }: Props) {
  const removeProduct = useProductStore((s) => s.removeProduct);
  const setStatusBulk = useProductStatusStore((s) => s.setStatusBulk);
  // Stable refs + useMemo to avoid the Zustand snapshot-churn loop.
  const rawCollections = useCollectionsStore((s) => s.collections);
  const memberships = useCollectionsStore((s) => s.memberships);
  const collections = useMemo(
    () => collectionsWithProducts(rawCollections, memberships),
    [rawCollections, memberships],
  );
  const addProducts = useCollectionsStore((s) => s.addProducts);
  const userCols = useMemo(
    () => collections.filter((c) => c.type === "user"),
    [collections],
  );

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const visible = selectedIds.length > 0;
  const canCompare = selectedIds.length >= 2 && selectedIds.length <= 4;

  function exportJson() {
    const blob = new Blob([JSON.stringify({ productIds: selectedIds }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wynner-selection-${selectedIds.length}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as JSON");
  }

  function compareNow() {
    if (!canCompare) return;
    const url = `/compare?products=${selectedIds.join(",")}`;
    window.location.href = url;
  }

  function deleteAll() {
    for (const id of selectedIds) removeProduct(id);
    toast.success(`Deleted ${selectedIds.length} product${selectedIds.length === 1 ? "" : "s"}`);
    onClear();
    setConfirmDel(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="bulk-bar"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4"
        >
          <div
            className="glass-strong flex flex-wrap items-center gap-2 rounded-full px-5 py-2.5 backdrop-blur-xl"
            style={{
              boxShadow:
                "0 0 0 1px rgba(167,136,255,0.45), 0 24px 60px -16px rgba(91,141,255,0.45)",
            }}
          >
            <span className="font-mono text-xs uppercase tracking-wider text-text">
              {selectedIds.length} selected
            </span>
            <span className="mx-1 h-4 w-px bg-border-soft" aria-hidden />

            <ActionButton
              icon={<Folder className="h-3.5 w-3.5" />}
              label="Add to…"
              dropdown
            >
              <DropdownMenuLabel className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                Add to collection
              </DropdownMenuLabel>
              {userCols.length === 0 && (
                <div className="px-2 py-1.5 text-[11px] text-text-dim">
                  No user collections yet
                </div>
              )}
              {userCols.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onSelect={async () => {
                    await addProducts(c.id, selectedIds);
                    toast.success(
                      `Added ${selectedIds.length} to ${c.name}`,
                    );
                  }}
                  className="cursor-pointer text-xs"
                >
                  {c.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onSelect={() => setNewModalOpen(true)}
                className="cursor-pointer text-xs"
              >
                + New collection…
              </DropdownMenuItem>
            </ActionButton>

            <ActionButton
              icon={<Tag className="h-3.5 w-3.5" />}
              label="Status…"
              dropdown
            >
              <DropdownMenuLabel className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                Set status
              </DropdownMenuLabel>
              {PRODUCT_STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onSelect={async () => {
                    await setStatusBulk(selectedIds, s as ProductStatus);
                    toast.success(`Marked ${selectedIds.length} as ${STATUS_META[s].label}`);
                  }}
                  className="cursor-pointer text-xs"
                >
                  <span
                    className="mr-2 h-2 w-2 rounded-full"
                    style={{ background: STATUS_META[s].color }}
                    aria-hidden
                  />
                  {STATUS_META[s].label}
                </DropdownMenuItem>
              ))}
            </ActionButton>

            <ActionButton
              icon={<Compass className="h-3.5 w-3.5" />}
              label="Compare"
              onClick={compareNow}
              disabled={!canCompare}
              tooltip={!canCompare ? "Select 2-4 products to compare" : undefined}
            />

            <ActionButton
              icon={<Download className="h-3.5 w-3.5" />}
              label="Export"
              onClick={exportJson}
            />

            <ActionButton
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              label={`Re-score (✦ ${selectedIds.length})`}
              onClick={() =>
                toast(`Re-score all not wired yet`, {
                  description:
                    "Coming soon — for now use the per-product re-score button.",
                })
              }
            />

            <ActionButton
              icon={<Archive className="h-3.5 w-3.5" />}
              label="Archive"
              onClick={async () => {
                await setStatusBulk(selectedIds, "archived");
                toast.success(`Archived ${selectedIds.length}`);
              }}
            />

            <ActionButton
              icon={<Trash2 className="h-3.5 w-3.5" />}
              label="Delete"
              onClick={() => setConfirmDel(true)}
              destructive
            />

            <span className="mx-1 h-4 w-px bg-border-soft" aria-hidden />
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface/60 px-3 py-1 text-xs text-text-muted hover:border-border-strong hover:text-text"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>

          <NewCollectionModal
            open={newModalOpen}
            onOpenChange={setNewModalOpen}
            preselectedProductIds={selectedIds}
          />

          {confirmDel && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur"
              onClick={() => setConfirmDel(false)}
            >
              <div
                className="glass-strong w-full max-w-sm rounded-3xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="font-serif text-lg text-text">
                  Delete {selectedIds.length} product
                  {selectedIds.length === 1 ? "" : "s"}?
                </div>
                <p className="mt-2 text-sm text-text-muted">
                  This can&apos;t be undone. Collections and statuses for these
                  products will be cleaned up.
                </p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDel(false)}
                    className="rounded-full px-3 py-1.5 text-xs text-text-muted hover:text-text"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={deleteAll}
                    className="rounded-full bg-skip px-3 py-1.5 text-xs font-medium text-white hover:brightness-110"
                  >
                    Delete all
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  destructive,
  tooltip,
  dropdown,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  tooltip?: string;
  dropdown?: boolean;
  children?: React.ReactNode;
}) {
  const base = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors",
        destructive
          ? "border border-skip/40 bg-skip/10 text-skip hover:bg-skip/20"
          : "border border-border-soft bg-surface/70 text-text-muted hover:border-aurora-purple/45 hover:text-text",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {icon}
      {label}
    </button>
  );
  if (dropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{base}</DropdownMenuTrigger>
        <DropdownMenuContent align="center" sideOffset={8} className="w-56">
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  return base;
}
