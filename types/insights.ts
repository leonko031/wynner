/**
 * Insights — types + Zod schemas for the personal strategic intelligence
 * center at /insights.
 *
 * The page is mostly client-computed from the local product store, with
 * three Gemini-backed cards on top (profile tags, strengths/blindspots,
 * strategic brief). Each cache is keyed by `scansHash` so re-scoring or
 * adding new scans invalidates it.
 */

import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Time period control                                                         */
/* -------------------------------------------------------------------------- */

export const INSIGHTS_PERIODS = ["7d", "30d", "90d", "all"] as const;
export type InsightsPeriod = (typeof INSIGHTS_PERIODS)[number];

export const PERIOD_LABEL: Record<InsightsPeriod, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

export function periodDays(p: InsightsPeriod): number | null {
  switch (p) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "all":
    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Operator level                                                              */
/* -------------------------------------------------------------------------- */

export const LEVEL_TIERS = [
  "apprentice",
  "practiced",
  "skilled",
  "expert",
  "master",
] as const;
export type LevelTier = (typeof LEVEL_TIERS)[number];

export function tierFromLevel(level: number): LevelTier {
  if (level >= 81) return "master";
  if (level >= 61) return "expert";
  if (level >= 41) return "skilled";
  if (level >= 21) return "practiced";
  return "apprentice";
}

export const LEVEL_TIER_META: Record<
  LevelTier,
  { label: string; color: string; description: string }
> = {
  apprentice: {
    label: "Apprentice",
    color: "#9DA0BF",
    description: "Building your scanning instincts. Every scan teaches you something.",
  },
  practiced: {
    label: "Practiced",
    color: "#5B8DFF",
    description: "You've found your rhythm. Patterns are starting to emerge.",
  },
  skilled: {
    label: "Skilled",
    color: "#A788FF",
    description: "You scan with intent. Your filters are sharp.",
  },
  expert: {
    label: "Expert",
    color: "#FF89C5",
    description: "You read the market. Your scores reflect real edge.",
  },
  master: {
    label: "Master",
    color: "#FFB088",
    description: "Top-tier operator. You see what most miss.",
  },
};

/* -------------------------------------------------------------------------- */
/* Operator profile tags                                                       */
/* -------------------------------------------------------------------------- */

export const PROFILE_TAG_KINDS = [
  "niche",
  "country",
  "pickiness",
  "pace",
] as const;
export type ProfileTagKind = (typeof PROFILE_TAG_KINDS)[number];

export const profileTagSchema = z.object({
  kind: z.enum(PROFILE_TAG_KINDS),
  label: z.string().min(1).max(40),
  emoji: z.string().max(4).optional(),
});
export type ProfileTag = z.infer<typeof profileTagSchema>;

export const profileTagsSchema = z.object({
  tags: z.array(profileTagSchema).min(2).max(4),
});
export type ProfileTagsOutput = z.infer<typeof profileTagsSchema>;

/* -------------------------------------------------------------------------- */
/* Strengths & blindspots                                                      */
/* -------------------------------------------------------------------------- */

export const strengthSchema = z.object({
  category: z.string().min(1).max(40),
  label: z.string().min(1).max(60),
  stat: z.string().min(1).max(160),
  insight: z.string().min(1).max(240),
  sparkline: z.array(z.number()).min(2).max(30).optional(),
});
export type Strength = z.infer<typeof strengthSchema>;

export const blindspotSchema = z.object({
  category: z.string().min(1).max(40),
  label: z.string().min(1).max(60),
  gap: z.string().min(1).max(160),
  insight: z.string().min(1).max(240),
  /** Optional URL to pre-fill a scan or jump to a related filter. */
  exploreUrl: z.string().max(240).optional(),
});
export type Blindspot = z.infer<typeof blindspotSchema>;

export const strengthsBlindspotsSchema = z.object({
  strengths: z.array(strengthSchema).min(1).max(3),
  blindspots: z.array(blindspotSchema).min(1).max(3),
});
export type StrengthsBlindspotsOutput = z.infer<typeof strengthsBlindspotsSchema>;

/* -------------------------------------------------------------------------- */
/* Strategic brief (the killer feature)                                        */
/* -------------------------------------------------------------------------- */

const briefListSchema = z.object({
  intro: z.string().min(1).max(280),
  bullets: z.array(z.string().min(1).max(220)).min(2).max(4),
});

const briefPlanSchema = z.object({
  intro: z.string().min(1).max(280),
  actions: z.array(z.string().min(1).max(240)).min(3).max(5),
});

export const strategicBriefSchema = z.object({
  portrait: z.string().min(40).max(1400),
  whatsWorking: briefListSchema,
  needsAttention: briefListSchema,
  hypothesis: z.string().min(20).max(700),
  planForNextMonth: briefPlanSchema,
});
export type StrategicBrief = z.infer<typeof strategicBriefSchema>;

/* -------------------------------------------------------------------------- */
/* Hash helpers — drive cache invalidation server-side.                       */
/* -------------------------------------------------------------------------- */

/**
 * Hash of the scans we send to AI: sorted "id:score" pairs joined by `|`.
 * Same shape as compare's scoresHash. The server keys cache rows by this.
 */
export function computeScansHash(
  scans: Array<{ id: string; sellScore: number }>,
): string {
  return [...scans]
    .map((s) => `${s.id}:${s.sellScore}`)
    .sort()
    .join("|");
}

/* -------------------------------------------------------------------------- */
/* Compact scan shape — what the client POSTs to the AI routes.               */
/* -------------------------------------------------------------------------- */

export const compactScanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  niche: z.string(),
  country: z.string(),
  score: z.number(),
  verdict: z.string(),
  pillars: z.object({
    margin: z.number(),
    marketFit: z.number(),
    demand: z.number(),
    competition: z.number(),
    creative: z.number(),
  }),
  status: z.string().optional(),
  createdAt: z.string(),
});
export type CompactScan = z.infer<typeof compactScanSchema>;

/* -------------------------------------------------------------------------- */
/* Operator level computation result                                           */
/* -------------------------------------------------------------------------- */

export type OperatorLevelBreakdown = {
  level: number; // 0-100
  tier: LevelTier;
  components: {
    volume: number;
    diversity: number;
    sophistication: number;
    action: number;
    recency: number;
    engagement: number;
  };
  /** Delta vs last week. Positive = improving. */
  deltaWeek: number;
};
