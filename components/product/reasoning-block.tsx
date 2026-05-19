"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Check } from "lucide-react";
import type { Product } from "@/types";

export function ReasoningBlock({ product }: { product: Product }) {
  const why = product.reasoning.whyTest;
  const flags = product.reasoning.redFlags;
  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <Column
        title="Why test this"
        items={why}
        side="left"
        icon={Check}
        color="#00D26A"
        empty="No standout reasons to test — verdict will tell you why."
      />
      <Column
        title="Red flags"
        items={flags}
        side="right"
        icon={AlertTriangle}
        color="#F5A623"
        empty="No red flags surfaced in this pass."
      />
    </section>
  );
}

function Column({
  title,
  items,
  side,
  icon: Icon,
  color,
  empty,
}: {
  title: string;
  items: string[];
  side: "left" | "right";
  icon: React.ElementType;
  color: string;
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ backgroundColor: `${color}1F`, color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-sm font-medium text-text">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-text-dim">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((text, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: side === "left" ? -16 : 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
                delay: i * 0.08,
              }}
              className="flex items-start gap-2 text-sm leading-relaxed text-text"
            >
              <Icon
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                style={{ color }}
              />
              <span>{text}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
