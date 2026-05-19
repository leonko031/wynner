"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { format } from "date-fns";
import {
  Activity,
  Crown,
  Flame,
  Globe2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { ScoreNumber } from "@/components/animated/score-number";
import { useProductStore } from "@/lib/store/products";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import { useIsClient } from "@/lib/hooks";
import { getVerdictDistribution } from "@/lib/data/chart-helpers";
import type { Product, Niche } from "@/types";
import { cn } from "@/lib/utils";

function dayKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

function buildScoreOverTime(products: Product[]): { day: string; avg: number; n: number }[] {
  // Group by createdAt day; running avg per day
  const byDay = new Map<string, number[]>();
  for (const p of products) {
    const k = dayKey(p.createdAt);
    const arr = byDay.get(k) ?? [];
    arr.push(p.sellScore);
    byDay.set(k, arr);
  }
  const sortedDays = Array.from(byDay.keys()).sort();
  return sortedDays.map((d) => {
    const arr = byDay.get(d) ?? [];
    return {
      day: d,
      avg: Math.round(arr.reduce((s, n) => s + n, 0) / arr.length),
      n: arr.length,
    };
  });
}

function bestByGroup<T extends string>(
  products: Product[],
  pick: (p: Product) => T,
  label: (key: T) => string,
): { key: T; label: string; avg: number; count: number } | null {
  const groups = new Map<T, number[]>();
  for (const p of products) {
    const k = pick(p);
    const arr = groups.get(k) ?? [];
    arr.push(p.sellScore);
    groups.set(k, arr);
  }
  let best: { key: T; label: string; avg: number; count: number } | null = null;
  for (const [k, arr] of groups) {
    if (arr.length < 1) continue;
    const avg = arr.reduce((s, n) => s + n, 0) / arr.length;
    if (!best || avg > best.avg) {
      best = { key: k, label: label(k), avg: Math.round(avg), count: arr.length };
    }
  }
  return best;
}

function buildHeatmap(products: Product[]): { date: string; count: number }[] {
  // 12-week (84 day) heatmap ending today.
  const today = new Date();
  const days: { date: string; count: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  const map = new Map(days.map((d) => [d.date, d]));
  for (const p of products) {
    const cell = map.get(dayKey(p.createdAt));
    if (cell) cell.count += 1;
  }
  return days;
}

function heatColor(n: number): string {
  if (n === 0) return "#16161A";
  if (n <= 1) return "rgba(0, 210, 106, 0.25)";
  if (n <= 3) return "rgba(0, 210, 106, 0.5)";
  if (n <= 6) return "rgba(0, 210, 106, 0.75)";
  return "#00D26A";
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-border-strong bg-surface-elevated/95 px-2.5 py-1.5 text-xs shadow-xl backdrop-blur-sm">
      {label !== undefined && (
        <div className="mb-0.5 text-text-muted">{String(label)}</div>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-mono tabular-nums text-text">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function InsightsPage() {
  const products = useProductStore((s) => s.products);
  const isClient = useIsClient();

  const total = products.length;
  const avgScore =
    total > 0
      ? Math.round(products.reduce((s, p) => s + p.sellScore, 0) / total)
      : 0;
  const verdictDist = useMemo(
    () => getVerdictDistribution(products),
    [products],
  );
  const overTime = useMemo(() => buildScoreOverTime(products), [products]);
  const topFive = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.sellScore - a.sellScore)
        .slice(0, 5),
    [products],
  );
  const heatmap = useMemo(() => buildHeatmap(products), [products]);
  const bestNiche = useMemo(
    () =>
      bestByGroup<Niche>(
        products,
        (p) => p.category,
        (k) => NICHES[k].label,
      ),
    [products],
  );
  const bestCountry = useMemo(
    () =>
      bestByGroup<string>(
        products,
        (p) => p.targetCountry,
        (k) => `${COUNTRIES[k]?.flag ?? ""} ${COUNTRIES[k]?.name ?? k}`,
      ),
    [products],
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/60 px-3 py-1 text-xs text-text-muted">
            <Activity className="h-3 w-3" />
            Your usage
          </div>
          <h1 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">
            Insights
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Patterns from your scoring history. Local-only.
          </p>
        </div>
      </header>

      {/* Top stat row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          icon={Activity}
          label="Total scored"
          value={<ScoreNumber value={total} className="text-3xl" />}
          accent="#9CA3AF"
        />
        <Stat
          icon={TrendingUp}
          label="Avg score"
          value={<ScoreNumber value={avgScore} className="text-3xl" />}
          accent="#00D26A"
        />
        {bestNiche && (
          <Stat
            icon={Flame}
            label="Best niche"
            value={
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl tabular-nums">
                  {bestNiche.avg}
                </span>
                <span className="text-sm text-text-muted">{bestNiche.label}</span>
              </div>
            }
            accent={NICHES[bestNiche.key].color}
          />
        )}
        {bestCountry && (
          <Stat
            icon={Globe2}
            label="Best country"
            value={
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl tabular-nums">
                  {bestCountry.avg}
                </span>
                <span className="text-sm text-text-muted">
                  {bestCountry.label}
                </span>
              </div>
            }
            accent="#3B82F6"
          />
        )}
      </div>

      {/* Charts */}
      <section className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Avg score over time */}
        <div className="rounded-2xl border border-border-soft bg-surface p-5 md:col-span-2">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-text">Avg score over time</h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              By day · {overTime.length} pts
            </span>
          </div>
          <div className="h-56 w-full">
            {isClient && overTime.length > 0 ? (
              <ResponsiveArea data={overTime} />
            ) : (
              <EmptyChart text="No history yet" />
            )}
          </div>
        </div>

        {/* Verdict donut */}
        <div className="rounded-2xl border border-border-soft bg-surface p-5">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-text">Verdict mix</h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              All products
            </span>
          </div>
          <div className="relative h-56 w-full">
            {isClient && total > 0 ? (
              <ResponsiveDonut data={verdictDist} total={total} />
            ) : (
              <EmptyChart text="No products yet" />
            )}
          </div>
        </div>
      </section>

      {/* Top 5 */}
      <section className="mt-8 rounded-2xl border border-border-soft bg-surface p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-text">Top 5 of all time</h2>
          <Crown className="h-3.5 w-3.5 text-go" />
        </div>
        {topFive.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-text-muted">
            Score your first product to populate this list.
          </p>
        ) : (
          <ol className="divide-y divide-border-soft">
            {topFive.map((p, i) => (
              <li
                key={p.id}
                className="grid grid-cols-[24px_1fr_60px_80px] items-center gap-3 py-2.5"
              >
                <span className="font-mono text-xs tabular-nums text-text-dim">
                  #{i + 1}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm text-text">{p.name}</div>
                  <div className="font-mono text-[10px] text-text-dim">
                    {NICHES[p.category].label} · {COUNTRIES[p.targetCountry]?.flag} {p.targetCountry}
                  </div>
                </div>
                <span className="font-mono text-sm tabular-nums text-text">
                  {p.sellScore}
                </span>
                <span
                  className="justify-self-end inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider"
                  style={{
                    backgroundColor:
                      p.verdict === "go"
                        ? "rgba(0,210,106,0.15)"
                        : p.verdict === "test"
                          ? "rgba(245,166,35,0.15)"
                          : p.verdict === "risky"
                            ? "rgba(249,115,22,0.15)"
                            : "rgba(239,68,68,0.15)",
                    color:
                      p.verdict === "go"
                        ? "#00D26A"
                        : p.verdict === "test"
                          ? "#F5A623"
                          : p.verdict === "risky"
                            ? "#F97316"
                            : "#EF4444",
                  }}
                >
                  {p.verdict.toUpperCase()}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Heatmap */}
      <section className="mt-8 rounded-2xl border border-border-soft bg-surface p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-text">Scoring activity</h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Last 12 weeks
          </span>
        </div>
        <Heatmap days={heatmap} />
      </section>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          {label}
        </span>
      </div>
      <div className="mt-3 leading-none">{value}</div>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">
      {text}
    </div>
  );
}

function ResponsiveArea({
  data,
}: {
  data: { day: string; avg: number; n: number }[];
}) {
  const series = data.map((d) => ({
    day: d.day,
    avg: d.avg,
    label: format(new Date(d.day), "MMM d"),
  }));
  return (
    <AreaChart
      data={series}
      width={800}
      height={224}
      margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        <linearGradient id="insights-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00D26A" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#00D26A" stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis
        dataKey="label"
        tick={{ fill: "#6B7280", fontSize: 10 }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis hide domain={[0, 100]} />
      <RTooltip cursor={{ stroke: "#2A2A2F" }} content={<ChartTooltip />} />
      <Area
        type="monotone"
        dataKey="avg"
        stroke="#00D26A"
        strokeWidth={2}
        fill="url(#insights-grad)"
        animationDuration={900}
        animationEasing="ease-out"
        dot={false}
        activeDot={{
          r: 3,
          fill: "#00D26A",
          stroke: "#0A0A0B",
          strokeWidth: 2,
        }}
      />
    </AreaChart>
  );
}

function ResponsiveDonut({
  data,
  total,
}: {
  data: { verdict: string; label: string; color: string; value: number }[];
  total: number;
}) {
  return (
    <>
      <PieChart width={260} height={224} style={{ width: "100%", height: "100%" }}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={75}
          paddingAngle={2}
          stroke="#0A0A0B"
          strokeWidth={2}
          animationDuration={900}
          animationEasing="ease-out"
        >
          {data.map((d) => (
            <Cell key={d.verdict} fill={d.color} />
          ))}
        </Pie>
        <RTooltip content={<ChartTooltip />} />
      </PieChart>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-medium leading-none tabular-nums">
          {total}
        </span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-dim">
          products
        </span>
      </div>
    </>
  );
}

function Heatmap({ days }: { days: { date: string; count: number }[] }) {
  // Group into 12 columns × 7 rows (Sun..Sat).
  const weeks: { date: string; count: number }[][] = [];
  for (let w = 0; w < 12; w++) {
    weeks.push(days.slice(w * 7, (w + 1) * 7));
  }
  return (
    <div className="flex items-end gap-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-rows-7 gap-1">
          {week.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.count} scan${cell.count === 1 ? "" : "s"}`}
              className={cn(
                "h-3 w-3 rounded-sm transition-colors",
                cell.count === 0 && "border border-border-soft/60",
              )}
              style={{ backgroundColor: heatColor(cell.count) }}
            />
          ))}
        </div>
      ))}
      <div className="ml-3 flex items-center gap-1 self-start">
        <span className="font-mono text-[9px] uppercase tracking-wider text-text-dim">
          Less
        </span>
        {[0, 1, 3, 6, 10].map((n) => (
          <span
            key={n}
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: heatColor(n) }}
          />
        ))}
        <span className="font-mono text-[9px] uppercase tracking-wider text-text-dim">
          More
        </span>
      </div>
    </div>
  );
}
