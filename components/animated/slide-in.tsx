"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { easings } from "@/lib/design";

type Direction = "left" | "right" | "up" | "down";

type SlideInProps = HTMLMotionProps<"div"> & {
  direction?: Direction;
  delay?: number;
  duration?: number;
};

const offset: Record<Direction, { x: number; y: number }> = {
  left: { x: -24, y: 0 },
  right: { x: 24, y: 0 },
  up: { x: 0, y: 24 },
  down: { x: 0, y: -24 },
};

export function SlideIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.55,
  ...rest
}: SlideInProps) {
  const { x, y } = offset[direction];
  return (
    <motion.div
      initial={{ opacity: 0, x, y }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay, duration, ease: easings.standard }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
