"use client";

import { motion } from "framer-motion";

const stroke = "currentColor";
const PEN: React.SVGProps<SVGPathElement> = {
  stroke,
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
};

export function VaultIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 160"
      className={className}
      role="img"
      aria-label="Empty vault sketch"
    >
      {/* Pegboard / shelf */}
      <motion.path
        {...PEN}
        d="M20 130 L200 130"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7 }}
      />
      <motion.path
        {...PEN}
        d="M20 130 L20 30 L200 30 L200 130"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.1 }}
      />
      {/* Empty hook slots */}
      {[55, 95, 135, 175].map((x, i) => (
        <motion.circle
          key={x}
          cx={x}
          cy={55}
          r={3}
          stroke={stroke}
          strokeWidth={1.2}
          fill="none"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.45, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.5 + i * 0.06 }}
        />
      ))}
      {/* A lonely product card outline */}
      <motion.rect
        x={86}
        y={75}
        width={48}
        height={40}
        rx={5}
        {...PEN}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.8 }}
        transition={{ duration: 0.9, delay: 0.9 }}
      />
      <motion.path
        {...PEN}
        d="M94 92 L114 92 M94 98 L122 98 M94 104 L108 104"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.4 }}
      />
      {/* Magnifying glass */}
      <motion.g
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7 }}
      >
        <circle cx={156} cy={94} r={12} {...PEN} />
        <path {...PEN} d="M166 104 L176 114" />
      </motion.g>
    </svg>
  );
}

export function CompareIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 160"
      className={className}
      role="img"
      aria-label="Empty compare sketch"
    >
      {[30, 100, 170].map((x, i) => (
        <motion.rect
          key={x}
          x={x}
          y={30}
          width={60}
          height={100}
          rx={8}
          {...PEN}
          strokeDasharray="5 5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.12 }}
        />
      ))}
      <motion.path
        {...PEN}
        d="M50 80 L70 80 M60 70 L60 90"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.6 }}
      />
      <motion.path
        {...PEN}
        d="M120 80 L140 80 M130 70 L130 90"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.75 }}
      />
      <motion.path
        {...PEN}
        d="M190 80 L210 80 M200 70 L200 90"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.9 }}
      />
    </svg>
  );
}

export function NoResultsIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      className={className}
      role="img"
      aria-label="No results sketch"
    >
      <motion.circle
        cx={90}
        cy={80}
        r={36}
        {...PEN}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9 }}
      />
      <motion.path
        {...PEN}
        d="M118 108 L150 140"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      />
      <motion.path
        {...PEN}
        d="M75 80 L105 80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.4 }}
      />
    </svg>
  );
}
