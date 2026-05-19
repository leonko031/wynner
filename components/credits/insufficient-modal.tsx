"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarClock,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLANS } from "@/lib/credits/config";
import {
  daysUntilRenewal,
  smallestPackForShortfall,
} from "@/lib/credits/helpers";
import { useCreditsStore } from "@/lib/store/credits";
import type { PlanTier } from "@/types/credits";
import { cn } from "@/lib/utils";
import { SparkIcon } from "./spark-icon";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** How many credits the user tried to spend. */
  needed: number;
  /** Optional copy that explains what they were trying to do. */
  forAction?: string;
};

/**
 * Triggered when a user attempts an action they can't afford. The vibe is
 * "you're so close" — never a dead end. Three exit paths: top up, upgrade,
 * or wait for the monthly refill.
 */
export function InsufficientModal({ open, onOpenChange, needed, forAction }: Props) {
  const balance = useCreditsStore((s) => s.balance);
  const plan = useCreditsStore((s) => s.plan);
  const planRenewsAt = useCreditsStore((s) => s.planRenewsAt);
  const purchaseTopup = useCreditsStore((s) => s.purchaseTopup);
  const upgradePlan = useCreditsStore((s) => s.upgradePlan);

  const shortfall = Math.max(0, needed - balance);
  const pack = smallestPackForShortfall(balance, needed);
  const nextPlan: PlanTier = plan === "starter" ? "pro" : plan === "pro" ? "operator" : "operator";
  const nextPlanCfg = PLANS[nextPlan];
  const daysToRefill = daysUntilRenewal(planRenewsAt);

  /** Dev-mode "buy" — just grant credits locally so the demo loops cleanly. */
  function handleTopUp() {
    purchaseTopup(pack.id);
    onOpenChange(false);
  }
  function handleUpgrade() {
    upgradePlan(nextPlan);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass-strong max-w-2xl rounded-3xl border-0 p-0 shadow-[0_40px_80px_-20px_rgba(91,141,255,0.45)]"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(91,141,255,0.20), rgba(167,136,255,0.25), rgba(255,137,197,0.20))",
                border: "1px solid rgba(167,136,255,0.45)",
              }}
            >
              <SparkIcon size={20} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-medium tracking-tight text-text">
                You need {shortfall} more credit{shortfall === 1 ? "" : "s"}
              </DialogTitle>
              <p className="mt-1 text-sm text-text-muted">
                {forAction
                  ? `You're so close to ${forAction.toLowerCase()}. Pick what works for you:`
                  : "You're so close to the answer. Pick what works for you:"}
              </p>
            </div>
          </div>

          {/* Three options */}
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Option
              icon={<Sparkles className="h-4 w-4" />}
              accent="#5B8DFF"
              title="Top up now"
              subtitle={`${pack.credits} credits for €${pack.price}`}
              cta="Buy credits"
              onAction={handleTopUp}
              recommended
            />
            <Option
              icon={<TrendingUp className="h-4 w-4" />}
              accent="#A788FF"
              title="Upgrade plan"
              subtitle={`${nextPlanCfg.name} → ${nextPlanCfg.monthlyCredits} credits / mo`}
              cta={`€${nextPlanCfg.priceMonthly} / mo`}
              onAction={handleUpgrade}
            />
            <Option
              icon={<CalendarClock className="h-4 w-4" />}
              accent="#FF89C5"
              title="Wait for refill"
              subtitle={
                PLANS[plan].monthlyCredits > 0
                  ? `${daysToRefill} day${daysToRefill === 1 ? "" : "s"} away`
                  : "No monthly refill on free tier"
              }
              cta="OK, I'll wait"
              onAction={() => onOpenChange(false)}
            />
          </div>

          {/* Maybe later */}
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-xs text-text-muted underline-offset-2 hover:text-text hover:underline"
            >
              Maybe later
            </button>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text"
            >
              See all options
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Option({
  icon,
  accent,
  title,
  subtitle,
  cta,
  onAction,
  recommended,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  subtitle: string;
  cta: string;
  onAction: () => void;
  recommended?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      onClick={onAction}
      className={cn(
        "glass group relative flex flex-col items-start gap-3 rounded-2xl p-4 text-left transition-all",
        recommended && "ring-1 ring-aurora-blue/50",
      )}
      style={{
        boxShadow: recommended
          ? `0 12px 36px -10px ${accent}55, inset 0 1px 0 0 var(--surface-glass-highlight)`
          : undefined,
      }}
    >
      {recommended && (
        <span
          className="absolute -top-2 left-3 inline-flex items-center rounded-full bg-aurora-blue px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white shadow-[0_0_12px_rgba(91,141,255,0.7)]"
        >
          Recommended
        </span>
      )}
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${accent}1A`,
          color: accent,
          border: `1px solid ${accent}33`,
        }}
      >
        {icon}
      </span>
      <div>
        <div className="text-sm font-medium text-text">{title}</div>
        <div className="mt-0.5 text-xs text-text-muted">{subtitle}</div>
      </div>
      <span
        className="mt-auto inline-flex items-center gap-1 text-xs font-medium transition-all"
        style={{ color: accent }}
      >
        {cta}
        <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </motion.button>
  );
}
