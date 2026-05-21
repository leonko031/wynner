"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DayBucket } from "@/lib/insights/aggregates";

type Mode = "calendar" | "distribution" | "timeOfDay";

type Props = {
  byDay: DayBucket[];
  byHour: { hour: number; count: number }[];
  byScoreBucket: { bucket: string; min: number; max: number; count: number }[];
};

const VERDICT_COLOR: Record<string, string> = {
  go: "#3DD68C",
  test: "#FFAB40",
  risky: "#FF7E5F",
  skip: "#FF5C7C",
};

export function ScanningRhythm({ byDay, byHour, byScoreBucket }: Props) {
  const [mode, setMode] = useState<Mode>("calendar");

  const totalScans = byDay.reduce((s, d) => s + d.count, 0);
  // Peak hour insight for the time-of-day chart.
  const peakHour = byHour.reduce(
    (best, h) => (h.count > best.count ? h : best),
    { hour: 0, count: 0 },
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="glass rounded-3xl p-6"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl text-text">Your scanning rhythm</h3>
          <p className="mt-1 text-xs text-text-muted">
            Pattern over the selected period · {totalScans} scans
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-surface/60 p-1">
          <ModeBtn current={mode} value="calendar" onClick={setMode}>
            Calendar
          </ModeBtn>
          <ModeBtn current={mode} value="distribution" onClick={setMode}>
            Distribution
          </ModeBtn>
          <ModeBtn current={mode} value="timeOfDay" onClick={setMode}>
            Time of day
          </ModeBtn>
        </div>
      </div>

      {mode === "calendar" && <CalendarHeatmap days={byDay} />}
      {mode === "distribution" && <DistributionChart data={byScoreBucket} />}
      {mode === "timeOfDay" && (
        <TimeOfDayChart hours={byHour} peakHour={peakHour} />
      )}
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */

function ModeBtn({
  current,
  value,
  onClick,
  children,
}: {
  current: Mode;
  value: Mode;
  onClick: (m: Mode) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={
        active
          ? "rounded-full bg-surface px-3 py-1 text-xs text-text shadow-sm"
          : "rounded-full px-3 py-1 text-xs text-text-muted hover:text-text"
      }
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Calendar heatmap                                                            */
/* -------------------------------------------------------------------------- */

function heatColor(count: number, avg: number): string {
  if (count === 0) return "rgba(0,0,0,0.04)";
  // High average = aurora-mint, low average = aurora-peach
  if (avg >= 75) return "rgba(61,214,140,0.85)";
  if (avg >= 60) return "rgba(91,141,255,0.65)";
  if (avg >= 45) return "rgba(167,136,255,0.55)";
  return "rgba(255,176,136,0.55)";
}

function CalendarHeatmap({ days }: { days: DayBucket[] }) {
  // Group into weeks (Sun..Sat). Pad to full weeks at the start.
  const padded: (DayBucket | null)[] = [...days];
  const firstDate = days[0]?.date;
  if (firstDate) {
    const firstDay = new Date(firstDate).getDay(); // 0=Sun
    for (let i = 0; i < firstDay; i++) padded.unshift(null);
  }
  const weeks: (DayBucket | null)[][] = [];
  for (let w = 0; w < Math.ceil(padded.length / 7); w++) {
    weeks.push(padded.slice(w * 7, (w + 1) * 7));
  }

  return (
    <div className="flex items-start gap-3 overflow-x-auto pb-1">
      <div className="flex items-end gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-rows-7 gap-[3px]">
            {Array.from({ length: 7 }).map((_, di) => {
              const cell = week[di];
              if (!cell) {
                return (
                  <div
                    key={di}
                    className="h-3 w-3 rounded-[2px] bg-transparent"
                  />
                );
              }
              return (
                <Tooltip key={di} delayDuration={50}>
                  <TooltipTrigger asChild>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.4 }}
                      transition={{ duration: 0.15 }}
                      // /vault is gone — calendar heatmap is now display-only.
                      // (No drill destination per-day in the rest of the app.)
                      className="h-3 w-3 rounded-[2px] border border-border-soft/60"
                      style={{
                        backgroundColor: heatColor(cell.count, cell.avgScore),
                        cursor: "default",
                      }}
                      aria-label={`${cell.date}: ${cell.count} scans`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="font-medium text-text">
                      {format(parseISO(cell.date), "MMM d, yyyy")}
                    </div>
                    {cell.count === 0 ? (
                      <div className="text-text-muted">no activity</div>
                    ) : (
                      <>
                        <div className="text-text-muted">
                          {cell.count} scan{cell.count === 1 ? "" : "s"} · avg{" "}
                          <span className="font-mono">{cell.avgScore}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px]">
                          {(["go", "test", "risky", "skip"] as const).map(
                            (v) =>
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
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>
      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="ml-2 flex flex-col items-start gap-1 font-mono text-[9px] uppercase tracking-wider text-text-dim">
      <span>Quality</span>
      <div className="flex items-center gap-1">
        <span>Low</span>
        {[
          "rgba(255,176,136,0.55)",
          "rgba(167,136,255,0.55)",
          "rgba(91,141,255,0.65)",
          "rgba(61,214,140,0.85)",
        ].map((c, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: c }}
          />
        ))}
        <span>High</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Distribution chart                                                          */
/* -------------------------------------------------------------------------- */

type ChartTipPayload = {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { bucket?: string } }>;
};

function ChartTip(props: ChartTipPayload) {
  const { active, payload } = props;
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0];
  const bucket = p.payload?.bucket;
  return (
    <div className="rounded-md border border-border-strong bg-surface-elevated/95 px-2.5 py-1.5 text-xs shadow-xl backdrop-blur-sm">
      <div className="font-mono tabular-nums text-text">
        {bucket ?? "—"}: {p.value} scans
      </div>
    </div>
  );
}

function DistributionChart({
  data,
}: {
  data: { bucket: string; min: number; max: number; count: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <XAxis
            dataKey="bucket"
            tick={{ fill: "#9DA0BF", fontSize: 10, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <RTooltip cursor={{ fill: "rgba(167,136,255,0.05)" }} content={<ChartTip />} />
          <Bar
            dataKey="count"
            radius={[6, 6, 0, 0]}
            // /vault is gone — distribution bars are now display-only.
          >
            {data.map((d, i) => {
              const v =
                d.min >= 80 ? "go" : d.min >= 60 ? "test" : d.min >= 40 ? "risky" : "skip";
              return <Cell key={i} fill={VERDICT_COLOR[v]} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Time of day chart                                                           */
/* -------------------------------------------------------------------------- */

function TimeOfDayChart({
  hours,
  peakHour,
}: {
  hours: { hour: number; count: number }[];
  peakHour: { hour: number; count: number };
}) {
  const max = Math.max(1, ...hours.map((h) => h.count));
  const center = 130;
  const innerR = 35;
  const outerR = 110;

  return (
    <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:gap-8">
      <svg width={260} height={260} viewBox="0 0 260 260" className="shrink-0">
        <defs>
          <radialGradient id="rhythm-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A788FF" stopOpacity="0" />
            <stop offset="100%" stopColor="#A788FF" stopOpacity="0.7" />
          </radialGradient>
        </defs>
        {hours.map((h) => {
          const startAngle = (h.hour / 24) * 2 * Math.PI - Math.PI / 2;
          const endAngle = ((h.hour + 1) / 24) * 2 * Math.PI - Math.PI / 2;
          const r = innerR + (h.count / max) * (outerR - innerR);
          const x1 = center + innerR * Math.cos(startAngle);
          const y1 = center + innerR * Math.sin(startAngle);
          const x2 = center + r * Math.cos(startAngle);
          const y2 = center + r * Math.sin(startAngle);
          const x3 = center + r * Math.cos(endAngle);
          const y3 = center + r * Math.sin(endAngle);
          const x4 = center + innerR * Math.cos(endAngle);
          const y4 = center + innerR * Math.sin(endAngle);
          const opacity = 0.3 + 0.7 * (h.count / max);
          return (
            <Tooltip key={h.hour} delayDuration={50}>
              <TooltipTrigger asChild>
                <path
                  d={`M ${x1} ${y1} L ${x2} ${y2} A ${r} ${r} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 0 0 ${x1} ${y1} Z`}
                  fill="url(#rhythm-grad)"
                  fillOpacity={opacity}
                  stroke="rgba(167,136,255,0.6)"
                  strokeWidth={0.5}
                />
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                <div className="font-mono">
                  {h.hour.toString().padStart(2, "0")}:00 · {h.count} scan
                  {h.count === 1 ? "" : "s"}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {/* Hour markers */}
        {[0, 6, 12, 18].map((h) => {
          const a = (h / 24) * 2 * Math.PI - Math.PI / 2;
          const x = center + (outerR + 12) * Math.cos(a);
          const y = center + (outerR + 12) * Math.sin(a);
          return (
            <text
              key={h}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill="#9DA0BF"
              fontFamily="monospace"
            >
              {h}h
            </text>
          );
        })}
      </svg>
      <div className="flex-1 self-center">
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          Peak focus window
        </div>
        <p className="mt-1 font-serif text-2xl text-text">
          {peakHour.count > 0
            ? `${peakHour.hour}:00 — ${peakHour.hour + 1}:00`
            : "No clear pattern yet"}
        </p>
        <p className="mt-2 max-w-md text-sm text-text-muted">
          {peakHour.count > 0
            ? `Most of your scans happen here. Try blocking this hour for deep research.`
            : `Once you've scanned consistently for a week, your peak focus window appears here.`}
        </p>
      </div>
    </div>
  );
}
