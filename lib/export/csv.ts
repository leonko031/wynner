import type { Product } from "@/types";

const HEADERS = [
  "id",
  "name",
  "description",
  "category",
  "source",
  "sourceUrl",
  "targetCountry",
  "costUSD",
  "shippingCostUSD",
  "suggestedPriceUSD",
  "sellScore",
  "verdict",
  "p_margin",
  "p_marketFit",
  "p_demand",
  "p_competition",
  "p_creative",
  "isFavorite",
  "createdAt",
  "updatedAt",
  "topAngle",
] as const;

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/\r?\n/g, " ");
  if (/[",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function productsToCsv(products: Product[]): string {
  const lines = [HEADERS.join(",")];
  for (const p of products) {
    lines.push(
      [
        p.id,
        p.name,
        p.description,
        p.category,
        p.source,
        p.sourceUrl ?? "",
        p.targetCountry,
        p.costUSD,
        p.shippingCostUSD,
        p.suggestedPriceUSD,
        p.sellScore,
        p.verdict,
        p.pillars.margin,
        p.pillars.marketFit,
        p.pillars.demand,
        p.pillars.competition,
        p.pillars.creative,
        p.isFavorite ? "1" : "0",
        p.createdAt,
        p.updatedAt,
        p.reasoning.topAngle,
      ]
        .map(cell)
        .join(","),
    );
  }
  return lines.join("\n");
}

export function downloadCsv(products: Product[], filename: string): void {
  const csv = productsToCsv(products);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
