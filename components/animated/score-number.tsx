"use client";

import CountUp from "react-countup";
import { cn } from "@/lib/utils";

type ScoreNumberProps = {
  value: number;
  duration?: number;
  className?: string;
  decimals?: number;
  suffix?: string;
};

export function ScoreNumber({
  value,
  duration = 1.4,
  className,
  decimals = 0,
  suffix,
}: ScoreNumberProps) {
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      <CountUp
        end={value}
        duration={duration}
        decimals={decimals}
        easingFn={(t, b, c, d) => {
          // easeOutExpo
          return t === d ? b + c : c * (-Math.pow(2, -10 * (t / d)) + 1) + b;
        }}
        preserveValue
      />
      {suffix}
    </span>
  );
}
