"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { PointerEvent } from "react";
import { toast } from "sonner";
import { TOPUP_BADGE_META, type TopUpPack } from "@/lib/credits/config";
import { useCreditsStore } from "@/lib/store/credits";
import { cn } from "@/lib/utils";
import { SparkIcon } from "./spark-icon";

type Props = { pack: TopUpPack };

/**
 * Pricing-page top-up pack card. Subtle tilt-follow on pointer move (kept
 * lightweight — only when the pointer is over the card itself, no global
 * listener). Tap → POSTs to /api/checkout/topup; in dev mode falls back to
 * granting credits directly via the store.
 */
export function TopUpCard({ pack }: Props) {
  const purchaseTopup = useCreditsStore((s) => s.purchaseTopup);
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-30, 30], [3, -3]), { stiffness: 220, damping: 18 });
  const ry = useSpring(useTransform(x, [-30, 30], [-3, 3]), { stiffness: 220, damping: 18 });

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - (r.left + r.width / 2));
    y.set(e.clientY - (r.top + r.height / 2));
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  async function handleBuy() {
    try {
      const res = await fetch("/api/checkout/topup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ packId: pack.id }),
      });
      const data = (await res.json()) as
        | { url: string }
        | { devGrant: true; packId: string };

      if ("devGrant" in data && data.devGrant) {
        purchaseTopup(pack.id);
        toast.success(`✨ ${pack.credits} credits added`, {
          description: "Dev mode — Stripe not configured",
        });
        return;
      }
      if ("url" in data && data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error("Could not start checkout", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const badge = pack.badge ? TOPUP_BADGE_META[pack.badge] : null;

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      className="glass group relative flex flex-col gap-4 rounded-2xl p-6 transition-all hover:-translate-y-1"
    >
      {badge && (
        <span
          className={cn(
            "absolute -top-2 right-4 inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white shadow-md",
            badge.pulse && "animate-pulse-glow",
          )}
          style={{
            background: badge.color,
            boxShadow: `0 6px 24px -6px ${badge.color}aa`,
          }}
        >
          {badge.label}
        </span>
      )}

      {/* Credit count */}
      <div className="flex items-baseline gap-2">
        <SparkIcon size={18} />
        <span className="text-4xl font-medium tracking-tight text-text">
          {pack.credits}
        </span>
      </div>

      {/* Price + per-credit */}
      <div>
        <div className="font-mono text-lg tabular-nums text-text">
          €{pack.price}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          €{pack.perCredit.toFixed(2)} / credit
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleBuy}
        disabled={isAdmin}
        className={cn(
          "mt-auto inline-flex h-10 w-full items-center justify-center rounded-full text-xs font-medium transition-all",
          isAdmin
            ? "cursor-not-allowed border border-aurora-purple/45 bg-aurora-purple/10 text-aurora-purple"
            : "border border-border-soft bg-surface/70 text-text hover:border-aurora-blue/60 hover:bg-aurora-blue/10",
        )}
      >
        {isAdmin ? "Already unlocked" : `Buy ${pack.credits} credits`}
      </button>
    </motion.div>
  );
}
