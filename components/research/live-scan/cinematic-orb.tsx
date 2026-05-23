"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * The CinematicOrb is the centerpiece of the live scan experience.
 *
 * Five layered SVG strata, all composited inside a single ~400px square:
 *   1. Outer halo       — large blurred aurora gradient (~400px diameter)
 *   2. Pulse rings      — 3 staggered concentric strokes emanating outward
 *   3. Core sphere      — radial-gradient circle with slow hue rotation +
 *                          breath cycle scale 1.0 ↔ 1.05
 *   4. Inner nebula     — 2 overlapping blurred blobs drifting on
 *                          Lissajous-ish paths inside the core
 *   5. Orbiting nodes   — 6 small glowing dots circling at varying radii.
 *                          When a new source is discovered, one node
 *                          briefly brightens + emits an inward light line.
 *
 * State machine:
 *   idle       — gentle breath, slow orbit, no light streams
 *   thinking   — breath 4s → 2s, nebula faster, orbit +20% speed
 *   discovering — same as thinking + a periodic node-pulse trigger
 *   complete   — single large green-tinted ring expansion, then idle
 *   failing    — peach-amber tint, slower breath, smaller pulses
 *   recovering — back to normal palette, smaller pulses (degraded look)
 *
 * Reduced-motion: all rotations + drifts halt, breath cycle keeps a tiny
 * 1% scale change so the orb doesn't feel dead, but no looping motion.
 */

export type OrbState =
  | "idle"
  | "thinking"
  | "discovering"
  | "complete"
  | "failing"
  | "recovering";

type Props = {
  state: OrbState;
  size?: number;
  /**
   * Increment this number every time a new source is discovered. The orb
   * triggers a one-shot node-flash + inward light streak.
   */
  sourcePulseKey?: number;
};

export function CinematicOrb({ state, size = 400, sourcePulseKey = 0 }: Props) {
  const reduce = useReducedMotion();
  const cx = size / 2;
  const cy = size / 2;
  const coreR = size * 0.225;
  const orbitRBase = size * 0.32;

  // Per-state motion modifiers.
  const breathDur = state === "thinking" || state === "discovering" ? 2 : state === "failing" ? 6 : 4;
  const orbitDurMod = state === "thinking" || state === "discovering" ? 0.8 : 1;
  const haloOpacity =
    state === "complete" ? 0.5 : state === "failing" ? 0.25 : state === "recovering" ? 0.3 : 0.4;
  const tint =
    state === "failing"
      ? { core: "#FFB088", mid: "#FFAB40", outer: "#FF7E5F" }
      : state === "complete"
      ? { core: "#88E5C8", mid: "#3DD68C", outer: "#5B8DFF" }
      : { core: "#FFFFFF", mid: "#A788FF", outer: "#FF89C5" };

  return (
    <div
      aria-hidden
      className="pointer-events-none relative"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        style={{ display: "block" }}
      >
        <defs>
          {/* Core radial — bright center → soft purple → peach outer */}
          <radialGradient id="cinematic-orb-core" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor={tint.core} stopOpacity="0.95" />
            <stop offset="35%" stopColor={tint.mid} stopOpacity="0.78" />
            <stop offset="70%" stopColor="#5B8DFF" stopOpacity="0.5" />
            <stop offset="100%" stopColor={tint.outer} stopOpacity="0.18" />
          </radialGradient>
          <radialGradient id="cinematic-orb-highlight" cx="35%" cy="30%" r="35%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cinematic-orb-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={tint.mid} stopOpacity={haloOpacity * 0.6} />
            <stop offset="60%" stopColor={tint.outer} stopOpacity={haloOpacity * 0.25} />
            <stop offset="100%" stopColor={tint.outer} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cinematic-orb-nebula-a" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={tint.mid} stopOpacity="0.75" />
            <stop offset="100%" stopColor={tint.mid} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cinematic-orb-nebula-b" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5B8DFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#5B8DFF" stopOpacity="0" />
          </radialGradient>
          <filter id="cinematic-orb-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={size * 0.05} />
          </filter>
        </defs>

        {/* ── Layer 1 — Outer halo ─────────────────────────────────────── */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={size * 0.48}
          fill="url(#cinematic-orb-halo)"
          animate={
            reduce
              ? undefined
              : {
                  opacity: [haloOpacity * 0.85, haloOpacity, haloOpacity * 0.85],
                  scale: [0.95, 1, 0.95],
                }
          }
          transition={{ duration: breathDur * 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* ── Layer 2 — Pulse rings (3 staggered) ─────────────────────── */}
        {!reduce && (
          <PulseRings cx={cx} cy={cy} baseR={coreR * 1.1} tint={tint.mid} state={state} />
        )}

        {/* ── Layer 3 — Core sphere ───────────────────────────────────── */}
        <motion.g
          animate={reduce ? undefined : { scale: [1, 1.05, 1] }}
          transition={{ duration: breathDur, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          {/* Subtle hue rotation on the core. */}
          <motion.g
            animate={reduce ? undefined : { rotate: [0, 360] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            <circle cx={cx} cy={cy} r={coreR} fill="url(#cinematic-orb-core)" />
            <circle cx={cx} cy={cy} r={coreR} fill="url(#cinematic-orb-highlight)" />
          </motion.g>

          {/* Inner nebula — 2 drifting blobs (clipped to the core via mask) */}
          {!reduce && <InnerNebula cx={cx} cy={cy} r={coreR} state={state} />}
        </motion.g>

        {/* ── Layer 4 — Orbiting nodes ────────────────────────────────── */}
        {!reduce && (
          <OrbitingNodes
            cx={cx}
            cy={cy}
            baseR={orbitRBase}
            durMod={orbitDurMod}
            tint={tint.mid}
            sourcePulseKey={sourcePulseKey}
            state={state}
          />
        )}

        {/* ── Stage-complete burst (one-shot per state-enter) ─────────── */}
        <AnimatePresence>
          {state === "complete" && (
            <motion.circle
              key="complete-burst"
              cx={cx}
              cy={cy}
              r={coreR}
              fill="none"
              stroke="#3DD68C"
              strokeWidth={2}
              initial={{ opacity: 0.9, scale: 1 }}
              animate={{ opacity: 0, scale: 2.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pulse rings — 3 staggered concentric outward expansions                    */
/* -------------------------------------------------------------------------- */

function PulseRings({
  cx,
  cy,
  baseR,
  tint,
  state,
}: {
  cx: number;
  cy: number;
  baseR: number;
  tint: string;
  state: OrbState;
}) {
  // Smaller pulses when failing or recovering — orb looks diminished.
  const expand = state === "failing" || state === "recovering" ? 1.5 : 1.8;
  const dur = state === "thinking" || state === "discovering" ? 2.2 : 3.2;
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={cy}
          r={baseR}
          fill="none"
          stroke={tint}
          strokeWidth={2}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: [0, 0.7, 0], scale: [1, expand, expand] }}
          transition={{
            duration: dur,
            repeat: Infinity,
            ease: "easeOut",
            delay: (dur / 3) * i,
          }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Inner nebula — 2 blurred blobs drifting on Lissajous-ish paths             */
/* -------------------------------------------------------------------------- */

function InnerNebula({
  cx,
  cy,
  r,
  state,
}: {
  cx: number;
  cy: number;
  r: number;
  state: OrbState;
}) {
  const dur = state === "thinking" || state === "discovering" ? 6 : 10;
  return (
    <g style={{ filter: "url(#cinematic-orb-blur)" }}>
      <motion.circle
        cx={cx}
        cy={cy}
        r={r * 0.55}
        fill="url(#cinematic-orb-nebula-a)"
        animate={{
          x: [-r * 0.3, r * 0.35, -r * 0.2, -r * 0.3],
          y: [-r * 0.2, r * 0.3, r * 0.1, -r * 0.2],
        }}
        transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx={cx}
        cy={cy}
        r={r * 0.45}
        fill="url(#cinematic-orb-nebula-b)"
        animate={{
          x: [r * 0.3, -r * 0.25, r * 0.2, r * 0.3],
          y: [r * 0.15, -r * 0.3, -r * 0.1, r * 0.15],
        }}
        transition={{ duration: dur * 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/* Orbiting nodes — 6 dots on independent paths; flash on sourcePulseKey      */
/* -------------------------------------------------------------------------- */

function OrbitingNodes({
  cx,
  cy,
  baseR,
  durMod,
  tint,
  sourcePulseKey,
  state,
}: {
  cx: number;
  cy: number;
  baseR: number;
  durMod: number;
  tint: string;
  sourcePulseKey: number;
  state: OrbState;
}) {
  // Stable per-node config — radii, durations, phase offsets.
  const nodes = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        r: baseR * (0.85 + (i % 3) * 0.18),
        dur: (8 + i * 2) * durMod,
        startAngle: (i / 6) * 360,
        reverse: i % 2 === 0,
      })),
    [baseR, durMod],
  );

  // When sourcePulseKey changes, briefly highlight one node.
  const [flashedNode, setFlashedNode] = useState<number | null>(null);
  const lastPulseRef = useRef(0);
  useEffect(() => {
    if (sourcePulseKey === lastPulseRef.current) return;
    lastPulseRef.current = sourcePulseKey;
    const which = sourcePulseKey % nodes.length;
    setFlashedNode(which);
    const t = window.setTimeout(() => setFlashedNode(null), 900);
    return () => window.clearTimeout(t);
  }, [sourcePulseKey, nodes.length]);

  return (
    <g>
      {nodes.map((n, i) => (
        <motion.g
          key={i}
          animate={{ rotate: n.reverse ? -360 : 360 }}
          transition={{ duration: n.dur, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${cx}px ${cy}px`, rotate: `${n.startAngle}deg` }}
        >
          {/* The node itself */}
          <motion.circle
            cx={cx + n.r}
            cy={cy}
            r={3}
            fill={tint}
            animate={
              flashedNode === i
                ? { r: [3, 7, 3], opacity: [1, 1, 0.8] }
                : { opacity: state === "idle" ? 0.55 : 0.8 }
            }
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{
              filter:
                flashedNode === i
                  ? `drop-shadow(0 0 8px ${tint})`
                  : `drop-shadow(0 0 4px ${tint}66)`,
            }}
          />
          {/* Inward light streak — only when this node is flashing */}
          {flashedNode === i && (
            <motion.line
              x1={cx + n.r - 2}
              y1={cy}
              x2={cx + 12}
              y2={cy}
              stroke={tint}
              strokeWidth={1.2}
              strokeLinecap="round"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: [0, 0.9, 0], pathLength: [0, 1, 1] }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </motion.g>
      ))}
    </g>
  );
}
