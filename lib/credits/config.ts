import type { CreditActionType, PlanTier } from "@/types/credits";

/**
 * Per-action credit costs. Spend actions are stored as positive integers here;
 * the store negates them when creating the transaction.
 *
 * Calibrated against real Gemini API cost (Flash + Pro tokens + grounded
 * search queries). 1 credit ≈ $0.08 cost at avg usage. See docs/PRICING.md
 * for the full unit-economics breakdown.
 */
export const CREDIT_COSTS = {
  basic_scan: 1,
  url_scrape: 2,
  reddit_voice: 3,
  meta_ads: 2,
  tiktok_trends: 1,
  country_compare: 4,
  /** Bundle — saves vs à la carte (basic + all 4 power-ups = 1+2+3+2+1 = 9, but bundled at 11 includes premium signals). */
  full_power_scan: 11,
  re_score: 1,
} as const satisfies Partial<Record<CreditActionType, number>>;

export type PlanConfig = {
  id: PlanTier;
  name: string;
  tagline: string;
  /** Price in EUR — converted to whole cents for Stripe. */
  priceMonthly: number;
  /** Yearly: 10 months for the price of 12 (2 months free). */
  priceYearly: number;
  monthlyCredits: number;
  /** Max credits that can carry over month-to-month. 0 = no rollover. */
  rolloverCap: number;
  /** null = unlimited. */
  vaultLimit: number | null;
  features: {
    scrapers: boolean;
    voiceMining: boolean;
    comparison: boolean;
    watermark: boolean;
    seats: number;
    dailyFreeScan?: boolean;
    apiAccess?: boolean;
    customBranding?: boolean;
    priorityQueue?: boolean;
    prioritySupport?: boolean;
    /** Agency-only: white-label PDFs with client logo + workspaces. */
    whiteLabel?: boolean;
    /** Agency-only: dedicated Slack channel for fast support. */
    slackSupport?: boolean;
  };
  bullets: string[];
};

/**
 * Pricing v2 (2026 launch). See docs/PRICING.md for competitor benchmarks
 * and the unit-economics model. The headline rule: every paid tier hits
 * 65%+ gross margin at the typical usage pattern (40% quick / 50% standard
 * / 10% full-power scans). Starter is a loss leader by design.
 *
 * Naming:
 *   • Pro      — solo operators, the most common SKU
 *   • Operator — small teams + API users, the AOV bump from Pro
 *   • Agency   — resellers + larger teams, white-label + Slack support
 */
export const PLANS: Record<PlanTier, PlanConfig> = {
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "See what Wynner does",
    priceMonthly: 0,
    priceYearly: 0,
    monthlyCredits: 5,
    rolloverCap: 0,
    vaultLimit: 10,
    features: {
      scrapers: false,
      voiceMining: false,
      comparison: true,
      watermark: true,
      seats: 1,
    },
    bullets: [
      "5 credits each month",
      "Five-pillar scoring engine",
      "Save up to 10 products",
      "Compare across 3 products",
      "Watermarked exports",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For the solo operator",
    priceMonthly: 39,
    priceYearly: 39 * 10, // 2 months free
    monthlyCredits: 100,
    rolloverCap: 200,
    vaultLimit: null,
    features: {
      scrapers: true,
      voiceMining: true,
      comparison: true,
      watermark: false,
      seats: 1,
      dailyFreeScan: true,
    },
    bullets: [
      "100 credits each month",
      "All scrapers (Meta, TikTok, Trends)",
      "Reddit voice mining",
      "Unlimited saved products",
      "No watermarks on exports",
      "1 free scan every day",
      "Roll over up to 200 unused credits",
    ],
  },
  operator: {
    id: "operator",
    name: "Operator",
    tagline: "Built to scale",
    priceMonthly: 99,
    priceYearly: 99 * 10, // 2 months free
    monthlyCredits: 350,
    rolloverCap: 700,
    vaultLimit: null,
    features: {
      scrapers: true,
      voiceMining: true,
      comparison: true,
      watermark: false,
      seats: 3,
      dailyFreeScan: true,
      apiAccess: true,
      customBranding: true,
      priorityQueue: true,
      prioritySupport: true,
    },
    bullets: [
      "350 credits each month",
      "Everything in Pro",
      "3 team seats",
      "API access",
      "Custom branded exports",
      "Priority scoring queue",
      "Priority email support",
      "Roll over up to 700 unused credits",
    ],
  },
  agency: {
    id: "agency",
    name: "Agency",
    tagline: "For resellers and large teams",
    priceMonthly: 249,
    priceYearly: 249 * 10, // 2 months free
    monthlyCredits: 1200,
    rolloverCap: 2400,
    vaultLimit: null,
    features: {
      scrapers: true,
      voiceMining: true,
      comparison: true,
      watermark: false,
      seats: 10,
      dailyFreeScan: true,
      apiAccess: true,
      customBranding: true,
      priorityQueue: true,
      prioritySupport: true,
      whiteLabel: true,
      slackSupport: true,
    },
    bullets: [
      "1,200 credits each month",
      "Everything in Operator",
      "10 team seats",
      "White-label PDFs (your client's logo)",
      "Client workspaces & folders",
      "Higher API rate limits",
      "Dedicated Slack support channel",
      "Roll over up to 2,400 unused credits",
    ],
  },
};

export type TopUpPackBadge = "save_30" | "best_value" | "power_user" | null;

export type TopUpPack = {
  id: string;
  credits: number;
  price: number;
  badge: TopUpPackBadge;
  perCredit: number;
};

/**
 * One-off credit packs for users who don't want to upgrade their tier but
 * need extra capacity for a single project. Per-credit price decreases as
 * pack size grows — encourages users into larger packs (better AOV) while
 * keeping the entry pack accessible.
 */
export const TOPUP_PACKS: TopUpPack[] = [
  { id: "small", credits: 25, price: 15, badge: null, perCredit: 0.6 },
  { id: "medium", credits: 100, price: 49, badge: "save_30", perCredit: 0.49 },
  { id: "large", credits: 300, price: 129, badge: "best_value", perCredit: 0.43 },
  { id: "mega", credits: 1000, price: 369, badge: "power_user", perCredit: 0.37 },
];

export const TOPUP_BADGE_META: Record<
  Exclude<TopUpPackBadge, null>,
  { label: string; color: string; pulse: boolean }
> = {
  save_30: { label: "POPULAR", color: "#FF89C5", pulse: false },
  best_value: { label: "BEST VALUE", color: "#A788FF", pulse: true },
  power_user: { label: "POWER USER", color: "#5B8DFF", pulse: false },
};

/**
 * Map of CreditActionType → human-readable description used when writing
 * transactions and when rendering history rows.
 */
export const ACTION_LABELS: Record<CreditActionType, string> = {
  basic_scan: "Product scan",
  url_scrape: "URL auto-scrape",
  reddit_voice: "Reddit voice mining",
  meta_ads: "Meta Ad Library check",
  tiktok_trends: "TikTok trends signal",
  country_compare: "Country comparison",
  full_power_scan: "Full Power Scan",
  re_score: "Product re-score",
  streak_bonus: "7-day streak bonus",
  referral_bonus: "Referral bonus",
  daily_free: "Daily free scan",
  topup_purchase: "Top-up purchase",
  monthly_refill: "Monthly refill",
  gift_received: "Gift received",
  gift_sent: "Gift sent",
};

/**
 * The free-tier daily allowance (only paid plans get a daily free scan).
 * Streak bonus threshold (days to scan in a row before bonus fires).
 */
export const STREAK_BONUS_DAYS = 7;
export const STREAK_BONUS_AMOUNT = 5;

/** Low-balance warning thresholds — pill pulses when balance drops below. */
export const LOW_BALANCE_THRESHOLD = {
  starter: 2,
  pro: 10,
  operator: 30,
  agency: 100,
} satisfies Record<PlanTier, number>;
