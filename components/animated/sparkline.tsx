"use client";

import { useEffect, useRef, useState } from "react";
import { Area, AreaChart } from "recharts";
import { useIsClient } from "@/lib/hooks/use-is-client";

type SparklineProps = {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
};

export function Sparkline({
  data,
  color = "#00D26A",
  height = 32,
  className,
}: SparklineProps) {
  const isClient = useIsClient();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      if (w > 0) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const series = data.map((value, index) => ({ index, value }));
  const gradientId = `spark-${color.replace("#", "")}`;
  const ready = isClient && width > 0;

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ height, width: "100%" }}
    >
      {ready ? (
        <AreaChart
          data={series}
          width={width}
          height={height}
          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive
            animationDuration={900}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      ) : null}
    </div>
  );
}
