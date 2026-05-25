"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { useEffect, useMemo } from "react";

/**
 * The hero AI orb on the waitlist page. ~280px diameter centerpiece — five
 * SVG layers + cursor-pull parallax. Same conceptual structure as the
 * cinematic scan orb but tuned for "luxurious idle" rather than "actively
 * thinking" — slightly slower breath, denser orbital nodes, halo lags the
 * core for layered parallax.
 *
 * Cursor pull: tracks the global pointer; the core translates ±12px toward
 * it on a stiffness=60/damping=20 spring. The outer halo follows with a
 * looser spring so it lags slightly — a subtle gravitational feeling.
 */

type Props = {
  size?: number;
};

export function WaitlistOrb({ size = 280 }: Props) {
  const reduce = useReducedMotion();
  const cx = size / 2;
  const cy = size / 2;
  const coreR = size * 0.21;
  const orbitRBase = size * 0.48;

  // Cursor-pull motion values — pixel offsets, max ±12px.
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  // Core spring (firmer, faster follow).
  const coreX = useSpring(targetX, { stiffness: 60, damping: 20, mass: 1 });
  const coreY = useSpring(targetY, { stiffness: 60, damping: 20, mass: 1 });
  // Halo spring (looser, lags behind for layered parallax).
  const haloX = useSpring(targetX, { stiffness: 28, damping: 22, mass: 1.4 });
  const haloY = useSpring(targetY, { stiffness: 28, damping: 22, mass: 1.4 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: MouseEvent) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Distance from viewport center, normalized to ±1.
      const nx = (e.clientX / vw) * 2 - 1;
      const ny = (e.clientY / vh) * 2 - 1;
      targetX.set(nx * 12);
      targetY.set(ny * 12);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduce, targetX, targetY]);

  return (
    <div
      aria-hidden
      className="relative"
      style={{ width: size, height: size, perspective: 1000 }}
    >
      {/* ── Layer 5: outer halo (lagging) ─────────────────────────────── */}
      <motion.div
        className="pointer-events-none absolute rounded-full"
        style={{
          left: -size * 0.15,
          top: -size * 0.15,
          width: size * 1.3,
          height: size * 1.3,
          background:
            "radial-gradient(closest-side, rgba(167,136,255,0.55), transparent 70%)",
          filter: "blur(60px)",
          x: haloX,
          y: haloY,
        }}
        animate={
          reduce
            ? undefined
            : { opacity: [0.7, 1, 0.7], scale: [0.96, 1.04, 0.96] }
        }
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── SVG core composition ──────────────────────────────────────── */}
      <motion.svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        style={{ display: "block", x: coreX, y: coreY }}
      >
        <defs>
          <radialGradient id="wl-orb-core" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="32%" stopColor="#A788FF" stopOpacity="0.85" />
            <stop offset="68%" stopColor="#5B8DFF" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#FF89C5" stopOpacity="0.25" />
          </radialGradient>
          <radialGradient id="wl-orb-highlight" cx="35%" cy="30%" r="35%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="wl-orb-nebula-a" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A788FF" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#A788FF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="wl-orb-nebula-b" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5B8DFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#5B8DFF" stopOpacity="0" />
          </radialGradient>
          <filter id="wl-orb-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={size * 0.045} />
          </filter>
        </defs>

        {/* Layer 3: pulse rings */}
        {!reduce && <PulseRings cx={cx} cy={cy} baseR={coreR * 1.1} />}

        {/* Layer 1+2: core sphere + inner nebula, both breathing */}
        <motion.g
          animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          <motion.g
            animate={reduce ? undefined : { rotate: [0, 360] }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            <circle cx={cx} cy={cy} r={coreR} fill="url(#wl-orb-core)" />
            <circle cx={cx} cy={cy} r={coreR} fill="url(#wl-orb-highlight)" />
          </motion.g>
          {!reduce && <InnerNebula cx={cx} cy={cy} r={coreR} />}
        </motion.g>

        {/* Layer 4: orbiting nodes */}
        {!reduce && <OrbitingNodes cx={cx} cy={cy} baseR={orbitRBase} />}
      </motion.svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function PulseRings({ cx, cy, baseR }: { cx: number; cy: number; baseR: number }) {
  // 3 staggered rings — one is always emanating.
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={cy}
          r={baseR}
          fill="none"
          stroke="#A788FF"
          strokeWidth={1.5}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: [0, 0.6, 0], scale: [1, 2.2, 2.2] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * 1.3,
          }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
    </>
  );
}

function InnerNebula({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g style={{ filter: "url(#wl-orb-blur)" }}>
      <motion.circle
        cx={cx}
        cy={cy}
        r={r * 0.55}
        fill="url(#wl-orb-nebula-a)"
        animate={{
          x: [-r * 0.3, r * 0.35, -r * 0.2, -r * 0.3],
          y: [-r * 0.2, r * 0.3, r * 0.1, -r * 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx={cx}
        cy={cy}
        r={r * 0.45}
        fill="url(#wl-orb-nebula-b)"
        animate={{
          x: [r * 0.3, -r * 0.25, r * 0.2, r * 0.3],
          y: [r * 0.15, -r * 0.3, -r * 0.1, r * 0.15],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
    </g>
  );
}

function OrbitingNodes({ cx, cy, baseR }: { cx: number; cy: number; baseR: number }) {
  const nodes = useMemo(
    () =>
      [
        { r: baseR * 0.9, dur: 10, start: 0, reverse: false },
        { r: baseR * 1.05, dur: 14, start: 72, reverse: true },
        { r: baseR * 0.95, dur: 18, start: 144, reverse: false },
        { r: baseR * 1.1, dur: 22, start: 216, reverse: true },
        { r: baseR * 1.0, dur: 12, start: 288, reverse: false },
      ],
    [baseR],
  );
  return (
    <g>
      {nodes.map((n, i) => (
        <motion.g
          key={i}
          animate={{ rotate: n.reverse ? -360 : 360 }}
          transition={{ duration: n.dur, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${cx}px ${cy}px`, rotate: `${n.start}deg` }}
        >
          <circle
            cx={cx + n.r}
            cy={cy}
            r={3}
            fill="#A788FF"
            style={{
              filter: "drop-shadow(0 0 5px rgba(167,136,255,0.85))",
            }}
          />
        </motion.g>
      ))}
    </g>
  );
}
