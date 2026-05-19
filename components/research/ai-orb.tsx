"use client";

import { motion, useReducedMotion } from "framer-motion";

type Props = {
  /** 0..1 — drives the orb's "intensity" so it visibly grows as research progresses. */
  intensity?: number;
  size?: number;
  /** When true, the orb explodes into a celebration burst (used on completion). */
  celebrate?: boolean;
};

/**
 * Aurora orb — a soft, breathing radial gradient sphere built entirely from
 * SVG + framer-motion. Never sits still. Drives the "Wynner is thinking..."
 * feel on the live research page.
 */
export function AiOrb({ intensity = 0.5, size = 220, celebrate }: Props) {
  const reduce = useReducedMotion();
  const scale = 0.9 + 0.2 * intensity;
  const glow = 24 + 48 * intensity;

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Outer halo — pulses */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(167,136,255,0.45), transparent 70%)",
          filter: `blur(${glow}px)`,
        }}
        animate={
          reduce
            ? undefined
            : {
                opacity: [0.6, 1, 0.6],
                scale: [scale, scale * 1.12, scale],
              }
        }
        transition={{
          duration: 3.4,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
        }}
      />

      {/* Inner orb — drifting gradient */}
      <motion.svg
        viewBox="0 0 220 220"
        width={size}
        height={size}
        className="absolute inset-0"
        animate={
          reduce
            ? undefined
            : celebrate
              ? { rotate: 360, scale: [1, 1.4, 0.6, 1] }
              : { rotate: 360 }
        }
        transition={{
          duration: celebrate ? 1.2 : 24,
          repeat: celebrate ? 0 : Infinity,
          ease: celebrate ? [0.22, 1, 0.36, 1] : "linear",
        }}
      >
        <defs>
          <radialGradient id="orb-fill" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#A788FF" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#5B8DFF" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#FF89C5" stopOpacity="0.3" />
          </radialGradient>
          <radialGradient id="orb-highlight" cx="35%" cy="30%" r="40%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="110" cy="110" r="100" fill="url(#orb-fill)" />
        <circle cx="110" cy="110" r="100" fill="url(#orb-highlight)" />
      </motion.svg>

      {/* Counter-rotating ring of "data" arcs */}
      <motion.svg
        viewBox="0 0 220 220"
        width={size}
        height={size}
        className="absolute inset-0"
        animate={reduce ? undefined : { rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="110"
          cy="110"
          r="104"
          fill="none"
          stroke="rgba(167,136,255,0.5)"
          strokeWidth="1.5"
          strokeDasharray="3 9"
          strokeLinecap="round"
        />
      </motion.svg>

      {/* Inner "thinking" sparkle — 3 small dots in slow orbit */}
      {!reduce &&
        [0, 120, 240].map((deg, i) => (
          <motion.span
            key={deg}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
            style={{
              transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-${size / 2 - 14}px)`,
            }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          />
        ))}

      {/* Celebrate burst — rays */}
      {celebrate &&
        Array.from({ length: 12 }).map((_, i) => (
          <motion.span
            key={`ray-${i}`}
            className="absolute left-1/2 top-1/2 h-px w-12 origin-left"
            style={{
              transform: `rotate(${(i * 360) / 12}deg)`,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(167,136,255,0))",
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: [0, 3, 4], opacity: [0, 1, 0] }}
            transition={{ duration: 1.0, delay: 0.1 + i * 0.02, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
    </div>
  );
}
