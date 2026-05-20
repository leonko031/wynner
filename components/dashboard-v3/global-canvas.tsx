"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

/**
 * Page-level environment for the cinematic /dashboard.
 *
 * Three fixed layers behind everything:
 *   1. Animated aurora mesh — 90s drift loop, low opacity (8% light / 15% dark)
 *   2. SVG turbulence noise — adds tactile grain (kills the "flat web app" look)
 *   3. Soft corner vignette — frames the page edges
 *
 * The mesh itself parallaxes at 0.3x scroll speed for background depth.
 * Respects prefers-reduced-motion (everything goes static).
 */
export function GlobalCanvas() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const meshY = useTransform(scrollY, [0, 1000], [0, -300]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ contain: "strict" }}
    >
      {/* Base — warm off-white (light) / deep navy (dark). The body already
          sets a default; we lay this on top so the canvas is consistent
          regardless of which page-level bg the layout chose. */}
      <div
        className="absolute inset-0 bg-[#FCFCFD] dark:bg-[#0A0B1F]"
        data-theme-base
      />

      {/* Layer 1 — Aurora mesh */}
      <motion.div
        className="absolute inset-0"
        style={{ y: reduce ? 0 : meshY }}
      >
        <AuroraMesh />
      </motion.div>

      {/* Layer 2 — Noise turbulence */}
      <div
        className="absolute inset-0 mix-blend-overlay opacity-[0.025] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(NOISE_SVG)}")`,
          backgroundSize: "240px 240px",
        }}
      />

      {/* Layer 3 — Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 60%, rgba(26,27,58,0.05) 100%)",
        }}
      />
    </div>
  );
}

function AuroraMesh() {
  const reduce = useReducedMotion();
  // Three blurred radial gradients drifting on a 90-second loop. Different
  // colors, different offsets, light enough to be barely there in light mode
  // and visibly present in dark.
  return (
    <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.18]">
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(closest-side, #5B8DFF, transparent 65%)",
          width: "60%",
          height: "60%",
          left: "8%",
          top: "12%",
          filter: "blur(90px)",
        }}
        animate={reduce ? undefined : { x: [0, 60, -40, 0], y: [0, -30, 40, 0] }}
        transition={{ duration: 90, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(closest-side, #A788FF, transparent 65%)",
          width: "55%",
          height: "55%",
          right: "10%",
          top: "30%",
          filter: "blur(90px)",
        }}
        animate={reduce ? undefined : { x: [0, -50, 30, 0], y: [0, 40, -30, 0] }}
        transition={{ duration: 100, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(closest-side, #FFB088, transparent 65%)",
          width: "50%",
          height: "50%",
          left: "30%",
          bottom: "10%",
          filter: "blur(90px)",
        }}
        animate={reduce ? undefined : { x: [0, 40, -50, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 110, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// Small turbulence SVG, encoded inline so we don't need a separate asset.
const NOISE_SVG = `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0"/>
  </filter>
  <rect width="240" height="240" filter="url(#n)"/>
</svg>`;

/* -------------------------------------------------------------------------- */
/* Initial-load curtain — black-to-aurora fade with the Wynner wordmark.      */
/* Mounts once per page navigation; lifts after ~600ms.                        */
/* -------------------------------------------------------------------------- */

export function LoadCurtain({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: reduce ? 0.2 : 0.55, delay: reduce ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={onDone}
      className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-[#0A0B1F]"
    >
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2"
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{
            background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
          }}
        />
        <span
          className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/80"
        >
          Wynner
        </span>
      </motion.div>
    </motion.div>
  );
}
