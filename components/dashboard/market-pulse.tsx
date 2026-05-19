"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { useProductStore } from "@/lib/store/products";
import { useIsClient } from "@/lib/hooks";
import {
  getNicheBarData,
  getScansOverTime,
  getVerdictDistribution,
} from "@/lib/data/chart-helpers";

function useMeasuredSize() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      const h = Math.floor(entry.contentRect.height);
      if (w > 0 && h > 0) setSize({ width: w, height: h });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, ...size };
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface p-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-text">{title}</h3>
        {subtitle && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            {subtitle}
          </span>
        )}
      </div>
      <div className="h-48 w-full">{children}</div>
    </div>
  );
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
          <span className="font-mono tabular-nums text-text">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

const HotNichesChart = memo(function HotNichesChart() {
  const products = useProductStore((s) => s.products);
  const data = useMemo(() => getNicheBarData(products), [products]);
  const { ref, width, height } = useMeasuredSize();
  return (
    <div ref={ref} className="h-full w-full">
      {width > 0 && height > 0 ? (
        <BarChart
          data={data}
          width={width}
          height={height}
          margin={{ top: 6, right: 24, left: 0, bottom: 0 }}
          layout="vertical"
        >
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={<ChartTooltip />}
          />
          <Bar
            dataKey="avgScore"
            radius={[4, 4, 4, 4]}
            animationDuration={1000}
            animationEasing="ease-out"
            label={{
              position: "right",
              fill: "#FAFAFA",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
          >
            {data.map((d) => (
              <Cell key={d.niche} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      ) : null}
    </div>
  );
});

const VerdictDonut = memo(function VerdictDonut() {
  const products = useProductStore((s) => s.products);
  const data = useMemo(() => getVerdictDistribution(products), [products]);
  const total = data.reduce((s, d) => s + d.value, 0);
  const { ref, width, height } = useMeasuredSize();

  return (
    <div ref={ref} className="relative h-full w-full">
      {width > 0 && height > 0 ? (
        <PieChart width={width} height={height}>
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
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      ) : null}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-medium leading-none tabular-nums">
          {total}
        </span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-dim">
          products
        </span>
      </div>
    </div>
  );
});

const DiscoveryLine = memo(function DiscoveryLine() {
  const products = useProductStore((s) => s.products);
  const data = useMemo(() => getScansOverTime(products, 7), [products]);
  const { ref, width, height } = useMeasuredSize();
  return (
    <div ref={ref} className="h-full w-full">
      {width > 0 && height > 0 ? (
        <AreaChart
          data={data}
          width={width}
          height={height}
          margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
        >
          <defs>
            <linearGradient id="discovery-grad" x1="0" y1="0" x2="0" y2="1">
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
          <YAxis hide />
          <Tooltip cursor={{ stroke: "#2A2A2F" }} content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="scans"
            stroke="#00D26A"
            strokeWidth={2}
            fill="url(#discovery-grad)"
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
      ) : null}
    </div>
  );
});

export function MarketPulse() {
  const isClient = useIsClient();
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-medium tracking-tight md:text-2xl">
          Market pulse
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          Last updated 2 min ago
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <ChartCard title="Hot niches" subtitle="Top 5">
          {isClient ? <HotNichesChart /> : null}
        </ChartCard>
        <ChartCard title="Verdict mix" subtitle="All products">
          {isClient ? <VerdictDonut /> : null}
        </ChartCard>
        <ChartCard title="Discovery — 7d" subtitle="Scans / day">
          {isClient ? <DiscoveryLine /> : null}
        </ChartCard>
      </div>
    </section>
  );
}

export function MarketPulseSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-5 h-7 w-40 animate-pulse rounded-md bg-surface-elevated" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border border-border-soft bg-surface"
          />
        ))}
      </div>
    </section>
  );
}
