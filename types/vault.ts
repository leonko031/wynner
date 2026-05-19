/**
 * Vault — TypeScript types + Zod schemas.
 *
 * Mirrors the schema in supabase/migrations/005_collections.sql.
 */
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Per-product status                                                          */
/* -------------------------------------------------------------------------- */

export const PRODUCT_STATUSES = [
  "active",
  "watchlist",
  "testing",
  "won",
  "killed",
  "archived",
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const STATUS_META: Record<
  ProductStatus,
  { label: string; color: string; icon: string; description: string }
> = {
  active: {
    label: "Active",
    color: "#5B8DFF",
    icon: "Sparkles",
    description: "In consideration — default for new scans",
  },
  watchlist: {
    label: "Watchlist",
    color: "#FFAB40",
    icon: "Star",
    description: "Monitoring, not acting yet",
  },
  testing: {
    label: "Testing",
    color: "#A788FF",
    icon: "Rocket",
    description: "Currently running ads",
  },
  won: {
    label: "Won",
    color: "#3DD68C",
    icon: "Trophy",
    description: "Confirmed winner",
  },
  killed: {
    label: "Killed",
    color: "#FF5C7C",
    icon: "X",
    description: "Tried and didn't work",
  },
  archived: {
    label: "Archived",
    color: "#9DA0BF",
    icon: "Archive",
    description: "Out of mind but kept for reference",
  },
};

/* -------------------------------------------------------------------------- */
/* Collections                                                                 */
/* -------------------------------------------------------------------------- */

export const COLLECTION_COLORS = [
  "aurora_blue",
  "aurora_purple",
  "aurora_pink",
  "aurora_peach",
  "aurora_mint",
] as const;
export type CollectionColor = (typeof COLLECTION_COLORS)[number];

export const COLLECTION_COLOR_HEX: Record<CollectionColor, string> = {
  aurora_blue: "#5B8DFF",
  aurora_purple: "#A788FF",
  aurora_pink: "#FF89C5",
  aurora_peach: "#FFB088",
  aurora_mint: "#88E5C8",
};

export const COLLECTION_TYPES = ["user", "smart", "system"] as const;
export type CollectionType = (typeof COLLECTION_TYPES)[number];

export const collectionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  description: z.string().max(280).nullable(),
  color: z.enum(COLLECTION_COLORS),
  type: z.enum(COLLECTION_TYPES),
  rationale: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Collection = z.infer<typeof collectionSchema>;

export const collectionProductSchema = z.object({
  collection_id: z.string().uuid(),
  product_id: z.string(),
  added_at: z.string(),
});
export type CollectionProduct = z.infer<typeof collectionProductSchema>;

/**
 * Convenience: a collection with its current product-id list attached.
 * The IDs are plain strings — the UI looks them up against the local
 * product store and silently skips any orphans.
 */
export type CollectionWithProducts = Collection & { productIds: string[] };

/* -------------------------------------------------------------------------- */
/* Smart organize (Gemini output)                                              */
/* -------------------------------------------------------------------------- */

export const smartCollectionSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().min(1).max(180),
  rationale: z.string().min(1).max(360),
  productIds: z.array(z.string()).min(2).max(40),
});
export const smartOrganizeOutputSchema = z.object({
  collections: z.array(smartCollectionSchema).min(2).max(6),
});
export type SmartOrganizeOutput = z.infer<typeof smartOrganizeOutputSchema>;

/* -------------------------------------------------------------------------- */
/* Semantic search (Gemini output)                                             */
/* -------------------------------------------------------------------------- */

export const searchMatchSchema = z.object({
  productId: z.string(),
  relevance: z.number().min(0).max(100),
  reason: z.string().min(1).max(180),
});
export const semanticSearchOutputSchema = z.object({
  matches: z.array(searchMatchSchema).max(20),
  interpretation: z.string().min(1).max(280),
});
export type SemanticSearchOutput = z.infer<typeof semanticSearchOutputSchema>;

/* -------------------------------------------------------------------------- */
/* Chat (Ask Wynner)                                                           */
/* -------------------------------------------------------------------------- */

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.string(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const conversationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  messages: z.array(chatMessageSchema),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Conversation = z.infer<typeof conversationSchema>;

/* -------------------------------------------------------------------------- */
/* View modes + density                                                        */
/* -------------------------------------------------------------------------- */

export const VAULT_VIEWS = ["grid", "list", "gallery"] as const;
export type VaultView = (typeof VAULT_VIEWS)[number];

export const VAULT_DENSITIES = ["compact", "comfortable", "spacious"] as const;
export type VaultDensity = (typeof VAULT_DENSITIES)[number];

/* -------------------------------------------------------------------------- */
/* Filters                                                                     */
/* -------------------------------------------------------------------------- */

export type VaultDateRange = "all" | "recent" | "week" | "month";

export interface VaultV2Filters {
  search: string;
  verdicts: string[]; // subset of go/test/risky/skip
  scoreRange: [number, number]; // 0..100
  countries: string[]; // ISO-2 codes
  niches: string[]; // niche keys
  statuses: ProductStatus[];
  dateRange: VaultDateRange;
  sortBy:
    | "score-desc"
    | "score-asc"
    | "newest"
    | "lastViewed"
    | "margin-desc"
    | "alphabetical"
    | "random";
  view: VaultView;
  density: VaultDensity;
  collectionId: string | null; // when set, only show products in this collection
  favoritesOnly: boolean;
}

export const DEFAULT_VAULT_FILTERS: VaultV2Filters = {
  search: "",
  verdicts: [],
  scoreRange: [0, 100],
  countries: [],
  niches: [],
  statuses: [],
  dateRange: "all",
  sortBy: "score-desc",
  view: "grid",
  density: "comfortable",
  collectionId: null,
  favoritesOnly: false,
};
