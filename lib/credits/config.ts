import type { CreditActionType, PlanTier } from "@/types/credits";

/**
 * Per-action credit costs. Spend actions are stored as positive integers here;
 * the store negates them when creating the transaction.
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
  /** Yearly is monthly × 12 × 0.8 (20% off). */
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
  };
  bullets: string[];
};

export const PLANS: Record<PlanTier, PlanConfig> = {
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "Try the magic",
    priceMonthly: 0,
    priceYearly: 0,
    monthlyCredits: 10,
    rolloverCap: 0,
    vaultLimit: 25,
    features: {
      scrapers: false,
      voiceMining: false,
      comparison: true,
      watermark: true,
      seats: 1,
    },
    bullets: [
      "10 credits each month",
      "Five-pillar scoring engine",
      "Save up to 25 products",
      "Compare across 3 products",
      "Watermarked exports",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For the serious operator",
    priceMonthly: 19,
    priceYearly: Math.round(19 * 12 * 0.8),
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
    priceMonthly: 49,
    priceYearly: Math.round(49 * 12 * 0.8),
    monthlyCredits: 300,
    rolloverCap: 600,
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
      "300 credits each month",
      "Everything in Pro",
      "3 team seats",
      "API access",
      "Custom branded exports",
      "Priority scoring queue",
      "Priority email support",
      "Roll over up to 600 unused credits",
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

export const TOPUP_PACKS: TopUpPack[] = [
  { id: "small", credits: 25, price: 9, badge: null, perCredit: 0.36 },
  { id: "medium", credits: 75, price: 19, badge: "save_30", perCredit: 0.25 },
  { id: "large", credits: 200, price: 39, badge: "best_value", perCredit: 0.2 },
  { id: "mega", credits: 500, price: 79, badge: "power_user", perCredit: 0.16 },
];

export const TOPUP_BADGE_META: Record<
  Exclude<TopUpPackBadge, null>,
  { label: string; color: string; pulse: boolean }
> = {
  save_30: { label: "SAVE 30%", color: "#FF89C5", pulse: false },
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
  starter: 3,
  pro: 10,
  operator: 25,
} satisfies Record<PlanTier, number>;
