"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Section primitives used by every dashboard-v3 section. Implements the
 * entrance choreography from the spec:
 *
 *   1. Kicker fades in + slides down 4px
 *   2. Headline reveals character-by-character with a small y offset
 *   3. Sub-headline fades in
 *   4. Children animate in with stagger (80ms between siblings)
 */

const KICKER_STYLES =
  "font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted";

export function Kicker({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(KICKER_STYLES, className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Character-by-character reveal for headlines. Wraps each character in a span
 * and staggers them. Total reveal ~500ms.
 */
export function CharStagger({
  children,
  className,
  delay = 0,
  italic,
  gradient,
}: {
  children: string;
  className?: string;
  delay?: number;
  italic?: boolean;
  gradient?: boolean;
}) {
  const reduce = useReducedMotion();
  const chars = Array.from(children);

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : 0.014,
        delayChildren: delay,
      },
    },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 6 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.span
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      className={cn(
        "inline-block",
        italic && "italic",
        gradient && "bg-gradient-to-r from-aurora-blue via-aurora-purple to-aurora-pink bg-clip-text text-transparent",
        className,
      )}
    >
      {chars.map((c, i) => (
        <motion.span
          key={i}
          variants={item}
          style={{ display: "inline-block", whiteSpace: c === " " ? "pre" : undefined }}
        >
          {c}
        </motion.span>
      ))}
    </motion.span>
  );
}

/**
 * The standard section header used by every section below the first fold.
 * Implements the choreography: kicker → headline (char-stagger) → sub.
 */
export function SectionHeader({
  kicker,
  headline,
  subHeadline,
  id,
  align = "left",
}: {
  kicker: string;
  headline: string;
  subHeadline?: string;
  id?: string;
  align?: "left" | "center";
}) {
  return (
    <header
      id={id}
      className={cn(
        "mb-10 md:mb-14 scroll-mt-24",
        align === "center" && "text-center",
      )}
    >
      <Kicker>{kicker}</Kicker>
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3 font-serif text-4xl leading-[0.95] tracking-tight text-text md:text-5xl lg:text-[56px]"
      >
        <CharStagger delay={0.12}>{headline}</CharStagger>
      </motion.h2>
      {subHeadline && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 max-w-2xl text-base text-text-muted md:text-lg"
        >
          {subHeadline}
        </motion.p>
      )}
    </header>
  );
}

/**
 * Wraps a section's main content in a stagger container. Each child should
 * use <StaggerItem> to opt into the cascade.
 */
export function StaggerGrid({
  children,
  className,
  delay = 0.45,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.08,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const STAGGER_ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 25 },
  },
};

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const Component = motion[as] as typeof motion.div;
  return (
    <Component variants={STAGGER_ITEM_VARIANTS} className={className}>
      {children}
    </Component>
  );
}
