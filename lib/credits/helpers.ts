import {
  CREDIT_COSTS,
  LOW_BALANCE_THRESHOLD,
  PLANS,
  TOPUP_PACKS,
} from "@/lib/credits/config";
import type {
  CreditActionType,
  PlanTier,
  ScanPowerUps,
  UserCreditState,
} from "@/types/credits";

/**
 * Compute the credit cost of a scan given which power-ups are enabled.
 * If all four power-ups are on, swap to the Full Power Scan bundle which
 * is intentionally cheaper than the sum (the discount is the "bundle" sell).
 */
export function calculateScanCost(powerUps: ScanPowerUps): number {
  const sum =
    CREDIT_COSTS.basic_scan +
    (powerUps.urlScrape ? CREDIT_COSTS.url_scrape : 0) +
    (powerUps.redditVoice ? CREDIT_COSTS.reddit_voice : 0) +
    (powerUps.metaAds ? CREDIT_COSTS.meta_ads : 0) +
    (powerUps.tiktokTrends ? CREDIT_COSTS.tiktok_trends : 0);

  // If user enabled everything we'd normally bundle, bill at bundle price IF cheaper
  const allOn =
    powerUps.urlScrape &&
    powerUps.redditVoice &&
    powerUps.metaAds &&
    powerUps.tiktokTrends;
  if (allOn) return Math.min(sum, CREDIT_COSTS.full_power_scan);
  return sum;
}

/** When all 4 power-ups are on, returns the dollars-saved vs à la carte. */
export function bundleSavings(powerUps: ScanPowerUps): number {
  const allOn =
    powerUps.urlScrape &&
    powerUps.redditVoice &&
    powerUps.metaAds &&
    powerUps.tiktokTrends;
  if (!allOn) return 0;
  const alaCarte =
    CREDIT_COSTS.basic_scan +
    CREDIT_COSTS.url_scrape +
    CREDIT_COSTS.reddit_voice +
    CREDIT_COSTS.meta_ads +
    CREDIT_COSTS.tiktok_trends;
  return Math.max(0, alaCarte - CREDIT_COSTS.full_power_scan);
}

/** Each row of the scan-cost breakdown popover. */
export type CostBreakdownRow = {
  label: string;
  amount: number;
  highlight?: "bundle" | "savings";
};

export function scanCostBreakdown(powerUps: ScanPowerUps): CostBreakdownRow[] {
  const allOn =
    powerUps.urlScrape &&
    powerUps.redditVoice &&
    powerUps.metaAds &&
    powerUps.tiktokTrends;

  if (allOn) {
    return [
      { label: "Full Power Scan", amount: CREDIT_COSTS.full_power_scan, highlight: "bundle" },
      { label: `Saves ${bundleSavings(powerUps)} credits`, amount: 0, highlight: "savings" },
    ];
  }

  const rows: CostBreakdownRow[] = [
    { label: "Base scan", amount: CREDIT_COSTS.basic_scan },
  ];
  if (powerUps.urlScrape) rows.push({ label: "+ URL scrape", amount: CREDIT_COSTS.url_scrape });
  if (powerUps.redditVoice) rows.push({ label: "+ Reddit voice", amount: CREDIT_COSTS.reddit_voice });
  if (powerUps.metaAds) rows.push({ label: "+ Meta Ad Library", amount: CREDIT_COSTS.meta_ads });
  if (powerUps.tiktokTrends) rows.push({ label: "+ TikTok trends", amount: CREDIT_COSTS.tiktok_trends });
  return rows;
}

/** Formats a credit balance for display with thousand separators. */
export function formatCredits(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.max(0, Math.floor(n)));
}

/**
 * Render a balance for display. Admins always see the infinity glyph; everyone
 * else gets the standard thousand-separated number. Keeps the swap in one
 * place so UI components don't litter is-admin checks everywhere.
 */
export function formatBalance(balance: number, isAdmin: boolean): string {
  if (isAdmin) return "∞";
  return formatCredits(balance);
}

/** Returns "ready" or "Xh ago" / "Xd ago" for the daily-free claim cooldown. */
export function timeSinceLastFree(lastDailyFreeAt: string | null): {
  ready: boolean;
  label: string;
} {
  if (!lastDailyFreeAt) return { ready: true, label: "ready" };
  const today = todayISO();
  if (lastDailyFreeAt === today) {
    // Already claimed today — show time until tomorrow
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const diffMs = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return { ready: false, label: `in ${hours}h ${mins}m` };
    return { ready: false, label: `in ${mins}m` };
  }
  return { ready: true, label: "ready" };
}

/** YYYY-MM-DD in local time — used as a streak/claim day key. */
export function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Returns the YYYY-MM-DD that's `days` days before today. */
export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Returns days until plan renews (or 0 if past/today). */
export function daysUntilRenewal(planRenewsAt: string): number {
  const renew = new Date(planRenewsAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((renew - now) / (1000 * 60 * 60 * 24)));
}

/**
 * The smallest top-up pack that can cover the shortfall after the user's
 * current balance. Useful for the "Insufficient Credits" modal CTA.
 */
export function smallestPackForShortfall(currentBalance: number, needed: number) {
  const shortfall = Math.max(1, needed - currentBalance);
  for (const pack of TOPUP_PACKS) {
    if (pack.credits >= shortfall) return pack;
  }
  // Always at least the mega pack
  return TOPUP_PACKS[TOPUP_PACKS.length - 1];
}

/** Whether the user's balance is low enough to trigger the warning pulse. */
export function isLowBalance(state: Pick<UserCreditState, "balance" | "plan">): boolean {
  return state.balance < LOW_BALANCE_THRESHOLD[state.plan];
}

/** Whether a paid plan allows the daily free claim. */
export function planAllowsDailyFree(plan: PlanTier): boolean {
  return PLANS[plan].features.dailyFreeScan === true;
}

/** Computes percentage of monthly allowance consumed this cycle. */
export function monthlyUsagePct(state: UserCreditState): number {
  if (state.monthlyAllowance === 0) return 0;
  // Sum negative transactions (spends) since last refill.
  // We approximate "since last refill" as the most-recent monthly_refill tx
  // or the first transaction if none exists.
  const lastRefillIdx = [...state.transactions]
    .reverse()
    .findIndex((t) => t.type === "monthly_refill" || t.type === "topup_purchase");
  const sliceFrom =
    lastRefillIdx === -1
      ? 0
      : state.transactions.length - 1 - lastRefillIdx + 1;
  const spentSinceRefill = state.transactions
    .slice(sliceFrom)
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  return Math.min(100, Math.round((spentSinceRefill / state.monthlyAllowance) * 100));
}

/**
 * Top action by spend count — used in the "Your patterns" insights widget.
 */
export function topSpendActions(state: UserCreditState, limit = 3) {
  const counts = new Map<CreditActionType, { count: number; spend: number }>();
  for (const t of state.transactions) {
    if (t.amount >= 0) continue;
    const prev = counts.get(t.type) ?? { count: 0, spend: 0 };
    counts.set(t.type, { count: prev.count + 1, spend: prev.spend + Math.abs(t.amount) });
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].spend - a[1].spend)
    .slice(0, limit)
    .map(([type, agg]) => ({ type, ...agg }));
}

/** Average credit cost of completed scans this cycle. */
export function avgScanCost(state: UserCreditState): number {
  const scanLikeTypes: CreditActionType[] = [
    "basic_scan",
    "full_power_scan",
    "url_scrape",
    "reddit_voice",
    "meta_ads",
    "tiktok_trends",
  ];
  const txs = state.transactions.filter(
    (t) => t.amount < 0 && scanLikeTypes.includes(t.type),
  );
  if (txs.length === 0) return 0;
  const sum = txs.reduce((s, t) => s + Math.abs(t.amount), 0);
  return Math.round((sum / txs.length) * 10) / 10;
}

/**
 * Map an action type to a lucide icon name. Kept here so components can stay
 * presentation-only.
 */
export const ACTION_ICON_NAME: Record<CreditActionType, string> = {
  basic_scan: "Sparkles",
  url_scrape: "Link2",
  reddit_voice: "MessageSquareQuote",
  meta_ads: "Megaphone",
  tiktok_trends: "TrendingUp",
  country_compare: "Globe2",
  full_power_scan: "Zap",
  re_score: "RefreshCw",
  streak_bonus: "Flame",
  referral_bonus: "Users",
  daily_free: "Gift",
  topup_purchase: "PlusCircle",
  monthly_refill: "Recycle",
  gift_received: "Gift",
  gift_sent: "Send",
};
