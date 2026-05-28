/**
 * Credits system — types
 *
 * The credit ledger is append-only: every spend or grant is a transaction with
 * an immutable balanceAfter. The current balance is the latest balanceAfter,
 * which we also cache on UserCreditState.balance for fast reads.
 */

export type PlanTier = "starter" | "pro" | "operator" | "agency";

export type CreditActionType =
  | "basic_scan"
  | "url_scrape"
  | "reddit_voice"
  | "meta_ads"
  | "tiktok_trends"
  | "country_compare"
  | "full_power_scan"
  | "re_score"
  | "streak_bonus"
  | "referral_bonus"
  | "daily_free"
  | "topup_purchase"
  | "monthly_refill"
  | "gift_received"
  | "gift_sent";

export interface CreditTransaction {
  id: string;
  type: CreditActionType;
  /** Negative for spend, positive for grant. */
  amount: number;
  balanceAfter: number;
  productId?: string;
  description: string;
  createdAt: string;
}

export interface UserCreditState {
  balance: number;
  monthlyAllowance: number;
  rolloverCap: number;
  plan: PlanTier;
  planRenewsAt: string;
  streakDays: number;
  /** ISO date (YYYY-MM-DD) of the most recent daily-free claim. */
  lastDailyFreeAt: string | null;
  /** ISO date (YYYY-MM-DD) of the most recent scan — used to extend streak. */
  lastScanDay: string | null;
  transactions: CreditTransaction[];
  /** Whether auto-refill is enabled, and which top-up pack to auto-buy. */
  autoRefillEnabled: boolean;
  autoRefillPackId: string;
  /**
   * Admin flag mirrored from `profiles.is_admin` (server source of truth).
   * When true the UI shows ∞ and `spend()` never decrements the balance.
   * Always false in unauthenticated / demo mode.
   */
  isAdmin: boolean;
}

export type BillingInterval = "monthly" | "yearly";

export type ScanPowerUps = {
  urlScrape: boolean;
  redditVoice: boolean;
  metaAds: boolean;
  tiktokTrends: boolean;
};

export const EMPTY_POWERUPS: ScanPowerUps = {
  urlScrape: false,
  redditVoice: false,
  metaAds: false,
  tiktokTrends: false,
};
