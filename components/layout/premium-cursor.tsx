"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { usePreferences } from "@/lib/store/preferences";

/**
 * A small accent-colored dot that follows the cursor with spring physics.
 * Grows into a ring when hovering interactive elements.
 *
 * Hidden on touch devices (no hover) and respects prefers-reduced-motion.
 */
export function PremiumCursor() {
  const enabled = usePreferences((s) => s.premiumCursor);
  const reduce = useReducedMotion();
  const cx = useMotionValue(0);
  const cy = useMotionValue(0);
  const x = useSpring(cx, { stiffness: 600, damping: 36, mass: 0.35 });
  const y = useSpring(cy, { stiffness: 600, damping: 36, mass: 0.35 });
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || reduce) return;
    // Don't show on touch devices.
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;

    document.documentElement.dataset.premiumCursor = "on";
    return () => {
      delete document.documentElement.dataset.premiumCursor;
    };
  }, [enabled, reduce]);

  useEffect(() => {
    if (!enabled || reduce) return;
    const move = (e: PointerEvent) => {
      cx.set(e.clientX);
      cy.set(e.clientY);
    };
    const enter = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!ringRef.current || !target) return;
      const interactive = target.closest(
        'button, a, [role="button"], [role="tab"], [role="switch"], [role="radio"], [role="option"], input, textarea, select, label',
      );
      ringRef.current.dataset.over = interactive ? "1" : "0";
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", enter, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", enter);
    };
  }, [cx, cy, enabled, reduce]);

  if (!enabled || reduce) return null;

  return (
    <>
      {/* The dot */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[120] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-go shadow-[0_0_14px_rgba(0,210,106,0.85)] mix-blend-normal"
        style={{ x: cx, y: cy }}
      />
      {/* The trailing ring — bigger when over interactive elements */}
      <motion.div
        ref={ringRef}
        aria-hidden
        data-over="0"
        className="pointer-events-none fixed left-0 top-0 z-[119] h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-go/55 transition-[width,height,border-color,background-color] duration-200 ease-out data-[over=1]:h-10 data-[over=1]:w-10 data-[over=1]:border-go data-[over=1]:bg-go/10"
        style={{ x, y }}
      />
      {/* Hide native cursor on supporting surfaces */}
      <style>{`
        html[data-premium-cursor="on"],
        html[data-premium-cursor="on"] body,
        html[data-premium-cursor="on"] * {
          cursor: none !important;
        }
        /* Don't hide text caret in inputs */
        html[data-premium-cursor="on"] input,
        html[data-premium-cursor="on"] textarea {
          cursor: text !important;
        }
      `}</style>
    </>
  );
}
