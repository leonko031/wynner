"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, X } from "lucide-react";

type Variant =
  | { kind: "vault" }
  | { kind: "no-results"; onClear: () => void }
  | { kind: "empty-collection"; collectionName: string };

/**
 * Three empty-state variants the vault shows, depending on context.
 * Always warm, never error-toned.
 */
export function VaultEmptyState(props: Variant) {
  if (props.kind === "vault") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center"
      >
        <FloatingProductsIllustration />
        <h2 className="font-serif text-3xl tracking-tight text-text">
          Your vault is waiting
        </h2>
        <p className="text-sm text-text-muted">
          Score your first product to start building your library.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/scan"
            className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-white shadow-[0_12px_28px_-8px_rgba(91,141,255,0.55)] hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
            }}
          >
            <Sparkles className="h-4 w-4" />
            Start your first scan
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-border-soft bg-surface/70 px-5 text-sm text-text-muted hover:border-border-strong hover:text-text"
          >
            Browse trending products
          </Link>
        </div>
      </motion.div>
    );
  }

  if (props.kind === "no-results") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mx-auto flex max-w-md flex-col items-center gap-3 py-12 text-center"
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            background: "rgba(157,160,191,0.10)",
            border: "1px solid rgba(157,160,191,0.30)",
          }}
        >
          <X className="h-5 w-5 text-text-dim" />
        </div>
        <h3 className="font-serif text-xl text-text">No matches</h3>
        <p className="max-w-sm text-sm text-text-muted">
          Try a broader search or clear your filters.
        </p>
        <button
          type="button"
          onClick={props.onClear}
          className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-full bg-aurora-blue/15 px-4 text-xs font-medium text-aurora-blue hover:bg-aurora-blue/20"
        >
          Clear filters
        </button>
      </motion.div>
    );
  }

  // empty-collection
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex max-w-md flex-col items-center gap-3 py-12 text-center"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{
          background: "rgba(167,136,255,0.10)",
          border: "1px solid rgba(167,136,255,0.30)",
        }}
      >
        <Sparkles className="h-5 w-5 text-aurora-purple" />
      </div>
      <h3 className="font-serif text-xl text-text">
        &ldquo;{props.collectionName}&rdquo; is empty
      </h3>
      <p className="max-w-sm text-sm text-text-muted">
        Add products from the product menu &mdash; or auto-organize to refresh
        your AI-curated groupings.
      </p>
    </motion.div>
  );
}

function FloatingProductsIllustration() {
  return (
    <motion.svg
      viewBox="0 0 240 180"
      width={240}
      height={180}
      aria-hidden
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="vault-empty-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5B8DFF" />
          <stop offset="50%" stopColor="#A788FF" />
          <stop offset="100%" stopColor="#FF89C5" />
        </linearGradient>
      </defs>
      <motion.rect
        x="20" y="40" rx="14" width="80" height="100"
        fill="url(#vault-empty-fill)" opacity={0.35}
        animate={{ y: [40, 30, 40] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.rect
        x="80" y="20" rx="14" width="80" height="100"
        fill="url(#vault-empty-fill)" opacity={0.55}
        animate={{ y: [20, 30, 20] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.rect
        x="140" y="60" rx="14" width="80" height="100"
        fill="url(#vault-empty-fill)" opacity={0.35}
        animate={{ y: [60, 50, 60] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}
