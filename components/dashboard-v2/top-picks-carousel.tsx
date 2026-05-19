"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUser } from "@/lib/auth/use-user";
import { useProductStore } from "@/lib/store/products";
import { pickDailyTop } from "@/lib/dashboard/daily-picks";
import { TopPickCard } from "./top-pick-card";
import type { Niche } from "@/types";

/**
 * "Today's top picks for you" — horizontal scroll-snap carousel of the user's
 * top 8 picks. Stable within a day, rotates daily, prefers their niche +
 * country if set.
 */
export function TopPicksCarousel() {
  const { user, profile } = useUser();
  const products = useProductStore((s) => s.products);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const picks = pickDailyTop(
    products,
    {
      preferredNiches: (profile?.preferred_niches ?? []) as Niche[],
      preferredCountry: profile?.preferred_country ?? null,
      userKey: user?.id ?? "guest",
    },
    8,
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [picks.length]);

  function scrollBy(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 300, behavior: "smooth" });
  }

  if (picks.length === 0) {
    return null;
  }

  return (
    <motion.section
      id="dashboard-top-picks"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl tracking-tight text-text md:text-3xl">
            Today&apos;s top picks for you
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {profile?.preferred_niches && profile.preferred_niches.length > 0
              ? "Tuned to your niches — re-ranked daily."
              : "A spread across the platform — set niches in onboarding to tune this."}
          </p>
        </div>
        <div className="hidden items-center gap-1.5 md:flex">
          <ArrowButton direction="left" disabled={!canLeft} onClick={() => scrollBy(-1)} />
          <ArrowButton direction="right" disabled={!canRight} onClick={() => scrollBy(1)} />
        </div>
      </div>

      {/* Edge fades */}
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[var(--surface-page)] via-[var(--surface-page)] to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[var(--surface-page)] via-[var(--surface-page)] to-transparent"
        />

        <div
          ref={scrollRef}
          className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2"
          style={{ scrollPaddingLeft: 24, scrollPaddingRight: 24 }}
        >
          {picks.map((p, i) => (
            <TopPickCard key={p.id} product={p} index={i} />
          ))}
          {/* Spacer so the last card can fully snap into view */}
          <div className="w-2 shrink-0" aria-hidden />
        </div>
      </div>
    </motion.section>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border-soft bg-surface/70 text-text-muted backdrop-blur transition-all hover:border-aurora-purple/45 hover:text-text disabled:opacity-30"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
