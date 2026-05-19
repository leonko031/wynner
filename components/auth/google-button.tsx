"use client";

import { motion } from "framer-motion";

type Props = {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  disabled?: boolean;
};

/**
 * Google OAuth button — multi-color Google "G" + label. Glass surface with
 * an aurora-tinted border that intensifies on hover.
 */
export function GoogleButton({ onClick, loading, disabled, label }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-border-soft bg-surface/70 px-4 text-sm font-medium text-text backdrop-blur-xl transition-colors hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-60"
    >
      {/* Aurora gradient ring on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow:
            "0 0 0 1px rgba(167,136,255,0.45), 0 12px 28px -10px rgba(167,136,255,0.45)",
        }}
      />
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-aurora-blue/40 border-t-aurora-blue" />
      ) : (
        <svg viewBox="0 0 18 18" width={18} height={18} aria-hidden>
          <path
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            fill="#4285F4"
          />
          <path
            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
            fill="#34A853"
          />
          <path
            d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
            fill="#FBBC05"
          />
          <path
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
            fill="#EA4335"
          />
        </svg>
      )}
      <span className="relative">{label ?? "Continue with Google"}</span>
    </motion.button>
  );
}
