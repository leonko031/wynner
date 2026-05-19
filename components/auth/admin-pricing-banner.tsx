"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Shield } from "lucide-react";
import { useCreditsStore } from "@/lib/store/credits";

/**
 * Shown at the top of the pricing page when the viewer is an admin. Plan +
 * top-up cards stay visible (useful reference), but their CTAs will read
 * "Already unlocked" via the admin check inside those components.
 */
export function AdminPricingBanner() {
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  if (!isAdmin) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mt-6 max-w-3xl px-6"
    >
      <div
        className="glass-strong flex flex-wrap items-center gap-3 rounded-2xl p-4"
        style={{
          boxShadow:
            "0 0 0 1px rgba(167,136,255,0.45), 0 16px 36px -12px rgba(167,136,255,0.45)",
        }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(91,141,255,0.20), rgba(167,136,255,0.25), rgba(255,137,197,0.20))",
            border: "1px solid rgba(167,136,255,0.45)",
          }}
        >
          <Crown className="h-4 w-4 text-aurora-purple" />
        </span>
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 text-sm font-medium text-text">
            You have admin access
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white"
              style={{
                background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              }}
            >
              <Shield className="h-2.5 w-2.5" />
              Admin
            </span>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            All plans and credits are unlocked for your account. This page is for reference.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-aurora-purple/45 bg-aurora-purple/10 px-3 py-1.5 text-xs font-medium text-aurora-purple hover:bg-aurora-purple/20"
        >
          Open admin panel
        </Link>
      </div>
    </motion.div>
  );
}
