"use client";

import { useCallback } from "react";
import {
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionStyle,
} from "framer-motion";

/**
 * Subtle 3D tilt that follows the cursor. Max ~4° on each axis. Designed to be
 * felt-but-not-seen; respects prefers-reduced-motion.
 *
 * Uses `e.currentTarget` for the bounding rect so we don't need to share a
 * ref between the hook and the consumer (keeps React 19 ref-purity rules
 * happy).
 */
export function useSubtleTilt(max = 4) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0); // -1..1
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 220, damping: 22, mass: 0.3 });
  const sy = useSpring(py, { stiffness: 220, damping: 22, mass: 0.3 });

  const rotateY = useTransform(sx, [-1, 1], [-max, max]);
  const rotateX = useTransform(sy, [-1, 1], [max, -max]);

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (reduce) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      px.set(Math.max(-1, Math.min(1, nx)));
      py.set(Math.max(-1, Math.min(1, ny)));
    },
    [reduce, px, py],
  );
  const onLeave = useCallback(() => {
    px.set(0);
    py.set(0);
  }, [px, py]);

  const style: MotionStyle = reduce
    ? {}
    : {
        rotateX,
        rotateY,
        transformPerspective: 800,
        transformStyle: "preserve-3d",
      };

  return { style, onMove, onLeave, disabled: Boolean(reduce) };
}
