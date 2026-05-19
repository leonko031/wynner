"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Crown, Flame, Gift, Shield, Sparkles } from "lucide-react";
import { PLANS, ACTION_LABELS } from "@/lib/credits/config";
import {
  daysUntilRenewal,
  formatBalance,
  monthlyUsagePct,
  timeSinceLastFree,
  planAllowsDailyFree,
} from "@/lib/credits/helpers";
import { useCreditsStore } from "@/lib/store/credits";
import { cn } from "@/lib/utils";
import { SparkIcon } from "./spark-icon";

export function CreditPopover() {
  const state = useCreditsStore();
  const cfg = PLANS[state.plan];
  const daysLeft = daysUntilRenewal(state.planRenewsAt);
  const usagePct = monthlyUsagePct(state);
  const daily = timeSinceLastFree(state.lastDailyFreeAt);
  const recent = state.transactions.slice(-3).reverse();
  const isAdmin = state.isAdmin;

  return (
    <div className="space-y-4 p-5">
      {/* Header: balance + plan + renewal */}
      <div>
        <div className="flex items-baseline gap-2">
          {isAdmin ? (
            <Crown
              aria-hidden
              className="h-5 w-5"
              style={{
                background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                WebkitMask: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M2 4l5 6 5-8 5 8 5-6-1.5 13H3.5L2 4z'/></svg>\") center / contain no-repeat",
                mask: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M2 4l5 6 5-8 5 8 5-6-1.5 13H3.5L2 4z'/></svg>\") center / contain no-repeat",
              }}
            />
          ) : (
            <SparkIcon size={20} />
          )}
          <span
            className={cn(
              "tracking-tight text-text",
              isAdmin
                ? "font-serif text-4xl font-medium leading-none"
                : "font-mono text-3xl font-semibold tabular-nums",
            )}
          >
            {formatBalance(state.balance, isAdmin)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            credits
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          {isAdmin ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono uppercase tracking-wider"
              style={{
                background:
                  "linear-gradient(135deg, rgba(91,141,255,0.18), rgba(167,136,255,0.22), rgba(255,137,197,0.18))",
                color: "var(--color-aurora-purple)",
                border: "1px solid rgba(167,136,255,0.45)",
              }}
            >
              <Shield className="h-2.5 w-2.5" />
              Admin access
            </span>
          ) : (
            <>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 font-mono uppercase tracking-wider"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(91,141,255,0.15), rgba(167,136,255,0.20))",
                  color: "var(--color-aurora-purple)",
                  border: "1px solid rgba(167,136,255,0.40)",
                }}
              >
                {cfg.name} plan
              </span>
              {cfg.priceMonthly > 0 && (
                <span className="text-text-muted">
                  Renews in {daysLeft} day{daysLeft === 1 ? "" : "s"}
                </span>
              )}
              {cfg.priceMonthly === 0 && (
                <span className="text-text-muted">Free tier</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Usage progress — hidden for admins (not relevant) */}
      {!isAdmin && (
        <div>
          <div className="flex items-center justify-between text-[11px] text-text-dim">
            <span className="font-mono uppercase tracking-wider">This month</span>
            <span className="font-mono tabular-nums">{usagePct}% used</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${usagePct}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background:
                  "linear-gradient(90deg, #5B8DFF, #A788FF, #FF89C5)",
                boxShadow: "0 0 8px rgba(167,136,255,0.55)",
              }}
            />
          </div>
        </div>
      )}

      {/* Quick stats row — admins see a single "all features unlocked" line */}
      {isAdmin ? (
        <div
          className="rounded-xl border border-aurora-purple/35 bg-aurora-purple/10 px-3 py-2.5 text-xs text-text"
        >
          Admin · all features unlocked. Scans, research, and exports never charge you.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Stat
            icon={<Sparkles className="h-3 w-3" />}
            label="Spent"
            value={state.transactions
              .filter((t) => t.amount < 0)
              .reduce((s, t) => s + Math.abs(t.amount), 0)}
          />
          <Stat
            icon={<Flame className="h-3 w-3 text-aurora-peach" />}
            label="Streak"
            value={state.streakDays}
            suffix={state.streakDays === 1 ? " day" : " days"}
          />
          <Stat
            icon={<Gift className="h-3 w-3 text-go" />}
            label="Daily"
            textValue={daily.ready ? "ready" : daily.label}
            highlight={daily.ready && planAllowsDailyFree(state.plan)}
          />
        </div>
      )}

      {/* CTAs — admins get a single "View admin panel" button instead */}
      {isAdmin ? (
        <Link
          href="/admin"
          className="group flex h-9 w-full items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium text-white shadow-[0_8px_24px_-8px_rgba(167,136,255,0.6)] transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)" }}
        >
          <Shield className="h-3 w-3" />
          View admin panel
          <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/pricing#topups"
            className="group flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium text-white shadow-[0_8px_24px_-8px_rgba(91,141,255,0.7)] transition-all hover:brightness-110"
            style={{
              background:
                "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
            }}
          >
            <SparkIcon size={12} color="#ffffff" />
            Top up credits
          </Link>
          <Link
            href="/pricing"
            className="flex h-9 items-center justify-center rounded-full border border-border-soft bg-surface px-3 text-xs font-medium text-text-muted transition-all hover:border-border-strong hover:text-text"
          >
            Upgrade
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-text-dim">
          <span className="font-mono uppercase tracking-wider">Recent</span>
          <Link
            href="/credits"
            className="text-text-muted underline-offset-2 hover:text-text hover:underline"
          >
            View all
          </Link>
        </div>
        <ul className="mt-2 space-y-1">
          {recent.length === 0 && (
            <li className="text-xs text-text-dim">No activity yet.</li>
          )}
          {recent.map((t) => {
            const positive = t.amount > 0;
            return (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="truncate text-text">
                  {t.description || ACTION_LABELS[t.type]}
                </span>
                <span
                  className={cn(
                    "font-mono tabular-nums",
                    positive ? "text-go" : "text-text-muted",
                  )}
                >
                  {positive ? "+" : ""}
                  {t.amount}
                </span>
              </li>
            );
          })}
        </ul>
        {isAdmin && (
          <p className="mt-3 text-[10px] leading-snug text-text-dim">
            Admin access · all credit costs are tracked but not charged.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  textValue,
  suffix,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  textValue?: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-soft bg-surface/60 p-2",
        highlight && "ring-1 ring-go/50",
      )}
    >
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-dim">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 font-mono text-sm tabular-nums text-text">
        {textValue ?? (
          <>
            {value}
            {suffix}
          </>
        )}
      </div>
    </div>
  );
}
