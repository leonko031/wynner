"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { NicheCountryCell } from "@/lib/insights/aggregates";
import type { Niche, Verdict } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  matrix: NicheCountryCell[];
};

const VERDICT_COLOR: Record<Verdict, string> = {
  go: "#3DD68C",
  test: "#FFAB40",
  risky: "#FF7E5F",
  skip: "#FF5C7C",
};

/**
 * Niche × Country matrix — a sparse grid where tiles are sized by scan
 * count + colored by avg score. Empty intersections show as dashed
 * placeholders so the grid still feels coherent.
 *
 * Side panel: most explored / most successful / untapped (a deterministic
 * suggestion of an unexplored combo the user might find interesting).
 */
export function NicheCountryMatrix({ matrix }: Props) {
  const router = useRouter();

  // Pick rows/cols from the data — only show niches/countries the user touched.
  const niches = useMemo(() => {
    const counts = new Map<Niche, number>();
    for (const c of matrix) counts.set(c.niche, (counts.get(c.niche) ?? 0) + c.count);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k)
      .slice(0, 6);
  }, [matrix]);

  const countries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of matrix) counts.set(c.country, (counts.get(c.country) ?? 0) + c.count);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k)
      .slice(0, 6);
  }, [matrix]);

  const cellMap = useMemo(() => {
    const m = new Map<string, NicheCountryCell>();
    for (const c of matrix) m.set(`${c.niche}::${c.country}`, c);
    return m;
  }, [matrix]);

  // For sizing — find the global max count.
  const maxCount = Math.max(1, ...matrix.map((c) => c.count));

  const mostExplored = [...matrix].sort((a, b) => b.count - a.count)[0];
  const mostSuccessful = [...matrix]
    .filter((c) => c.count >= 2)
    .sort((a, b) => b.avgScore - a.avgScore)[0];
  const untapped = pickUntapped(matrix);

  if (matrix.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass rounded-3xl p-6"
      >
        <h3 className="font-serif text-xl text-text">Your map of operations</h3>
        <div className="mt-4 rounded-2xl border border-dashed border-border-soft p-8 text-center text-sm text-text-muted">
          Scan a few products and your map starts to fill in.
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-3xl p-6"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl text-text">Your map of operations</h3>
          <p className="mt-1 text-xs text-text-muted">
            Niche × country footprint · {matrix.length} combinations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_240px]">
        {/* Matrix */}
        <div className="overflow-x-auto">
          <div
            className="grid items-center gap-2"
            style={{
              gridTemplateColumns: `minmax(110px, max-content) repeat(${countries.length}, minmax(60px, 1fr))`,
            }}
          >
            {/* Header row */}
            <div />
            {countries.map((c) => {
              const meta = COUNTRIES[c];
              return (
                <div
                  key={c}
                  className="text-center font-mono text-[10px] uppercase tracking-wider text-text-dim"
                  title={meta?.name ?? c}
                >
                  {meta?.flag ?? c}
                </div>
              );
            })}

            {/* Body rows */}
            {niches.map((n, rowIndex) => (
              <RowFragment
                key={n}
                niche={n}
                countries={countries}
                cellMap={cellMap}
                maxCount={maxCount}
                router={router}
                rowIndex={rowIndex}
              />
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          <SidePanelCard
            label="Most explored"
            niche={mostExplored?.niche}
            country={mostExplored?.country}
            stat={
              mostExplored
                ? `${mostExplored.count} scan${mostExplored.count === 1 ? "" : "s"}`
                : "—"
            }
            color="#5B8DFF"
          />
          <SidePanelCard
            label="Most successful"
            niche={mostSuccessful?.niche}
            country={mostSuccessful?.country}
            stat={
              mostSuccessful
                ? `avg ${mostSuccessful.avgScore}`
                : "Need more data"
            }
            color="#3DD68C"
          />
          {untapped && (
            <SidePanelCard
              label="Untapped"
              niche={untapped.niche}
              country={untapped.country}
              stat="Worth a scan"
              color="#FF89C5"
              cta={`/scan?niche=${untapped.niche}&country=${untapped.country}`}
            />
          )}
        </div>
      </div>
    </motion.section>
  );
}

function RowFragment({
  niche,
  countries,
  cellMap,
  maxCount,
  router,
  rowIndex,
}: {
  niche: Niche;
  countries: string[];
  cellMap: Map<string, NicheCountryCell>;
  maxCount: number;
  router: ReturnType<typeof useRouter>;
  rowIndex: number;
}) {
  const nicheMeta = NICHES[niche];
  return (
    <>
      <div className="flex items-center gap-2 pr-2 text-xs text-text">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: nicheMeta.color }}
        />
        <span className="truncate">{nicheMeta.label}</span>
      </div>
      {countries.map((c, colIndex) => {
        const key = `${niche}::${c}`;
        const cell = cellMap.get(key);
        const size = cell ? 0.55 + 0.45 * (cell.count / maxCount) : 0;
        const tile = (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.32,
              delay: 0.04 * (rowIndex + colIndex),
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={() =>
              cell && router.push(`/scan?niche=${niche}&country=${c}`)
            }
            className={cn(
              "mx-auto block aspect-square rounded-md transition-shadow",
              cell
                ? "border border-border-soft cursor-pointer hover:shadow-md"
                : "border border-dashed border-border-soft/50 cursor-default",
            )}
            style={{
              width: cell ? `${Math.max(20, size * 44)}px` : "16px",
              height: cell ? `${Math.max(20, size * 44)}px` : "16px",
              backgroundColor: cell
                ? avgColor(cell.avgScore)
                : "transparent",
            }}
            aria-label={
              cell
                ? `${NICHES[niche].label} × ${COUNTRIES[c]?.name ?? c}: ${cell.count} scans, avg ${cell.avgScore}`
                : `Untapped: ${NICHES[niche].label} × ${COUNTRIES[c]?.name ?? c}`
            }
          />
        );
        return (
          <Tooltip key={c} delayDuration={50}>
            <TooltipTrigger asChild>
              <div className="flex justify-center">{tile}</div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <div className="font-medium text-text">
                {NICHES[niche].label} × {COUNTRIES[c]?.name ?? c}
              </div>
              {cell ? (
                <>
                  <div className="text-text-muted">
                    {cell.count} scan{cell.count === 1 ? "" : "s"} · avg{" "}
                    <span className="font-mono">{cell.avgScore}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1 font-mono text-[10px]">
                    {(["go", "test", "risky", "skip"] as const).map((v) =>
                      cell.verdicts[v] > 0 ? (
                        <span
                          key={v}
                          className="rounded-full px-1.5 py-0.5"
                          style={{
                            backgroundColor: `${VERDICT_COLOR[v]}25`,
                            color: VERDICT_COLOR[v],
                          }}
                        >
                          {cell.verdicts[v]} {v}
                        </span>
                      ) : null,
                    )}
                  </div>
                </>
              ) : (
                <div className="text-text-muted">Untapped</div>
              )}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </>
  );
}

function avgColor(avg: number): string {
  if (avg >= 80) return "rgba(61,214,140,0.85)";
  if (avg >= 65) return "rgba(91,141,255,0.7)";
  if (avg >= 50) return "rgba(167,136,255,0.6)";
  if (avg >= 35) return "rgba(255,176,136,0.6)";
  return "rgba(255,92,124,0.55)";
}

function SidePanelCard({
  label,
  niche,
  country,
  stat,
  color,
  cta,
}: {
  label: string;
  niche: Niche | undefined;
  country: string | undefined;
  stat: string;
  color: string;
  cta?: string;
}) {
  const nicheMeta = niche ? NICHES[niche] : null;
  const countryMeta = country ? COUNTRIES[country] : null;
  return (
    <div
      className="rounded-2xl border border-border-soft bg-surface/60 p-3"
      style={{ boxShadow: `0 8px 24px -16px ${color}55` }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-wider"
        style={{ color }}
      >
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-sm font-medium text-text">
          {nicheMeta?.label ?? "—"}
        </span>
        <span className="text-xs text-text-muted">×</span>
        <span className="text-sm text-text">
          {countryMeta ? `${countryMeta.flag} ${countryMeta.code}` : "—"}
        </span>
      </div>
      <div className="mt-1 font-mono text-[11px] text-text-muted">{stat}</div>
      {cta && (
        <a
          href={cta}
          className="mt-2 inline-flex text-[11px] font-medium text-aurora-pink hover:text-aurora-purple"
        >
          Scan this →
        </a>
      )}
    </div>
  );
}

/**
 * Pick a credible "untapped" niche × country combo — one of the user's
 * top countries crossed with a top niche they haven't actually run there.
 */
function pickUntapped(
  matrix: NicheCountryCell[],
): { niche: Niche; country: string } | null {
  if (matrix.length === 0) return null;
  const nicheTotals = new Map<Niche, number>();
  const countryTotals = new Map<string, number>();
  for (const c of matrix) {
    nicheTotals.set(c.niche, (nicheTotals.get(c.niche) ?? 0) + c.count);
    countryTotals.set(c.country, (countryTotals.get(c.country) ?? 0) + c.count);
  }
  const topNiches = [...nicheTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
  const topCountries = [...countryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
  const explored = new Set(matrix.map((c) => `${c.niche}::${c.country}`));
  for (const n of topNiches) {
    for (const c of topCountries) {
      if (!explored.has(`${n}::${c}`)) {
        return { niche: n, country: c };
      }
    }
  }
  return null;
}
