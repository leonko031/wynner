"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Tooltip,
  type TooltipProps,
} from "recharts";
import { CheckCircle2 } from "lucide-react";
import { useIsClient } from "@/lib/hooks";
import {
  getCountryNotes,
  getRadarAxes,
} from "@/lib/scoring/projections";
import { COUNTRIES } from "@/lib/data/countries";
import type { Product, Verdict } from "@/types";

const VERDICT_CLR: Record<Verdict, string> = {
  go: "#00D26A",
  test: "#F5A623",
  risky: "#F97316",
  skip: "#EF4444",
};

function useMeasured() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      const h = Math.floor(entry.contentRect.height);
      if (w > 0 && h > 0) setSize({ width: w, height: h });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, ...size };
}

function RadarTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  const datum = p.payload as { axis: string; hint: string; value: number };
  return (
    <div className="max-w-[220px] rounded-md border border-border-strong bg-surface-elevated/95 px-2.5 py-1.5 text-xs shadow-xl backdrop-blur-sm">
      <div className="font-medium text-text">
        {datum.axis} <span className="font-mono text-text-dim">· {datum.value}</span>
      </div>
      <div className="mt-0.5 text-text-muted">{datum.hint}</div>
    </div>
  );
}

export function CountryRadar({ product }: { product: Product }) {
  const isClient = useIsClient();
  const country = COUNTRIES[product.targetCountry];
  const color = VERDICT_CLR[product.verdict];
  const data = useMemo(() => getRadarAxes(product, country), [product, country]);
  const notes = useMemo(() => getCountryNotes(country, product), [country, product]);
  const { ref, width, height } = useMeasured();

  return (
    <section>
      <h2 className="mb-4 text-xl font-medium tracking-tight md:text-2xl">
        Country fit · {country.flag} {country.name}
      </h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Chart */}
        <div className="rounded-2xl border border-border-soft bg-surface/40 p-4">
          <div ref={ref} className="h-72 w-full">
            {isClient && width > 0 && height > 0 ? (
              <RadarChart
                width={width}
                height={height}
                data={data}
                margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
              >
                <PolarGrid stroke="#2A2A2F" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fill={color}
                  fillOpacity={0.2}
                  animationDuration={900}
                  isAnimationActive
                />
                <Tooltip content={<RadarTooltip />} />
              </RadarChart>
            ) : null}
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-border-soft bg-surface/40 p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Country-specific notes
          </div>
          <ul className="mt-3 space-y-2.5">
            {notes.map((n, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-text">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color }}
                />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
