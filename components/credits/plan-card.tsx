"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { PLANS } from "@/lib/credits/config";
import { useCreditsStore } from "@/lib/store/credits";
import type { BillingInterval, PlanTier } from "@/types/credits";
import { cn } from "@/lib/utils";
import { SparkIcon } from "./spark-icon";

type Props = {
  plan: PlanTier;
  interval: BillingInterval;
  highlight?: boolean;
};

/** Pricing-page plan card. Triggers checkout (dev-mode fallback grants directly). */
export function PlanCard({ plan, interval, highlight }: Props) {
  const cfg = PLANS[plan];
  const currentPlan = useCreditsStore((s) => s.plan);
  const upgradePlan = useCreditsStore((s) => s.upgradePlan);
  const isAdmin = useCreditsStore((s) => s.isAdmin);

  const price = interval === "yearly" ? cfg.priceYearly : cfg.priceMonthly;
  const priceLabel =
    cfg.priceMonthly === 0
      ? "Free"
      : interval === "yearly"
        ? `€${Math.round(price / 12)}`
        : `€${price}`;
  const sublabel =
    cfg.priceMonthly === 0
      ? "forever"
      : interval === "yearly"
        ? `/month · billed €${price}/yr`
        : "/month";

  const isCurrent = currentPlan === plan;

  async function handleCheckout() {
    if (isCurrent) {
      toast.info("You're already on this plan.");
      return;
    }
    if (cfg.priceMonthly === 0) {
      // Free tier — switch immediately
      upgradePlan(plan);
      toast.success(`Switched to ${cfg.name}`);
      return;
    }

    try {
      const res = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = (await res.json()) as
        | { url: string }
        | { devGrant: true; plan: PlanTier };

      if ("devGrant" in data && data.devGrant) {
        // Stripe isn't configured — dev mode: grant locally
        upgradePlan(plan);
        toast.success(`✨ Welcome to ${cfg.name}`, {
          description: "Dev mode — credits added directly (Stripe not configured)",
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

  return (
    <motion.div
      whileHover={{ y: highlight ? -10 : -6 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass relative flex flex-col rounded-3xl p-7 transition-all",
        highlight && "md:scale-105",
      )}
      style={
        highlight
          ? {
              boxShadow:
                "0 0 0 1px rgba(167,136,255,0.45), 0 30px 80px -20px rgba(91,141,255,0.45), 0 0 60px rgba(167,136,255,0.20)",
            }
          : {
              boxShadow:
                "0 0 0 1px rgba(167,136,255,0.18), 0 16px 48px -16px rgba(91,141,255,0.20)",
            }
      }
    >
      {/* Most popular ribbon */}
      {highlight && (
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="absolute -top-3.5 left-1/2 -translate-x-1/2"
        >
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white shadow-[0_8px_24px_-4px_rgba(167,136,255,0.65)]"
            style={{
              background:
                "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
            }}
          >
            <SparkIcon size={10} color="#ffffff" />
            Most popular
          </span>
        </motion.span>
      )}

      {/* Name + tagline */}
      <div>
        <h3 className="text-2xl font-medium tracking-tight text-text">{cfg.name}</h3>
        <p className="mt-1 text-sm italic text-text-muted">{cfg.tagline}</p>
      </div>

      {/* Price */}
      <div className="mt-6">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-medium tracking-tight text-text">
            {priceLabel}
          </span>
          {cfg.priceMonthly > 0 && (
            <span className="font-mono text-xs text-text-dim">{sublabel}</span>
          )}
          {cfg.priceMonthly === 0 && (
            <span className="font-mono text-xs text-text-dim">{sublabel}</span>
          )}
        </div>
      </div>

      {/* Credit pill */}
      <div className="mt-5">
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
          style={{
            background:
              "linear-gradient(135deg, rgba(91,141,255,0.10), rgba(167,136,255,0.14))",
            border: "1px solid rgba(167,136,255,0.35)",
          }}
        >
          <SparkIcon size={12} />
          <span className="font-mono font-semibold tabular-nums text-text">
            {cfg.monthlyCredits}
          </span>
          <span className="text-text-muted">credits / month</span>
        </div>
      </div>

      <div className="my-6 h-px w-full bg-border-soft" />

      {/* Bullets */}
      <ul className="space-y-2.5 text-sm">
        {cfg.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-text">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-go" />
            <span className="leading-snug">{b}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isCurrent || isAdmin}
        className={cn(
          "mt-7 inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-medium transition-all",
          isAdmin
            ? "cursor-not-allowed border border-aurora-purple/45 bg-aurora-purple/10 text-aurora-purple"
            : highlight
              ? "text-white shadow-[0_12px_32px_-8px_rgba(91,141,255,0.6)] hover:brightness-110"
              : "border border-border-soft bg-surface/70 text-text hover:border-border-strong",
          isCurrent && !isAdmin && "cursor-not-allowed opacity-60",
        )}
        style={
          !isAdmin && highlight
            ? {
                background:
                  "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              }
            : undefined
        }
      >
        {isAdmin ? "Already unlocked" : isCurrent ? "Current plan" : ctaFor(plan)}
      </button>
    </motion.div>
  );
}

function ctaFor(plan: PlanTier): string {
  switch (plan) {
    case "starter":
      return "Get started free";
    case "pro":
      return "Start with Pro";
    case "operator":
      return "Scale with Operator";
  }
}
