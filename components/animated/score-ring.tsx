"use client";

import { motion } from "framer-motion";
import { ScoreNumber } from "./score-number";
import { cn } from "@/lib/utils";

type Verdict = "go" | "test" | "risky" | "skip";

type ScoreRingProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  /** Adds a slow rotating dashed outer ring — suggests "live scanning". */
  scanning?: boolean;
};

const verdictHex: Record<Verdict, string> = {
  go: "#00D26A",
  test: "#F5A623",
  risky: "#F97316",
  skip: "#EF4444",
};

function verdictFromScore(value: number): Verdict {
  if (value >= 75) return "go";
  if (value >= 55) return "test";
  if (value >= 35) return "risky";
  return "skip";
}

export function ScoreRing({
  value,
  size = 80,
  strokeWidth = 6,
  className,
  label,
  scanning = false,
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const verdict = verdictFromScore(clamped);
  const stroke = verdictHex[verdict];

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const outerRadius = radius + strokeWidth + 4;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {scanning && (
        <motion.svg
          aria-hidden
          width={size + 16}
          height={size + 16}
          viewBox={`0 0 ${size + 16} ${size + 16}`}
          className="pointer-events-none absolute"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
        >
          <circle
            cx={(size + 16) / 2}
            cy={(size + 16) / 2}
            r={outerRadius}
            fill="none"
            stroke={stroke}
            strokeOpacity={0.35}
            strokeWidth={1}
            strokeDasharray="4 8"
          />
        </motion.svg>
      )}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            filter: `drop-shadow(0 0 8px ${stroke}66)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <ScoreNumber
          value={clamped}
          className="text-lg font-semibold leading-none"
          duration={1.4}
        />
        {label && (
          <span className="mt-0.5 text-[10px] uppercase tracking-wider text-text-dim">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
