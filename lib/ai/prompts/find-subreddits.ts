import { NICHES } from "@/lib/data/niches";
import type { Country, Niche } from "@/types";

export const findSubredditsSchema = {
  type: "object",
  properties: {
    subreddits: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 8,
    },
    reasoning: { type: "string" },
  },
  required: ["subreddits", "reasoning"],
};

export type FindSubredditsInput = {
  product: { name: string; description: string; category: Niche };
  country: Country;
};

export function buildFindSubredditsPrompt({
  product,
  country,
}: FindSubredditsInput): string {
  const niche = NICHES[product.category];
  return `You are Wynner, a senior dropshipping market analyst. Find the Reddit subreddits where likely buyers of this product actually hang out and talk in their own words.

PRODUCT
- Name: ${product.name}
- Description: ${product.description}
- Niche: ${niche.label}
- Target market: ${country.name} (${country.code})

THINK ABOUT FIVE LENSES (mix across them, don't just pick obvious ones):
1. The literal problem the product solves (e.g. r/Posture for a posture corrector)
2. The buyer's lifestyle / role (e.g. r/wfh for office workers)
3. Hobby communities adjacent to the niche (e.g. r/HomeGym for fitness gear)
4. Complaint / venting communities where buyers describe pain in raw language (e.g. r/ChronicPain, r/migraine)
5. Advice / "what worked for you" communities (e.g. r/EatCheapAndHealthy)

CONSTRAINTS
- Return 5-8 subreddit names, no "r/" prefix, no spaces inside names.
- Prefer subs with broad English-speaking activity unless the country signals a local language community.
- Skip subs that are: porn/NSFW, fanart, deal/coupon only, or memes-only.
- Skip subs you are not confident exist.

OUTPUT — strict JSON, no preamble, no markdown fences:
{
  "subreddits": ["Posture", "backpain", "ergonomics", "wfh", "DeskJobs", "ChronicPain"],
  "reasoning": "Posture and backpain are direct problem communities; ergonomics, wfh and DeskJobs surface the desk-worker lifestyle that buys these belts; ChronicPain is the raw-language venting community where the strongest hooks live."
}`;
}
