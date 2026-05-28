"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Crown, FileText, Sparkles, Star } from "lucide-react";

/**
 * /auth right-side showcase panel.
 *
 * Slite-style rewrite: instead of decorative floating cards, this now shows
 * a SINGLE polished product preview — a sample scan verdict, exactly the
 * artefact a signed-in user gets. The point is: visitors see what they're
 * signing into. Below it sit three concrete capability bullets and a
 * testimonial-style quote.
 *
 * Restrained motion (one settle-in on mount, no perpetual drift) keeps it
 * looking like a real product surface, not a marketing reel.
 */
export function ShowcasePanel() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <BackgroundMesh />

      <div className="relative z-10 flex h-full flex-col px-10 py-14 xl:px-14">
        {/* Top — what we're showing */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-sm"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
            What you're signing into
          </div>
          <h2 className="mt-3 font-serif text-3xl leading-[1.05] tracking-[-0.02em] text-text xl:text-4xl">
            Real research.{" "}
            <span className="bg-gradient-to-br from-aurora-blue via-aurora-purple to-aurora-pink bg-clip-text text-transparent">
              Real verdicts.
            </span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            Every scan returns a single answer — go, test, risky, or skip —
            backed by cited research and ready-to-paste ad angles.
          </p>
        </motion.div>

        {/* Center — sample verdict card */}
        <div className="flex flex-1 items-center justify-center py-8">
          <SampleVerdictCard />
        </div>

        {/* Bottom — capability bullets + quote */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <ul className="space-y-2.5 text-sm text-text-muted">
            <CapabilityBullet>
              60-second deep research, cited from real sources.
            </CapabilityBullet>
            <CapabilityBullet>
              8 ready-to-paste ad angles in every scan.
            </CapabilityBullet>
            <CapabilityBullet>
              14-day launch playbook scoped to your country.
            </CapabilityBullet>
          </ul>

          <div className="border-t border-border-soft/60 pt-5">
            <div className="flex items-center gap-1 text-aurora-peach">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <p className="mt-2.5 text-sm italic leading-relaxed text-text-muted">
              &ldquo;Saved me roughly €2k in test ad spend in the first
              month. The angles alone are worth it.&rdquo;
            </p>
            <p className="mt-2 text-xs text-text-dim">
              — Marcus K., dropshipper · Berlin
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Sample verdict card — the hero artefact                                   */
/* ──────────────────────────────────────────────────────────────────────── */

function SampleVerdictCard() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border-soft bg-surface-elevated/80 backdrop-blur-xl"
      style={{
        boxShadow:
          "0 30px 60px -20px rgba(91,141,255,0.30), 0 0 0 1px rgba(167,136,255,0.18), inset 0 1px 0 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-border-soft/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <Crown className="h-3.5 w-3.5 text-go" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim">
            Top pick — Today
          </span>
        </div>
        <span className="font-mono text-[10px] text-text-dim">DE · 60s</span>
      </div>

      {/* Product name + score */}
      <div className="px-5 pt-5">
        <div className="text-base font-medium text-text">Posture Belt v2</div>
        <div className="mt-0.5 text-xs text-text-muted">
          Health & wellness · €34.90
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <motion.span
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="font-mono text-5xl font-medium leading-none tabular-nums text-go"
            >
              87
            </motion.span>
            <span className="font-mono text-xs text-text-dim">/ 100</span>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-go"
            style={{
              background: "rgba(61,214,140,0.14)",
              boxShadow: "inset 0 0 0 1px rgba(61,214,140,0.40)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-go shadow-[0_0_8px_rgba(61,214,140,0.8)]" />
            Go live
          </span>
        </div>
      </div>

      {/* Pillar bars */}
      <div className="space-y-2.5 px-5 pt-5">
        {[
          { label: "Demand", value: 92, color: "#3DD68C" },
          { label: "Margin", value: 78, color: "#5B8DFF" },
          { label: "Competition", value: 64, color: "#A788FF" },
        ].map((p, i) => (
          <div key={p.label} className="flex items-center gap-3">
            <span className="w-20 font-mono text-[10px] uppercase tracking-wider text-text-dim">
              {p.label}
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
              <motion.span
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${p.value}%` }}
                transition={{
                  duration: 0.9,
                  delay: 0.7 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${p.color}AA, ${p.color})`,
                }}
              />
            </div>
            <span className="w-8 text-right font-mono text-[10px] tabular-nums text-text-muted">
              {p.value}
            </span>
          </div>
        ))}
      </div>

      {/* Top hook angles */}
      <div className="border-t border-border-soft/60 px-5 py-4">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-aurora-purple" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim">
            Top hook angles
          </span>
        </div>
        <ul className="mt-2.5 space-y-1.5 text-xs leading-snug text-text">
          <li className="truncate">
            &ldquo;ngl my back is COOKED after these zoom days&rdquo;
          </li>
          <li className="truncate">
            &ldquo;I tried 5 posture belts before this one&rdquo;
          </li>
          <li className="truncate">
            &ldquo;30 days later — actual before/after&rdquo;
          </li>
        </ul>
      </div>

      {/* Footer chip */}
      <div className="flex items-center justify-between border-t border-border-soft/60 px-5 py-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] text-text-dim">
          <FileText className="h-3 w-3" />
          14-page dossier ready
        </span>
        <span className="font-mono text-[10px] text-text-dim">12 sources</span>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Capability bullet                                                         */
/* ──────────────────────────────────────────────────────────────────────── */

function CapabilityBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden
        className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full"
        style={{
          background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
          boxShadow: "0 0 6px rgba(167,136,255,0.6)",
        }}
      />
      <span>{children}</span>
    </li>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Background mesh — fixed, no perpetual drift                               */
/* ──────────────────────────────────────────────────────────────────────── */

function BackgroundMesh() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 25% 30%, rgba(167,136,255,0.40), transparent 65%), radial-gradient(ellipse 70% 50% at 80% 75%, rgba(91,141,255,0.35), transparent 65%), radial-gradient(ellipse 60% 50% at 50% 100%, rgba(255,137,197,0.30), transparent 70%)",
      }}
    />
  );
}
