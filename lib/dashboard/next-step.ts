/**
 * Adaptive "next step" recommendation for the dashboard footer card.
 *
 * Picks a single suggestion based on the user's current state. Priority
 * matters — the first matching rule wins.
 */
import type { UserCreditState } from "@/types/credits";

export type NextStep = {
  id: string;
  /** lucide icon NAME (use the icon's import name as a string). */
  icon: "Sparkles" | "Compass" | "Heart" | "GitCompareArrows" | "ZapOff" | "TrendingUp" | "Lightbulb" | "FlaskConical";
  /** Accent for the gradient border. */
  accent: string;
  headline: string;
  subhead: string;
  /** Primary CTA button label. */
  cta: string;
  /** Where the CTA navigates. */
  href: string;
};

type Inputs = {
  scanCount: number;
  favoriteCount: number;
  hasCompared: boolean;
  hasUsedDeepResearch: boolean;
  weeklyScans: number;
  credit: Pick<UserCreditState, "balance" | "monthlyAllowance" | "plan" | "isAdmin">;
};

export function recommendNextStep(input: Inputs): NextStep {
  const { scanCount, favoriteCount, hasCompared, hasUsedDeepResearch, weeklyScans, credit } = input;

  // 1. New user — first scan
  if (scanCount === 0) {
    return {
      id: "first-scan",
      icon: "Sparkles",
      accent: "#5B8DFF",
      headline: "Start your first scan",
      subhead:
        "Pick any product idea you've been sitting on — we'll score it in under a minute.",
      cta: "Start scanning",
      href: "/scan",
    };
  }

  // 2. Few scans — try Deep Research
  if (scanCount >= 1 && scanCount <= 3 && !hasUsedDeepResearch) {
    return {
      id: "try-deep",
      icon: "FlaskConical",
      accent: "#FF89C5",
      headline: "Try a Deep Research scan",
      subhead:
        "Six ad angles, three customer personas, a 14-day playbook, and a branded PDF you can email yourself. See the magic.",
      cta: "Try Deep Research",
      href: "/scan",
    };
  }

  // 3. Has scans, no favorites — encourage favoriting (powers strategic brief
  //    + operator level signals).
  if (scanCount > 0 && favoriteCount === 0) {
    return {
      id: "build-favorites",
      icon: "Heart",
      accent: "#FF7E5F",
      headline: "Star the products you love",
      subhead:
        "Favorites tell Wynner which scans matter — they sharpen your insights and the comparison view.",
      cta: "Score another product",
      href: "/scan",
    };
  }

  // 4. Has favorites, hasn't compared — push the comparison feature
  if (favoriteCount > 0 && !hasCompared) {
    return {
      id: "first-compare",
      icon: "GitCompareArrows",
      accent: "#A788FF",
      headline: "Compare three products side by side",
      subhead:
        "Stack your favorites, pick a winner. The comparison view shows you exactly which one to ship first.",
      cta: "Compare now",
      href: "/compare",
    };
  }

  // 5. Approaching credit limit (non-admin)
  if (!credit.isAdmin && credit.balance > 0 && credit.monthlyAllowance > 0) {
    const usedPct =
      ((credit.monthlyAllowance - credit.balance) / credit.monthlyAllowance) * 100;
    if (usedPct >= 80 && credit.balance < credit.monthlyAllowance * 0.2) {
      return {
        id: "topup",
        icon: "ZapOff",
        accent: "#FFAB40",
        headline: "You're approaching your monthly limit",
        subhead: `Used ${Math.round(usedPct)}% of your ${credit.monthlyAllowance} credits this cycle. A top-up keeps you scanning without interruption.`,
        cta: "Top up credits",
        href: "/pricing#topups",
      };
    }
  }

  // 6. Starter + scanning a lot → suggest Pro
  if (!credit.isAdmin && credit.plan === "starter" && weeklyScans >= 5) {
    return {
      id: "starter-upgrade",
      icon: "TrendingUp",
      accent: "#A788FF",
      headline: `Scanning ${weeklyScans} times a week? Pro pays for itself.`,
      subhead:
        "Pro gets you 10× the monthly credits + Reddit voice mining + no watermarks. €19/mo.",
      cta: "See Pro",
      href: "/pricing",
    };
  }

  // 7. Default — power user tip rotation
  const tips: Omit<NextStep, "id">[] = [
    {
      icon: "Compass",
      accent: "#88E5C8",
      headline: "Try a country comparison",
      subhead: "Score the same product across 5 markets in one shot — see where it lands hardest.",
      cta: "Compare countries",
      href: "/compare",
    },
    {
      icon: "Lightbulb",
      accent: "#FF89C5",
      headline: "Compare your favorites against each other",
      subhead:
        "Pick a winner from the products you've already starred. The compare page surfaces which one ships first.",
      cta: "Open compare",
      href: "/compare",
    },
    {
      icon: "FlaskConical",
      accent: "#A788FF",
      headline: "Try Deep Research on your best product",
      subhead: "Get the full PDF dossier — six angles, three personas, the 14-day launch plan.",
      cta: "Run Deep Research",
      href: "/scan",
    },
  ];
  // Rotate by day-of-month for stability within a day.
  const idx = new Date().getDate() % tips.length;
  return { id: `tip-${idx}`, ...tips[idx] };
}
