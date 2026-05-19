import { cn } from "@/lib/utils";

/**
 * Aurora-tinted "spark" diamond used as the credit unit icon throughout the
 * app. Keeping it as a single shared component so the credit visual is always
 * recognizable at a glance.
 */
export function SparkIcon({
  className,
  size = 14,
  color = "currentColor",
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden
      className={cn("inline-block shrink-0", className)}
      style={{ color }}
    >
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5B8DFF" />
          <stop offset="55%" stopColor="#A788FF" />
          <stop offset="100%" stopColor="#FF89C5" />
        </linearGradient>
      </defs>
      <path
        d="M8 1 L9.6 6.4 L15 8 L9.6 9.6 L8 15 L6.4 9.6 L1 8 L6.4 6.4 Z"
        fill={color === "currentColor" ? "url(#spark-grad)" : color}
      />
    </svg>
  );
}
