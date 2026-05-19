"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useTopProducts } from "@/lib/hooks";
import type { Product, Verdict } from "@/types";
import { cn } from "@/lib/utils";

const VERDICT_CLR: Record<Verdict, string> = {
  go: "#00D26A",
  test: "#F5A623",
  risky: "#F97316",
  skip: "#EF4444",
};

function TickerItem({ p }: { p: Product }) {
  const color = VERDICT_CLR[p.verdict];
  return (
    <div className="flex shrink-0 items-center gap-2.5 px-5">
      <div className="relative h-6 w-6 overflow-hidden rounded-md bg-surface-elevated">
        <Image
          src={p.image}
          alt=""
          fill
          sizes="24px"
          className="object-cover"
          unoptimized
        />
      </div>
      <span className="text-xs text-text-muted">{p.name}</span>
      <span
        className="inline-flex items-center rounded-full px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums"
        style={{
          backgroundColor: `${color}1F`,
          color,
          border: `1px solid ${color}44`,
        }}
      >
        {p.sellScore}
      </span>
      <span className="select-none text-text-dim" aria-hidden>
        ·
      </span>
    </div>
  );
}

export function TickerBar() {
  const products = useTopProducts(15);
  const reduce = useReducedMotion();

  if (products.length === 0) return <TickerSkeleton />;

  return (
    <div className="sticky top-14 z-30 h-10 w-full overflow-hidden border-b border-border-soft bg-surface/80 backdrop-blur-xl">
      <div
        className={cn(
          "group relative flex h-full items-center",
          "[--ticker-state:running] hover:[--ticker-state:paused]",
        )}
      >
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink to-transparent" />

        <motion.div
          className="flex shrink-0"
          style={{
            animationPlayState: "var(--ticker-state)" as never,
            willChange: "transform",
          }}
          animate={reduce ? undefined : { x: ["0%", "-50%"] }}
          transition={{
            duration: 60,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {[...products, ...products].map((p, i) => (
            <TickerItem key={`${p.id}-${i}`} p={p} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export function TickerSkeleton() {
  return (
    <div className="sticky top-14 z-30 h-10 w-full border-b border-border-soft bg-surface/80 backdrop-blur-xl" />
  );
}
