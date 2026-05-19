"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import {
  ACTION_LABELS,
  CREDIT_COSTS,
  PLANS,
  STREAK_BONUS_AMOUNT,
  STREAK_BONUS_DAYS,
  TOPUP_PACKS,
} from "@/lib/credits/config";
import {
  calculateScanCost,
  daysAgoISO,
  todayISO,
} from "@/lib/credits/helpers";
import type {
  CreditActionType,
  CreditTransaction,
  PlanTier,
  ScanPowerUps,
  UserCreditState,
} from "@/types/credits";

// Re-export for consumer ergonomics
export type { ScanPowerUps } from "@/types/credits";

type SpendResult =
  | { success: true; newBalance: number; transaction: CreditTransaction }
  | { success: false; reason: "insufficient"; needed: number; balance: number };

type CreditsActions = {
  /** Spend `cost` credits on `action`. */
  spend: (
    action: CreditActionType,
    options?: { productId?: string; cost?: number; description?: string },
  ) => SpendResult;

  /** Grant `amount` credits — used for refills, streaks, top-ups, gifts. */
  grant: (
    amount: number,
    type: CreditActionType,
    description?: string,
  ) => CreditTransaction;

  /** Can the user afford `action` (with optional explicit cost override)? */
  canAfford: (action: CreditActionType, cost?: number) => boolean;

  /** Lookup the credit cost for an action. */
  getCostFor: (action: CreditActionType) => number;

  /** Compute the cost of a scan with the given power-ups (uses bundle logic). */
  getScanCost: (powerUps: ScanPowerUps) => number;

  /** Upgrade or downgrade the plan and refill credits to the new allowance. */
  upgradePlan: (newPlan: PlanTier) => void;

  /** Apply a top-up purchase (grants credits, records transaction). */
  purchaseTopup: (packId: string) => { success: boolean; credits?: number };

  /** Claim today's daily free scan (paid plans only). Returns whether it was granted. */
  claimDailyFree: () => { success: boolean; reason?: "already_claimed" | "not_eligible" };

  /** Record a scan day for streak tracking; grants the bonus on the Nth consecutive day. */
  noteScanDay: () => { bonusGranted: boolean; streakDays: number };

  /** Monthly refill — typically called by cron. Respects rollover cap. */
  monthlyRefill: () => void;

  /** Set auto-refill prefs. */
  setAutoRefill: (enabled: boolean, packId?: string) => void;

  /** Hard reset used by /settings "Erase all data". */
  resetCredits: () => void;
};

type Store = UserCreditState & CreditsActions;

/* -------------------------------------------------------------------------- */
/* Defaults — first-time users land on Pro with a generous starter balance.   */
/* This is a personal/dev app; in production wire this to your auth provider. */
/* -------------------------------------------------------------------------- */

function defaultRenewsAt(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

const DEFAULT_PLAN: PlanTier = "pro";

const INITIAL_TX: CreditTransaction = {
  id: nanoid(10),
  type: "monthly_refill",
  amount: PLANS[DEFAULT_PLAN].monthlyCredits,
  balanceAfter: PLANS[DEFAULT_PLAN].monthlyCredits,
  description: `${PLANS[DEFAULT_PLAN].name} plan — first month`,
  createdAt: new Date().toISOString(),
};

const DEFAULT_STATE: UserCreditState = {
  balance: PLANS[DEFAULT_PLAN].monthlyCredits,
  monthlyAllowance: PLANS[DEFAULT_PLAN].monthlyCredits,
  rolloverCap: PLANS[DEFAULT_PLAN].rolloverCap,
  plan: DEFAULT_PLAN,
  planRenewsAt: defaultRenewsAt(),
  streakDays: 0,
  lastDailyFreeAt: null,
  lastScanDay: null,
  transactions: [INITIAL_TX],
  autoRefillEnabled: false,
  autoRefillPackId: "medium",
  isAdmin: false,
};

/* -------------------------------------------------------------------------- */
/* Persistence — same pattern as preferences.ts (no Set handling needed).     */
/* -------------------------------------------------------------------------- */

type Persisted = UserCreditState;

const storage: PersistStorage<Persisted> = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(name);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StorageValue<Persisted>;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
  },
};

/* -------------------------------------------------------------------------- */
/* Pulse event — lets the CreditPill animate ±n floats on spend/grant.        */
/* -------------------------------------------------------------------------- */

export type CreditPulseDetail = {
  amount: number;
  reason: string;
  txId: string;
};

export const CREDIT_PULSE_EVENT = "wynner:credit-pulse";

function emitPulse(detail: CreditPulseDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CreditPulseDetail>(CREDIT_PULSE_EVENT, { detail }));
}

/* -------------------------------------------------------------------------- */
/* Store                                                                       */
/* -------------------------------------------------------------------------- */

export const useCreditsStore = create<Store>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      getCostFor: (action) => {
        return (CREDIT_COSTS as Record<string, number>)[action] ?? 0;
      },

      getScanCost: (powerUps) => calculateScanCost(powerUps),

      canAfford: (action, cost) => {
        // Admins always afford everything. Spend is still tracked so they
        // can see their own usage analytics, but never gated.
        if (get().isAdmin) return true;
        const c = cost ?? (CREDIT_COSTS as Record<string, number>)[action] ?? 0;
        return get().balance >= c;
      },

      spend: (action, options) => {
        const cost = options?.cost ?? (CREDIT_COSTS as Record<string, number>)[action] ?? 0;
        const state = get();

        // Admin path — log the transaction at the actual cost so usage
        // analytics still work, but DON'T decrement the balance. Reported
        // newBalance is Infinity for UI consumers that want it.
        if (state.isAdmin) {
          const tx: CreditTransaction = {
            id: nanoid(10),
            type: action,
            amount: -cost,
            balanceAfter: state.balance, // unchanged
            productId: options?.productId,
            description: options?.description ?? ACTION_LABELS[action],
            createdAt: new Date().toISOString(),
          };
          set({ transactions: [...state.transactions, tx] });
          emitPulse({ amount: -cost, reason: tx.description, txId: tx.id });
          return { success: true, newBalance: Infinity, transaction: tx };
        }

        if (state.balance < cost) {
          return {
            success: false,
            reason: "insufficient",
            needed: cost,
            balance: state.balance,
          };
        }
        const newBalance = state.balance - cost;
        const tx: CreditTransaction = {
          id: nanoid(10),
          type: action,
          amount: -cost,
          balanceAfter: newBalance,
          productId: options?.productId,
          description: options?.description ?? ACTION_LABELS[action],
          createdAt: new Date().toISOString(),
        };
        set({
          balance: newBalance,
          transactions: [...state.transactions, tx],
        });
        emitPulse({ amount: -cost, reason: tx.description, txId: tx.id });
        return { success: true, newBalance, transaction: tx };
      },

      grant: (amount, type, description) => {
        const state = get();
        const newBalance = state.balance + Math.max(0, Math.floor(amount));
        const tx: CreditTransaction = {
          id: nanoid(10),
          type,
          amount: Math.max(0, Math.floor(amount)),
          balanceAfter: newBalance,
          description: description ?? ACTION_LABELS[type],
          createdAt: new Date().toISOString(),
        };
        set({
          balance: newBalance,
          transactions: [...state.transactions, tx],
        });
        emitPulse({ amount: tx.amount, reason: tx.description, txId: tx.id });
        return tx;
      },

      upgradePlan: (newPlan) => {
        const cfg = PLANS[newPlan];
        const state = get();
        // Top up to the new monthly allowance (do not subtract; users keep what they have)
        const topUp = Math.max(0, cfg.monthlyCredits - state.balance);
        const newBalance = state.balance + topUp;
        const tx: CreditTransaction = {
          id: nanoid(10),
          type: "monthly_refill",
          amount: topUp,
          balanceAfter: newBalance,
          description: `Upgraded to ${cfg.name} — ${cfg.monthlyCredits} credits topped up`,
          createdAt: new Date().toISOString(),
        };
        set({
          plan: newPlan,
          monthlyAllowance: cfg.monthlyCredits,
          rolloverCap: cfg.rolloverCap,
          balance: newBalance,
          planRenewsAt: defaultRenewsAt(),
          transactions: topUp > 0 ? [...state.transactions, tx] : state.transactions,
        });
        if (topUp > 0) emitPulse({ amount: topUp, reason: tx.description, txId: tx.id });
      },

      purchaseTopup: (packId) => {
        const pack = TOPUP_PACKS.find((p) => p.id === packId);
        if (!pack) return { success: false };
        const state = get();
        const newBalance = state.balance + pack.credits;
        const tx: CreditTransaction = {
          id: nanoid(10),
          type: "topup_purchase",
          amount: pack.credits,
          balanceAfter: newBalance,
          description: `Top-up — ${pack.credits} credits (€${pack.price})`,
          createdAt: new Date().toISOString(),
        };
        set({
          balance: newBalance,
          transactions: [...state.transactions, tx],
        });
        emitPulse({ amount: pack.credits, reason: tx.description, txId: tx.id });
        return { success: true, credits: pack.credits };
      },

      claimDailyFree: () => {
        const state = get();
        if (!PLANS[state.plan].features.dailyFreeScan) {
          return { success: false, reason: "not_eligible" };
        }
        const today = todayISO();
        if (state.lastDailyFreeAt === today) {
          return { success: false, reason: "already_claimed" };
        }
        const newBalance = state.balance + 1;
        const tx: CreditTransaction = {
          id: nanoid(10),
          type: "daily_free",
          amount: 1,
          balanceAfter: newBalance,
          description: "Daily free scan claimed",
          createdAt: new Date().toISOString(),
        };
        set({
          balance: newBalance,
          lastDailyFreeAt: today,
          transactions: [...state.transactions, tx],
        });
        emitPulse({ amount: 1, reason: tx.description, txId: tx.id });
        return { success: true };
      },

      noteScanDay: () => {
        const state = get();
        const today = todayISO();
        const yesterday = daysAgoISO(1);
        if (state.lastScanDay === today) {
          return { bonusGranted: false, streakDays: state.streakDays };
        }
        const continuing = state.lastScanDay === yesterday;
        const nextStreak = continuing ? state.streakDays + 1 : 1;
        let updates: Partial<UserCreditState> = {
          lastScanDay: today,
          streakDays: nextStreak,
        };
        let bonusGranted = false;
        if (nextStreak > 0 && nextStreak % STREAK_BONUS_DAYS === 0) {
          // Grant streak bonus
          const newBalance = state.balance + STREAK_BONUS_AMOUNT;
          const tx: CreditTransaction = {
            id: nanoid(10),
            type: "streak_bonus",
            amount: STREAK_BONUS_AMOUNT,
            balanceAfter: newBalance,
            description: `${STREAK_BONUS_DAYS}-day streak bonus`,
            createdAt: new Date().toISOString(),
          };
          updates = {
            ...updates,
            balance: newBalance,
            transactions: [...state.transactions, tx],
          };
          emitPulse({ amount: STREAK_BONUS_AMOUNT, reason: tx.description, txId: tx.id });
          bonusGranted = true;
        }
        set(updates);
        return { bonusGranted, streakDays: nextStreak };
      },

      monthlyRefill: () => {
        const state = get();
        const cfg = PLANS[state.plan];
        // Capped rollover: balance carries up to rolloverCap, then we top with the monthly amount
        const carried = Math.min(state.balance, cfg.rolloverCap);
        const newBalance = carried + cfg.monthlyCredits;
        const tx: CreditTransaction = {
          id: nanoid(10),
          type: "monthly_refill",
          amount: cfg.monthlyCredits,
          balanceAfter: newBalance,
          description: `Monthly refill — ${cfg.name} plan`,
          createdAt: new Date().toISOString(),
        };
        set({
          balance: newBalance,
          planRenewsAt: defaultRenewsAt(),
          transactions: [...state.transactions, tx],
        });
        emitPulse({ amount: cfg.monthlyCredits, reason: tx.description, txId: tx.id });
      },

      setAutoRefill: (enabled, packId) => {
        set((s) => ({
          autoRefillEnabled: enabled,
          autoRefillPackId: packId ?? s.autoRefillPackId,
        }));
      },

      resetCredits: () => {
        set({ ...DEFAULT_STATE, transactions: [INITIAL_TX] });
      },
    }),
    {
      name: "wynner.credits.v1",
      storage,
      partialize: (s): UserCreditState =>
        // Pick only state fields — actions stay in memory.
        ({
          balance: s.balance,
          monthlyAllowance: s.monthlyAllowance,
          rolloverCap: s.rolloverCap,
          plan: s.plan,
          planRenewsAt: s.planRenewsAt,
          streakDays: s.streakDays,
          lastDailyFreeAt: s.lastDailyFreeAt,
          lastScanDay: s.lastScanDay,
          transactions: s.transactions,
          autoRefillEnabled: s.autoRefillEnabled,
          autoRefillPackId: s.autoRefillPackId,
          // We deliberately DON'T persist `isAdmin` — it's sourced from the
          // server profile every session, so cached localStorage can't be
          // tampered with to grant admin privileges. Re-hydrated on auth load.
          isAdmin: false,
        }),
    },
  ),
);

/* -------------------------------------------------------------------------- */
/* Selectors                                                                   */
/* -------------------------------------------------------------------------- */

export const selectBalance = (s: Store) => s.balance;
export const selectPlan = (s: Store) => s.plan;
export const selectTransactions = (s: Store) => s.transactions;
