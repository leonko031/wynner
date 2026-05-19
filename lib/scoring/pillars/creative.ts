import type { PillarResult, ScoreInput } from "../types";
import { geminiVision, isGeminiAvailable } from "@/lib/ai/gemini";
import {
  buildCreativePrompt,
  creativeSchema,
} from "@/lib/ai/prompts/creative-prompt";

function fallbackCreative({ product }: Pick<ScoreInput, "product">): PillarResult {
  const hasImage = Boolean(product.image) && product.image.length > 8;
  const nameLen = product.name.length;
  let score = hasImage ? 60 : 45;
  if (nameLen > 35) score -= 4;
  if (/before|after|reveal|transform|demo|fix/i.test(product.description)) score += 8;
  score = Math.max(20, Math.min(85, score));
  return {
    score,
    reasoning: hasImage
      ? "AI unavailable — heuristic from image presence and language signals in the description."
      : "AI unavailable and no image — heuristic placeholder; expect creative R&D before launch.",
  };
}

export async function scoreCreative({
  product,
}: Pick<ScoreInput, "product">): Promise<PillarResult> {
  if (!isGeminiAvailable() || !product.image) return fallbackCreative({ product });
  try {
    const res = await geminiVision<{ score: number; reasoning: string }>(
      buildCreativePrompt({ product }),
      product.image,
      creativeSchema,
    );
    return {
      score: Math.max(0, Math.min(100, Math.round(res.score))),
      reasoning: res.reasoning.trim(),
    };
  } catch {
    return fallbackCreative({ product });
  }
}
