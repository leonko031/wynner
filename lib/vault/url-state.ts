/**
 * Two-way mapping between the vault's filter/sort/view state and the URL
 * search-params. Lets users share + bookmark filtered vault views.
 *
 * We intentionally encode only NON-default values to keep URLs short. Empty
 * arrays, the default sort, default view, and full score range all stay out.
 */
import type { VaultDateRange, VaultDensity, VaultV2Filters, VaultView } from "@/types/vault";
import { DEFAULT_VAULT_FILTERS, VAULT_DENSITIES, VAULT_VIEWS } from "@/types/vault";

const VALID_VIEWS = new Set<VaultView>(VAULT_VIEWS);
const VALID_DENSITIES = new Set<VaultDensity>(VAULT_DENSITIES);
const VALID_SORTS = new Set<VaultV2Filters["sortBy"]>([
  "score-desc",
  "score-asc",
  "newest",
  "lastViewed",
  "margin-desc",
  "alphabetical",
  "random",
]);
const VALID_DATE_RANGES = new Set<VaultDateRange>(["all", "recent", "week", "month"]);

function decodeList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function filtersFromUrl(params: URLSearchParams): VaultV2Filters {
  const out: VaultV2Filters = { ...DEFAULT_VAULT_FILTERS };

  const q = params.get("q");
  if (q) out.search = q;

  out.verdicts = decodeList(params.get("verdict"));
  out.countries = decodeList(params.get("country"));
  out.niches = decodeList(params.get("niche"));
  out.statuses = decodeList(params.get("status")).filter((s): s is VaultV2Filters["statuses"][number] =>
    ["active", "watchlist", "testing", "won", "killed", "archived"].includes(s),
  );

  const range = params.get("score");
  if (range) {
    const [lo, hi] = range.split("-").map((n) => Number.parseInt(n, 10));
    if (Number.isFinite(lo) && Number.isFinite(hi)) {
      out.scoreRange = [Math.max(0, lo), Math.min(100, hi)];
    }
  }

  const dr = params.get("when");
  if (dr && VALID_DATE_RANGES.has(dr as VaultDateRange)) {
    out.dateRange = dr as VaultDateRange;
  }

  const sort = params.get("sort");
  if (sort && VALID_SORTS.has(sort as VaultV2Filters["sortBy"])) {
    out.sortBy = sort as VaultV2Filters["sortBy"];
  }

  const view = params.get("view");
  if (view && VALID_VIEWS.has(view as VaultView)) out.view = view as VaultView;

  const density = params.get("density");
  if (density && VALID_DENSITIES.has(density as VaultDensity)) {
    out.density = density as VaultDensity;
  }

  const collection = params.get("collection");
  if (collection) out.collectionId = collection;

  if (params.get("favs") === "1") out.favoritesOnly = true;

  return out;
}

export function filtersToUrl(f: VaultV2Filters): URLSearchParams {
  const p = new URLSearchParams();
  const d = DEFAULT_VAULT_FILTERS;

  if (f.search) p.set("q", f.search);
  if (f.verdicts.length) p.set("verdict", f.verdicts.join(","));
  if (f.countries.length) p.set("country", f.countries.join(","));
  if (f.niches.length) p.set("niche", f.niches.join(","));
  if (f.statuses.length) p.set("status", f.statuses.join(","));
  if (f.scoreRange[0] !== d.scoreRange[0] || f.scoreRange[1] !== d.scoreRange[1]) {
    p.set("score", `${f.scoreRange[0]}-${f.scoreRange[1]}`);
  }
  if (f.dateRange !== d.dateRange) p.set("when", f.dateRange);
  if (f.sortBy !== d.sortBy) p.set("sort", f.sortBy);
  if (f.view !== d.view) p.set("view", f.view);
  if (f.density !== d.density) p.set("density", f.density);
  if (f.collectionId) p.set("collection", f.collectionId);
  if (f.favoritesOnly) p.set("favs", "1");

  return p;
}

/** Whether any non-default filter is currently active. */
export function hasActiveFilters(f: VaultV2Filters): boolean {
  const d = DEFAULT_VAULT_FILTERS;
  return (
    f.search !== d.search ||
    f.verdicts.length > 0 ||
    f.countries.length > 0 ||
    f.niches.length > 0 ||
    f.statuses.length > 0 ||
    f.scoreRange[0] !== d.scoreRange[0] ||
    f.scoreRange[1] !== d.scoreRange[1] ||
    f.dateRange !== d.dateRange ||
    f.collectionId !== null ||
    f.favoritesOnly
  );
}
