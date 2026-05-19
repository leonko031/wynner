"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useCreditsStore } from "@/lib/store/credits";
import { useProductStore } from "@/lib/store/products";
import { useCollectionsStore } from "@/lib/store/collections";

/**
 * Admin-only vault diagnostic strip. Shows quick counts so admins can sanity
 * check the data layer. Invisible to non-admins.
 */
export function VaultAdminDiagnostics() {
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  const products = useProductStore((s) => s.products);
  const collections = useCollectionsStore((s) => s.collections);
  const memberships = useCollectionsStore((s) => s.memberships);
  const [lastSearchLatency, setLastSearchLatency] = useState<number | null>(null);
  void setLastSearchLatency; // reserved for future search latency wiring

  // Watch for search latency events (dispatched from the smart search bar)
  useEffect(() => {
    if (!isAdmin) return;
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ ms: number }>;
      if (typeof ce.detail?.ms === "number") setLastSearchLatency(ce.detail.ms);
    };
    window.addEventListener("wynner:vault-search-latency", handler);
    return () => window.removeEventListener("wynner:vault-search-latency", handler);
  }, [isAdmin]);

  if (!isAdmin) return null;

  const smartCount = collections.filter((c) => c.type === "smart").length;
  const userCount = collections.filter((c) => c.type === "user").length;
  const totalMembership = Object.values(memberships).reduce(
    (sum, set) => sum + set.size,
    0,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-flat rounded-2xl p-3"
      style={{
        boxShadow:
          "0 0 0 1px rgba(167,136,255,0.30), inset 0 1px 0 0 var(--surface-glass-highlight)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-mono uppercase tracking-wider text-aurora-purple">
          <Shield className="h-3 w-3" />
          Admin · Vault diagnostics
        </div>
        <div className="flex flex-wrap items-center gap-2 text-text-muted">
          <Stat label="products" value={String(products.length)} />
          <Stat label="user cols" value={String(userCount)} />
          <Stat label="smart cols" value={String(smartCount)} />
          <Stat label="memberships" value={String(totalMembership)} />
          <Stat
            label="last search"
            value={lastSearchLatency === null ? "—" : `${lastSearchLatency}ms`}
          />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border-soft bg-surface/60 px-2 py-0.5">
      <span className="font-mono text-[9px] uppercase tracking-wider text-text-dim">
        {label}
      </span>
      <span className="font-mono text-xs tabular-nums text-text">{value}</span>
    </span>
  );
}
