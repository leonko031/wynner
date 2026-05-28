/**
 * Compare v2 — types + Zod schemas + shared helpers.
 */
import { z } from "zod";
import type { Product } from "@/types";

/* -------------------------------------------------------------------------- */
/* Plan-gated slot limits                                                      */
/* -------------------------------------------------------------------------- */
import type { PlanTier } from "./credits";

export const SLOT_LIMIT_BY_PLAN: Record<PlanTier, number> = {
  starter: 2,
  pro: 3,
  operator: 4,
  agency: 4,
};

export const HARD_MAX_SLOTS = 4;

/** Returns the effective slot cap for a user, honoring admin status. */
export function slotLimitFor(plan: PlanTier, isAdmin: boolean): number {
  if (isAdmin) return HARD_MAX_SLOTS;
  return SLOT_LIMIT_BY_PLAN[plan];
}

/* -------------------------------------------------------------------------- */
/* Pillar weighting (tie-breaker)                                              */
/* -------------------------------------------------------------------------- */

export type PillarWeights = {
  margin: number;
  marketFit: number;
  demand: number;
  competition: number;
  creative: number;
};

export const DEFAULT_PILLAR_WEIGHTS: PillarWeights = {
  margin: 22,
  marketFit: 22,
  demand: 22,
  competition: 18,
  creative: 16,
};

/** Compute a weighted sell-score using user-tunable pillar weights. */
export function weightedScore(p: Product, w: PillarWeights): number {
  const total = w.margin + w.marketFit + w.demand + w.competition + w.creative;
  if (total === 0) return 0;
  return Math.round(
    (p.pillars.margin * w.margin +
      p.pillars.marketFit * w.marketFit +
      p.pillars.demand * w.demand +
      p.pillars.competition * w.competition +
      p.pillars.creative * w.creative) /
      total,
  );
}

/* -------------------------------------------------------------------------- */
/* Judge verdict — Gemini output                                               */
/* -------------------------------------------------------------------------- */

export const confidenceLevelSchema = z.enum(["low", "medium", "high"]);

export const judgeVerdictSchema = z.object({
  /** Product ID of the winner — must match one of the input productIds. */
  winnerProductId: z.string().min(1),
  /** Sentence-long declaration: "X takes this comparison, but the margin is narrower than the score suggests." */
  declaration: z.string().min(10).max(280),
  /** 2-4 bullets justifying the pick. */
  whyBullets: z.array(z.string().min(8).max(220)).min(2).max(4),
  /** 2-3 bullets naming the tradeoffs the winner makes. */
  tradeoffBullets: z.array(z.string().min(8).max(220)).min(1).max(4),
  /** A single tactical "what an operator should do" line. */
  recommendation: z.string().min(20).max(400),
  /** Confidence in the verdict. */
  confidenceLevel: confidenceLevelSchema,
});
export type JudgeVerdict = z.infer<typeof judgeVerdictSchema>;

/* -------------------------------------------------------------------------- */
/* Hashing — used by the cache lookup                                          */
/* -------------------------------------------------------------------------- */

/**
 * Deterministic hash of the participating products' current sell scores.
 *
 * Format: sorted "productId:score" pairs joined by `|`. Cheap to compute,
 * unambiguous, no collisions in practice. Re-scoring any participant
 * changes the hash → cache invalidates.
 */
export function computeScoresHash(productIds: string[], scoreLookup: Map<string, number>): string {
  const pairs = [...productIds]
    .sort()
    .map((id) => `${id}:${scoreLookup.get(id) ?? "?"}`);
  return pairs.join("|");
}

/* -------------------------------------------------------------------------- */
/* Persisted shape                                                             */
/* -------------------------------------------------------------------------- */

export interface ComparisonVerdictRow extends JudgeVerdict {
  id: string;
  user_id: string;
  product_ids: string[];
  scores_hash: string;
  created_at: string;
}
