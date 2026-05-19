import type { Country } from "@/types";
import type { ResearchStageId } from "@/types/research";
import type { ProductInput } from "./shared";

/**
 * Hand-written "thinking" thoughts emitted into the live feed during each
 * stage. These are NOT Gemini outputs — they're our scripted commentary that
 * makes the AI feel like it's reasoning out loud while the real call is in
 * flight. Specific to product + country so they feel earned.
 */
export function thinkingFor(
  stage: ResearchStageId,
  product: ProductInput,
  country: Country,
): string[] {
  const niche = String(product.category).toLowerCase();
  switch (stage) {
    case "product_intelligence":
      return [
        `Looking at "${product.name}" in the ${niche} category…`,
        `Mapping the use case and what pain it actually solves…`,
        `Scoring novelty against everything I've seen in ${country.name} this quarter.`,
      ];
    case "market_analysis":
      return [
        `Pulling the ${country.name} market profile — AOV €${country.avgAOV}, CPM idx ${country.cpmIndex}.`,
        `Checking seasonality for ${niche} in ${country.code}…`,
        `${country.trendingNiches.includes(product.category as never) ? "This niche is currently trending here." : "This niche is not on the trending list — adjusting expectations."}`,
      ];
    case "persona_synthesis":
      return [
        `Building customer archetypes from category research…`,
        `Pulling language patterns the way real ${country.name} buyers talk online…`,
        `Cross-checking that each persona makes a distinct buying decision.`,
      ];
    case "competitor_landscape":
      return [
        `Estimating saturation across Meta Ads + TikTok in ${country.code}…`,
        `Identifying dominant competitor archetypes…`,
        `Looking for gaps no one is exploiting yet.`,
      ];
    case "pricing_strategy":
      return [
        `Anchoring against competitor benchmarks…`,
        `Designing a 3-tier ladder that maximizes ASP without killing CR.`,
      ];
    case "ad_angles":
      return [
        `Drafting hooks across the awareness spectrum…`,
        `Mapping each angle to a specific persona.`,
        `Filtering out the marketer-speak — keeping only language a real human would post.`,
      ];
    case "launch_playbook":
      return [
        `Sequencing 14 days of paid acquisition…`,
        `Budgeting by ASP and country CPM…`,
        `Locking in KPI checkpoints for each day.`,
      ];
    case "risk_verdict":
      return [
        `Synthesizing every prior stage into a single verdict…`,
        `Weighing margin, demand, competition, and creative potential…`,
        `Surfacing the red flags worth knowing before you spend a dollar.`,
      ];
  }
}
