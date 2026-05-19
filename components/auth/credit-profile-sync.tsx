"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@/lib/auth/use-user";
import { useCreditsStore } from "@/lib/store/credits";

/**
 * Mounted once near the root. On first paint after a user signs in, mirrors
 * their `profile.credit_balance` (server source of truth) into the local
 * Zustand store so the UI shows the right balance immediately.
 *
 * Ongoing spend/grant operations stay in the local store for now — full
 * server round-trips are scheduled for the products-store migration, where
 * row-level locking matters. The local store is hydrated again on every
 * sign-in so balances stay roughly aligned.
 */
export function CreditProfileSync() {
  const { profile, user } = useUser();
  const synced = useRef<string | null>(null);

  useEffect(() => {
    if (!profile || !user) return;
    // We re-sync any time the profile.is_admin changes (even on the same
    // user) — admin status can flip without a sign-out (admin email removed
    // and the 60s server sync triggers).
    const key = `${user.id}:${profile.is_admin}`;
    if (synced.current === key) return;
    synced.current = key;

    useCreditsStore.setState({
      balance: profile.credit_balance,
      plan: profile.plan,
      monthlyAllowance: profile.monthly_credits,
      rolloverCap: profile.rollover_cap,
      planRenewsAt: profile.plan_renews_at ?? new Date().toISOString(),
      streakDays: profile.streak_days ?? 0,
      lastDailyFreeAt: profile.last_daily_free_at,
      lastScanDay: profile.last_scan_at,
      isAdmin: profile.is_admin === true,
    });
  }, [profile, user]);

  // Reset the sync marker when the user signs out — and explicitly clear
  // the admin flag so the next paint reverts to the non-admin UI.
  useEffect(() => {
    if (!user) {
      synced.current = null;
      useCreditsStore.setState({ isAdmin: false });
    }
  }, [user]);

  return null;
}
