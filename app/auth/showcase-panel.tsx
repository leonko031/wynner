"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Crown, TrendingUp } from "lucide-react";

const TAGLINES = [
  "Know before you launch.",
  "Stop guessing. Start shipping winners.",
  "Your unfair advantage.",
];

const MICRO_STATS = [
  { value: "2,400+", label: "products scored" },
  { value: "15", label: "countries supported" },
  { value: "60s", label: "deep research" },
];

const AVATAR_COLORS = ["#5B8DFF", "#A788FF", "#FF89C5"];

/**
 * The right-side "living showcase" on /auth. Floating glass snippets of the
 * app surround a hero card with a rotating tagline. All motion respects
 * prefers-reduced-motion.
 */
export function ShowcasePanel() {
  const reduce = useReducedMotion();
  const [taglineIdx, setTaglineIdx] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(() => {
      setTaglineIdx((i) => (i + 1) % TAGLINES.length);
    }, 5000);
    return () => window.clearInterval(t);
  }, [reduce]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Aurora gradient mesh — more vivid here than on the rest of the app */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 25% 30%, rgba(167,136,255,0.55), transparent 60%), radial-gradient(ellipse 70% 50% at 80% 75%, rgba(91,141,255,0.45), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 100%, rgba(255,137,197,0.40), transparent 65%)",
        }}
      />

      {/* Particle drift — tiny dots floating upward */}
      {!reduce && <ParticleDrift />}

      {/* Floating accent cards */}
      <FloatingCard
        x="8%"
        y="14%"
        delay={0}
        rotate={-4}
        blur={false}
      >
        <ProductCard />
      </FloatingCard>
      <FloatingCard
        x="68%"
        y="22%"
        delay={1.2}
        rotate={3}
        blur={false}
      >
        <PersonaCard />
      </FloatingCard>
      <FloatingCard
        x="62%"
        y="68%"
        delay={2.4}
        rotate={-2}
        blur={false}
      >
        <AnalyticsCard />
      </FloatingCard>

      {/* HERO — center stage */}
      <div className="absolute inset-0 flex items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong relative w-full max-w-md rounded-3xl p-8 text-center"
          style={{
            boxShadow:
              "0 0 0 1px rgba(167,136,255,0.40), 0 40px 80px -24px rgba(91,141,255,0.45), 0 0 60px rgba(167,136,255,0.20)",
          }}
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            What&apos;s behind the door
          </div>
          <div className="relative mt-4 h-16">
            {TAGLINES.map((line, i) => (
              <motion.h2
                key={line}
                className="absolute inset-0 flex items-center justify-center text-balance text-3xl font-medium leading-[1.1] tracking-tight text-text"
                initial={false}
                animate={{
                  opacity: i === taglineIdx ? 1 : 0,
                  y: i === taglineIdx ? 0 : 8,
                }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {line}
              </motion.h2>
            ))}
          </div>

          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-border-soft pt-5">
            {MICRO_STATS.map((s) => (
              <div key={s.label}>
                <div className="font-mono text-lg font-semibold tabular-nums text-text">
                  {s.value}
                </div>
                <div className="mt-0.5 text-[10px] leading-tight text-text-dim">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Social proof at bottom */}
      <div className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-3 text-xs text-text-muted">
        <div className="flex -space-x-2">
          {AVATAR_COLORS.map((c, i) => (
            <span
              key={i}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-elevated text-[10px] font-medium text-white"
              style={{
                background: `linear-gradient(135deg, ${c}, ${c}AA)`,
              }}
            >
              {String.fromCharCode(65 + i)}
            </span>
          ))}
        </div>
        <span>Join hundreds of operators already winning</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Floating wrapper                                                            */
/* -------------------------------------------------------------------------- */

function FloatingCard({
  x,
  y,
  delay,
  rotate,
  blur,
  children,
}: {
  x: string;
  y: string;
  delay: number;
  rotate: number;
  blur?: boolean;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="absolute"
      style={{ left: x, top: y, filter: blur ? "blur(2px)" : undefined }}
      initial={{ opacity: 0, y: 12, rotate: rotate }}
      animate={
        reduce
          ? { opacity: 0.95, y: 0, rotate: rotate }
          : {
              opacity: [0, 0.95, 0.95],
              y: [12, 0, -10, 0],
              rotate: [rotate, rotate + 2, rotate - 1, rotate],
            }
      }
      transition={{
        duration: 7,
        delay,
        ease: [0.22, 1, 0.36, 1],
        repeat: reduce ? 0 : Infinity,
      }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Mini card snippets                                                          */
/* -------------------------------------------------------------------------- */

function ProductCard() {
  return (
    <div
      className="glass-flat w-[200px] rounded-2xl p-3"
      style={{
        boxShadow:
          "0 0 0 1px rgba(61,214,140,0.30), 0 16px 36px -10px rgba(61,214,140,0.30)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="font-mono text-[9px] uppercase tracking-wider text-text-dim">
          Top pick today
        </div>
        <Crown className="h-3.5 w-3.5 text-go" />
      </div>
      <div className="mt-1 truncate text-xs font-medium text-text">
        Posture Belt v2
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          className="font-mono text-2xl font-medium leading-none tabular-nums"
          style={{ color: "#3DD68C" }}
        >
          87
        </span>
        <span className="font-mono text-[9px] text-text-dim">/ 100</span>
      </div>
      <div className="mt-2 inline-flex items-center rounded-full bg-go/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-go">
        GO LIVE
      </div>
    </div>
  );
}

function PersonaCard() {
  return (
    <div className="glass-flat w-[210px] rounded-2xl p-3">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-base font-semibold text-white"
          style={{
            background: "linear-gradient(135deg, #A788FF, #FF89C5)",
          }}
        >
          L
        </div>
        <div>
          <div className="text-xs font-medium text-text">Lena Schmidt</div>
          <div className="text-[10px] text-text-muted">34 · Berlin</div>
        </div>
      </div>
      <div className="mt-2 text-[11px] italic leading-snug text-text-muted">
        &ldquo;ngl my back is COOKED after these zoom days&rdquo;
      </div>
    </div>
  );
}

function AnalyticsCard() {
  return (
    <div className="glass-flat w-[200px] rounded-2xl p-3">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[9px] uppercase tracking-wider text-text-dim">
          30-day trend
        </div>
        <TrendingUp className="h-3 w-3 text-go" />
      </div>
      <svg
        viewBox="0 0 200 60"
        className="mt-1 h-12 w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="showcase-spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3DD68C" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#3DD68C" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 48 L 25 42 L 50 38 L 75 30 L 100 35 L 125 22 L 150 18 L 175 10 L 200 5 L 200 60 L 0 60 Z"
          fill="url(#showcase-spark-fill)"
        />
        <path
          d="M0 48 L 25 42 L 50 38 L 75 30 L 100 35 L 125 22 L 150 18 L 175 10 L 200 5"
          fill="none"
          stroke="#3DD68C"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="font-mono text-sm font-medium text-text">+38%</span>
        <span className="font-mono text-[9px] text-text-dim">vs last month</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Particle drift                                                              */
/* -------------------------------------------------------------------------- */

function ParticleDrift() {
  // Precomputed positions so motion stays deterministic across renders
  // (avoids React 19 strict-mode purity warning about Math.random in JSX).
  const particles = [
    { x: 12, delay: 0, dur: 14 },
    { x: 28, delay: 3, dur: 18 },
    { x: 44, delay: 6, dur: 16 },
    { x: 58, delay: 1, dur: 19 },
    { x: 72, delay: 4, dur: 15 },
    { x: 86, delay: 7, dur: 17 },
    { x: 18, delay: 9, dur: 20 },
    { x: 65, delay: 11, dur: 16 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-white/35"
          style={{ left: `${p.x}%`, top: "100%" }}
          animate={{ y: ["0%", "-120vh"], opacity: [0, 0.8, 0] }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
