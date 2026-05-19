"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  NoResultsIllustration,
  VaultIllustration,
} from "@/components/empty/illustrations";

type Variant = "filtered" | "empty-vault";

export function VaultEmptyState({
  onClear,
  variant = "filtered",
}: {
  onClear: () => void;
  variant?: Variant;
}) {
  const isVaultEmpty = variant === "empty-vault";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mt-12 flex max-w-md flex-col items-center rounded-2xl border border-border-soft bg-surface/40 p-10 text-center"
    >
      <div className="mb-5 w-44 text-text-muted">
        {isVaultEmpty ? <VaultIllustration /> : <NoResultsIllustration />}
      </div>
      <h2 className="text-lg font-medium text-text">
        {isVaultEmpty
          ? "Your vault is empty"
          : "No products match your filters"}
      </h2>
      <p className="mt-1 max-w-xs text-sm text-text-muted">
        {isVaultEmpty
          ? "Score your first product and it'll land here automatically."
          : "Try widening the score range, removing a niche, or starting a new scan."}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {isVaultEmpty ? (
          <Button asChild size="sm" className="rounded-full">
            <Link href="/scan">Start your first scan</Link>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-border-soft bg-surface/60"
            onClick={onClear}
          >
            Clear filters
          </Button>
        )}
      </div>
    </motion.div>
  );
}
