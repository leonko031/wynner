"use client";

import { cn } from "@/lib/utils";

type ShimmerBoxProps = {
  width?: number | string;
  height?: number | string;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
};

const roundedMap: Record<NonNullable<ShimmerBoxProps["rounded"]>, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export function ShimmerBox({
  width = "100%",
  height = 16,
  rounded = "md",
  className,
}: ShimmerBoxProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-elevated",
        roundedMap[rounded],
        className,
      )}
      style={{ width, height }}
    >
      <div className="absolute inset-0 shimmer-bg" />
    </div>
  );
}
