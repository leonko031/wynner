"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";

type Props = {
  index: number;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
};

/**
 * Inviting empty slot — large glass card with an animated aurora-tinted
 * dashed border, gentle float, and a "+ Add product" affordance.
 *
 * When `disabled` (plan-gated past the slot limit), the slot still renders
 * but is visually faded with the disabledReason shown.
 */
export function EmptySlot({ index, onClick, disabled, disabledReason }: Props) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      // Subtle out-of-sync float: each slot drifts on its own clock.
      animate={
        reduce || disabled
          ? undefined
          : { y: [0, -6, 0, 4, 0] }
      }
      {...(reduce || disabled
        ? {}
        : {
            transition: {
              duration: 6 + (index % 3),
              delay: index * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
            },
          })}
      aria-label={disabled ? disabledReason : `Add product to slot ${index + 1}`}
      className={`group relative flex h-96 flex-col items-center justify-center gap-3 rounded-3xl p-6 text-center transition-all ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(91,141,255,0.05), rgba(167,136,255,0.06), rgba(255,137,197,0.05))",
      }}
    >
      {/* Animated aurora dashed border */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl"
        animate={
          reduce
            ? undefined
            : { backgroundPosition: ["0% 0%", "200% 0%"] }
        }
        transition={
          reduce
            ? undefined
            : { duration: 12, repeat: Infinity, ease: "linear" }
        }
        style={{
          padding: "2px",
          background:
            "linear-gradient(135deg, rgba(91,141,255,0.4), rgba(167,136,255,0.55), rgba(255,137,197,0.4), rgba(91,141,255,0.4)) 0 0 / 200% 100%",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          borderRadius: 24,
        }}
      />
      {/* Inner dashed outline to drive the "drop zone" reading */}
      <span
        aria-hidden
        className="absolute inset-2 rounded-2xl border-2 border-dashed border-aurora-purple/25"
      />

      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl backdrop-blur transition-transform group-hover:scale-110"
        style={{
          background:
            "linear-gradient(135deg, rgba(91,141,255,0.18), rgba(167,136,255,0.22), rgba(255,137,197,0.18))",
          border: "1px solid rgba(167,136,255,0.45)",
          boxShadow:
            "0 12px 28px -10px rgba(167,136,255,0.45), inset 0 1px 0 0 var(--surface-glass-highlight)",
        }}
      >
        <Plus className="h-6 w-6 text-aurora-purple" />
      </div>
      <div className="relative">
        <div className="font-serif text-base text-text">Add product</div>
        <div className="mt-0.5 text-xs text-text-muted">
          {disabled ? disabledReason : "Pick from your vault or scan something new"}
        </div>
      </div>
      <div className="relative font-mono text-[10px] uppercase tracking-wider text-text-dim">
        Slot {index + 1}
      </div>
    </motion.button>
  );
}
