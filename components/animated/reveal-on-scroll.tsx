"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { easings } from "@/lib/design";

type RevealOnScrollProps = HTMLMotionProps<"div"> & {
  delay?: number;
  amount?: number;
};

export function RevealOnScroll({
  children,
  delay = 0,
  amount = 0.3,
  ...rest
}: RevealOnScrollProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.6, ease: easings.standard, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
