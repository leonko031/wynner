"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type PulseDotProps = {
  color?: string;
  size?: number;
  className?: string;
};

export function PulseDot({
  color = "#00D26A",
  size = 8,
  className,
}: PulseDotProps) {
  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
        animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
      <span
        className="relative inline-flex rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
    </span>
  );
}
