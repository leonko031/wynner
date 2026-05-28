"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import {
  Flame,
  Gift,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { TransactionRow } from "@/components/credits/transaction-row";
import { SparkIcon } from "@/components/credits/spark-icon";
import { PLANS, TOPUP_PACKS, ACTION_LABELS, STREAK_BONUS_DAYS } from "@/lib/credits/config";
import {
  avgScanCost,
  daysUntilRenewal,
  monthlyUsagePct,
  planAllowsDailyFree,
  timeSinceLastFree,
  topSpendActions,
} from "@/lib/credits/helpers";
import { useCreditsStore } from "@/lib/store/credits";
import type { CreditActionType } from "@/types/credits";
import { cn } from "@/lib/utils";

type Filter = "all" | "spent" | "earned" | "month" | "year";

const PAGE_SIZE = 20;

export default function CreditsPage() {
  const state = useCreditsStore();
  const claimDailyFree = useCreditsStore((s) => s.claimDailyFree);
  const setAutoRefill = useCreditsStore((s) => s.setAutoRefill);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  const cfg = PLANS[state.plan];
  const usagePct = monthlyUsagePct(state);
  const daily = timeSinceLastFree(state.lastDailyFreeAt);
  const dailyEligible = planAllowsDailyFree(state.plan);
  const daysToRefill = daysUntilRenewal(state.planRenewsAt);

  // Streak dots — last 7 days, filled if scanned that day
  const streakDots = useMemo(
    () => Array.from({ length: STREAK_BONUS_DAYS }, (_, i) => i < state.streakDays),
    [state.streakDays],
  );

  // Transaction filter
  const filtered = useMemo(() => {
    const now = new Date();
    return state.transactions.filter((t) => {
      if (filter === "spent" && t.amount >= 0) return false;
      if (filter === "earned" && t.amount < 0) return false;
      if (filter === "month") {
        const d = new Date(t.createdAt);
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }
      if (filter === "year") {
        const d = new Date(t.createdAt);
        if (d.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    });
  }, [state.transactions, filter]);

  const reversed = useMemo(() => [...filtered].reverse(), [filtered]);
  const pageSlice = reversed.slice(0, page * PAGE_SIZE);
  const canLoadMore = pageSlice.length < reversed.length;

  // Insights
  const top = topSpendActions(state, 1)[0];
  const avg = avgScanCost(state);

  // Pack picker for auto-refill
  const selectedPack = TOPUP_PACKS.find((p) => p.id === state.autoRefillPackId) ?? TOPUP_PACKS[1];

  function handleClaimDaily() {
    const result = claimDailyFree();
    if (result.success) {
      toast.success("✨ +1 daily free scan claimed");
    } else if (result.reason === "already_claimed") {
      toast.info(`Already claimed — next one ${daily.label}`);
    } else {
      toast.info("Daily free scans are a Pro & Operator perk.", {
        description: "Upgrade to claim one each day.",
      });
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 md:py-12">
      {/* Header */}
      <header className="mb-10 max-w-3xl">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
          Account
        </div>
        <h1 className="mt-3 font-serif text-4xl font-medium leading-[1.05] tracking-[-0.02em] md:text-5xl">
          Credits
        </h1>
        <p className="mt-3 text-sm text-text-muted md:text-base">
          Your balance, your patterns, your generosity to come.
        </p>
      </header>

      {/* TOP ROW — Balance / Usage / Streak */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Balance */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-border-soft bg-surface-elevated/90 p-7 backdrop-blur-2xl"
          style={{
            boxShadow: "0 24px 60px -24px rgba(0,0,0,0.45)",
          }}
        >
          <div className="absolute inset-x-0 bottom-0 h-1">
            <div
              className="h-full w-full"
              style={{
                background:
                  "linear-gradient(90deg, #5B8DFF, #A788FF, #FF89C5)",
              }}
            />
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
            Balance
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <SparkIcon size={28} />
            <span className="font-mono text-6xl font-medium tabular-nums tracking-tight text-text md:text-7xl">
              {mounted ? (
                <CountUp end={state.balance} duration={1.2} separator="," preserveValue />
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 font-mono uppercase tracking-wider"
              style={{
                background:
                  "linear-gradient(135deg, rgba(91,141,255,0.18), rgba(167,136,255,0.22))",
                color: "var(--color-aurora-purple)",
                border: "1px solid rgba(167,136,255,0.4)",
              }}
            >
              {cfg.name} plan
            </span>
            {cfg.priceMonthly > 0 && (
              <span className="text-text-muted">
                Renews in {daysToRefill} day{daysToRefill === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </motion.div>

        {/* Usage ring */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-3xl border border-border-soft bg-surface-elevated/90 p-7 backdrop-blur-2xl"
          style={{ boxShadow: "0 24px 60px -24px rgba(0,0,0,0.45)" }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
            Usage this month
          </div>
          <div className="mt-3 flex items-center justify-center">
            <UsageRing pct={usagePct} />
          </div>
          <div className="mt-3 text-center">
            <div className="font-mono text-sm tabular-nums text-text">
              <CountUp
                end={Math.round((usagePct / 100) * state.monthlyAllowance)}
                duration={1.0}
                preserveValue
              />{" "}
              / {state.monthlyAllowance} used
            </div>
            <div className="mt-0.5 text-[11px] text-text-dim">
              of your monthly allowance
            </div>
          </div>
        </motion.div>

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-3xl border border-border-soft bg-surface-elevated/90 p-7 backdrop-blur-2xl"
          style={{ boxShadow: "0 24px 60px -24px rgba(0,0,0,0.45)" }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
            Streak
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Flame
              className={cn(
                "h-7 w-7",
                state.streakDays > 0 ? "text-aurora-peach" : "text-text-dim",
              )}
            />
            <span className="font-mono text-5xl font-medium tabular-nums tracking-tight text-text">
              {state.streakDays}
            </span>
            <span className="font-mono text-xs text-text-dim">
              day{state.streakDays === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            {state.streakDays >= STREAK_BONUS_DAYS
              ? "🎉 Bonus claimed — keep going!"
              : `${STREAK_BONUS_DAYS - state.streakDays} more for +5 credits`}
          </p>
          <div className="mt-4 flex items-center gap-1.5">
            {streakDots.map((on, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  on
                    ? "bg-aurora-peach shadow-[0_0_8px_rgba(255,176,136,0.7)]"
                    : "bg-border-strong",
                )}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* ACTIONS BAR */}
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-border-soft bg-surface/60 p-2 md:grid-cols-4">
        <Link
          href="/pricing#topups"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(91,141,255,0.55)] transition-all hover:brightness-110"
          style={{
            background:
              "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
          }}
        >
          <SparkIcon size={13} color="#ffffff" />
          Top up credits
        </Link>
        <Link
          href="/pricing"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-soft bg-surface/70 text-sm text-text transition-all hover:border-border-strong"
        >
          <TrendingUp className="h-4 w-4" />
          Upgrade plan
        </Link>
        <button
          type="button"
          onClick={handleClaimDaily}
          disabled={!dailyEligible || !daily.ready}
          className={cn(
            "inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm transition-all",
            dailyEligible && daily.ready
              ? "border-go/45 bg-go/10 text-go animate-pulse-glow"
              : "border-border-soft bg-surface/70 text-text-dim",
          )}
        >
          <Gift className="h-4 w-4" />
          {dailyEligible && daily.ready
            ? "Claim daily free"
            : dailyEligible
              ? daily.label
              : "Daily free (Pro)"}
        </button>
        <button
          type="button"
          onClick={() =>
            toast.info("Referrals coming soon", {
              description: "We'll let you know when you can invite friends.",
            })
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-soft bg-surface/70 text-sm text-text transition-all hover:border-border-strong"
        >
          <Users className="h-4 w-4" />
          Refer a friend
        </button>
      </div>

      {/* TRANSACTIONS */}
      <section className="mt-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
              Ledger
            </div>
            <h2 className="mt-2 font-serif text-2xl font-medium tracking-[-0.01em] md:text-3xl">
              Transaction history
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Every credit, accounted for.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "spent", "earned", "month", "year"] as Filter[]).map((f) => (
              <FilterChip
                key={f}
                active={filter === f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                label={
                  f === "all"
                    ? "All"
                    : f === "spent"
                      ? "Spent"
                      : f === "earned"
                        ? "Earned"
                        : f === "month"
                          ? "This month"
                          : "This year"
                }
              />
            ))}
          </div>
        </div>
        <div
          className="rounded-3xl border border-border-soft bg-surface-elevated/90 p-3 backdrop-blur-2xl"
          style={{ boxShadow: "0 24px 60px -24px rgba(0,0,0,0.45)" }}
        >
          {pageSlice.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <ul className="space-y-1">
              {pageSlice.map((tx, i) => (
                <TransactionRow key={tx.id} tx={tx} index={i} />
              ))}
            </ul>
          )}
          {canLoadMore && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex h-9 items-center justify-center rounded-full border border-border-soft bg-surface/70 px-4 text-xs text-text-muted hover:border-border-strong hover:text-text"
              >
                Load {Math.min(PAGE_SIZE, reversed.length - pageSlice.length)} more
              </button>
            </div>
          )}
        </div>
      </section>

      {/* INSIGHTS */}
      <section className="mt-12">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
          Insights
        </div>
        <h2 className="mt-2 font-serif text-2xl font-medium tracking-[-0.01em] md:text-3xl">
          Your patterns
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <InsightCard
            icon={<Sparkles className="h-4 w-4" />}
            accent="#5B8DFF"
            label="Most expensive feature"
            value={top ? ACTION_LABELS[top.type as CreditActionType] : "—"}
            sub={top ? `Used ${top.count} time${top.count === 1 ? "" : "s"} · ✦ ${top.spend}` : "Scan something to see insights"}
          />
          <InsightCard
            icon={<RefreshCw className="h-4 w-4" />}
            accent="#A788FF"
            label="Average scan cost"
            value={avg > 0 ? `✦ ${avg}` : "—"}
            sub={avg > 0 ? "Across your last scans" : "No scan history yet"}
          />
          <InsightCard
            icon={<Zap className="h-4 w-4" />}
            accent="#FF89C5"
            label="Bundle savings"
            value="Save 2 credits"
            sub="Toggle all 4 power-ups → Full Power Scan"
          />
        </div>
      </section>

      {/* AUTO-REFILL */}
      <section className="mt-12">
        <div
          className="rounded-3xl border border-border-soft bg-surface-elevated/90 p-7 backdrop-blur-2xl"
          style={{ boxShadow: "0 24px 60px -24px rgba(0,0,0,0.45)" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
                Always on
              </div>
              <h2 className="mt-2 font-serif text-2xl font-medium tracking-[-0.01em] text-text md:text-3xl">
                Auto-refill
              </h2>
              <p className="mt-2 max-w-md text-sm text-text-muted">
                When your balance drops below 10 credits, we&apos;ll automatically buy
                the pack you choose. We only charge you when needed. Cancel anytime.
              </p>
            </div>
            <Switch
              checked={state.autoRefillEnabled}
              onCheckedChange={(checked) => setAutoRefill(checked, state.autoRefillPackId)}
            />
          </div>
          {state.autoRefillEnabled && (
            <div className="mt-4">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                Pack to auto-buy
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TOPUP_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setAutoRefill(true, pack.id)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all",
                      state.autoRefillPackId === pack.id
                        ? "border-aurora-blue/60 bg-aurora-blue/10"
                        : "border-border-soft bg-surface/60 hover:border-border-strong",
                    )}
                  >
                    <span className="flex items-center gap-1 font-mono text-sm tabular-nums text-text">
                      <SparkIcon size={11} />
                      {pack.credits}
                    </span>
                    <span className="text-[11px] text-text-muted">€{pack.price}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 text-[11px] text-text-dim">
                Next auto-buy: {selectedPack.credits} credits for €{selectedPack.price}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                              */
/* -------------------------------------------------------------------------- */

function UsageRing({ pct }: { pct: number }) {
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="usage-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5B8DFF" />
            <stop offset="50%" stopColor="#A788FF" />
            <stop offset="100%" stopColor="#FF89C5" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--surface-glass-border-strong)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#usage-ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-2xl font-medium tabular-nums text-text">
          {pct}%
        </span>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs transition-all",
        active
          ? "bg-text/10 text-text"
          : "border border-border-soft bg-surface/60 text-text-muted hover:border-border-strong hover:text-text",
      )}
    >
      {label}
    </button>
  );
}

function InsightCard({
  icon,
  accent,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  accent: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      className="rounded-2xl border border-border-soft bg-surface-elevated/90 p-6 backdrop-blur-2xl"
      style={{
        boxShadow: "0 24px 60px -24px rgba(0,0,0,0.45)",
      }}
    >
      <div
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
        style={{
          backgroundColor: `${accent}1A`,
          color: accent,
          border: `1px solid ${accent}33`,
        }}
      >
        {icon}
      </div>
      <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
        {label}
      </div>
      <div className="mt-1.5 text-lg font-medium tracking-tight text-text">
        {value}
      </div>
      <div className="mt-1 text-xs text-text-muted">{sub}</div>
    </div>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(91,141,255,0.15), rgba(167,136,255,0.20), rgba(255,137,197,0.15))",
          border: "1px solid rgba(167,136,255,0.35)",
        }}
      >
        <SparkIcon size={24} />
      </div>
      <h3 className="text-base font-medium text-text">
        {filter === "all" ? "Your story starts with your first scan" : "Nothing matches that filter yet"}
      </h3>
      <p className="max-w-sm text-sm text-text-muted">
        {filter === "all"
          ? "Every scan, top-up, and bonus shows up here. Run your first scan to get started."
          : "Try a different filter or run a scan to build your history."}
      </p>
      <Link
        href="/scan"
        className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-aurora-blue/15 px-4 text-xs font-medium text-aurora-blue hover:bg-aurora-blue/20"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Run a scan
      </Link>
    </div>
  );
}
