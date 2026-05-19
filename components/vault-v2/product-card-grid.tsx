"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Compass, Heart, MoreHorizontal, RefreshCw, Star } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ScoreRing } from "@/components/animated/score-ring";
import { Sparkline } from "@/components/animated/sparkline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProductStore } from "@/lib/store/products";
import { useProductStatusStore } from "@/lib/store/product-status";
import {
  useCollectionsStore,
  collectionsWithProducts,
} from "@/lib/store/collections";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import {
  PRODUCT_STATUSES,
  STATUS_META,
  type ProductStatus,
} from "@/types/vault";
import type { Product, Verdict } from "@/types";
import { StatusPill } from "./status-pill";
import { cn } from "@/lib/utils";

const VERDICT_COLOR: Record<Verdict, string> = {
  go: "#3DD68C",
  test: "#FFAB40",
  risky: "#FF7E5F",
  skip: "#FF5C7C",
};

type Props = {
  product: Product;
  index: number;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  /** Optional semantic-search reason — shown as a tooltip when present. */
  reason?: string;
};

/**
 * Grid-mode product card. Glass surface + score ring + sparkline + status
 * pill + hover-only action row + 3-dot menu with the full set of actions.
 */
export function ProductCardGrid({
  product,
  index,
  selectMode,
  selected,
  onToggleSelect,
  reason,
}: Props) {
  const niche = NICHES[product.category];
  const country = COUNTRIES[product.targetCountry];
  const accent = VERDICT_COLOR[product.verdict];
  const isFav = useProductStore((s) => s.favorites.has(product.id));
  const toggleFavorite = useProductStore((s) => s.toggleFavorite);
  const removeProduct = useProductStore((s) => s.removeProduct);
  const status = useProductStatusStore(
    (s) => s.statuses[product.id] ?? "active",
  );
  const setStatus = useProductStatusStore((s) => s.setStatus);
  // Stable refs + useMemo (per the Zustand-loop fix in lib/store/collections.ts).
  // This card renders N times in a grid, so the cost of doing this right
  // matters — without it the whole grid would tear down each render.
  const rawCollections = useCollectionsStore((s) => s.collections);
  const memberships = useCollectionsStore((s) => s.memberships);
  const userCols = useMemo(
    () =>
      collectionsWithProducts(rawCollections, memberships).filter(
        (c) => c.type === "user",
      ),
    [rawCollections, memberships],
  );
  const addProducts = useCollectionsStore((s) => s.addProducts);

  const [confirmDel, setConfirmDel] = useState(false);

  // Tilt-follow parallax. Only fires when cursor over THIS card.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-60, 60], [2, -2]), { stiffness: 220, damping: 18 });
  const ry = useSpring(useTransform(x, [-60, 60], [-2, 2]), { stiffness: 220, damping: 18 });

  function move(e: ReactPointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - (r.left + r.width / 2));
    y.set(e.clientY - (r.top + r.height / 2));
  }
  function leave() {
    x.set(0);
    y.set(0);
  }

  const isArchived = status === "archived";
  const isWatchlist = status === "watchlist";

  function handleCardClick(e: React.MouseEvent) {
    if (selectMode || e.shiftKey) {
      e.preventDefault();
      onToggleSelect();
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isArchived ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.02, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <motion.div
        onPointerMove={move}
        onPointerLeave={leave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className={cn(
          "glass relative flex h-full flex-col gap-3 rounded-2xl p-4 transition-shadow",
          selected && "ring-2 ring-aurora-purple/55",
        )}
      >
        {/* Accent halo around card */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            boxShadow: `inset 0 1px 0 0 var(--surface-glass-highlight), 0 14px 28px -18px ${accent}55`,
          }}
        />

        {/* Watchlist indicator */}
        {isWatchlist && (
          <Star
            aria-hidden
            className="absolute -top-1.5 -left-1.5 h-5 w-5 rotate-12 text-aurora-peach drop-shadow-[0_0_8px_rgba(255,176,136,0.7)]"
            fill="currentColor"
          />
        )}

        {/* Image with overlays */}
        <Link
          href={`/product/${product.id}`}
          onClick={handleCardClick}
          className="relative block aspect-square overflow-hidden rounded-xl border border-border-soft/70 bg-surface-elevated"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            unoptimized
          />
          {/* Score ring */}
          <div className="absolute left-2.5 top-2.5">
            <div className="rounded-full bg-ink/40 p-0.5 backdrop-blur">
              <ScoreRing value={product.sellScore} size={48} strokeWidth={4} />
            </div>
          </div>
          {/* Favorite */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(product.id);
            }}
            aria-label={isFav ? "Unfavorite" : "Favorite"}
            className={cn(
              "absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur transition-all",
              isFav
                ? "border-aurora-pink/55 bg-aurora-pink/15 text-aurora-pink"
                : "border-border-soft/70 bg-ink/30 text-white hover:bg-ink/50",
            )}
          >
            <motion.span whileTap={{ scale: 1.3 }} transition={{ type: "spring", stiffness: 380, damping: 18 }}>
              <Heart className="h-3.5 w-3.5" fill={isFav ? "currentColor" : "none"} />
            </motion.span>
          </button>
          {/* Multi-select checkbox overlay */}
          {selectMode && (
            <span
              aria-hidden
              className={cn(
                "absolute left-2.5 top-14 flex h-6 w-6 items-center justify-center rounded-full border-2 backdrop-blur",
                selected
                  ? "border-aurora-purple bg-aurora-purple text-white"
                  : "border-white/80 bg-ink/30 text-white",
              )}
            >
              {selected && (
                <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </span>
          )}
        </Link>

        {/* Name + meta */}
        <div>
          <Link
            href={`/product/${product.id}`}
            onClick={handleCardClick}
            className="line-clamp-2 font-medium text-text hover:underline"
          >
            {product.name}
          </Link>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span
              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px]"
              style={{
                background: `${niche?.color ?? "#5B8DFF"}1A`,
                color: niche?.color,
                border: `1px solid ${niche?.color ?? "#5B8DFF"}33`,
              }}
            >
              {niche?.label ?? product.category}
            </span>
            <span className="text-text-muted">
              {country?.flag} {country?.code}
            </span>
          </div>
        </div>

        {/* Sparkline */}
        <div className="h-8">
          <Sparkline data={product.demandTrend} color={accent} height={32} />
        </div>

        {/* Bottom row: status pill + action icons (visible on hover) */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <StatusPill productId={product.id} />
          <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <ActionIconButton
              label="Compare"
              icon={<Compass className="h-3.5 w-3.5" />}
              onClick={() => toast("Added to compare staging (open /compare)")}
            />
            <ActionIconButton
              label="Re-score"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              href={`/product/${product.id}`}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="More"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border-soft bg-surface/70 text-text-muted hover:border-border-strong hover:text-text"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4} className="w-52">
                <DropdownMenuItem asChild>
                  <Link href={`/product/${product.id}`} className="cursor-pointer text-xs">
                    View details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer text-xs">
                    Add to collection…
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuLabel className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                      Your collections
                    </DropdownMenuLabel>
                    {userCols.length === 0 && (
                      <div className="px-2 py-1.5 text-[11px] text-text-dim">
                        No user collections yet
                      </div>
                    )}
                    {userCols.map((c) => (
                      <DropdownMenuItem
                        key={c.id}
                        onSelect={async () => {
                          await addProducts(c.id, [product.id]);
                          toast.success(`Added to ${c.name}`);
                        }}
                        className="cursor-pointer text-xs"
                      >
                        {c.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer text-xs">
                    Set status…
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {PRODUCT_STATUSES.map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onSelect={() => void setStatus(product.id, s as ProductStatus)}
                        className="cursor-pointer text-xs"
                      >
                        <span
                          className="mr-2 h-2 w-2 rounded-full"
                          style={{ background: STATUS_META[s].color }}
                          aria-hidden
                        />
                        {STATUS_META[s].label}
                        {status === s && <span className="ml-auto text-text-dim">✓</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem
                  onSelect={() => void setStatus(product.id, "archived")}
                  className="cursor-pointer text-xs"
                >
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setConfirmDel(true)}
                  className="cursor-pointer text-xs text-skip focus:text-skip"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Hover-only ID for screen reasons — provides the semantic-search context. */}
        {reason && (
          <p className="text-[10px] italic leading-snug text-text-dim">
            <span className="text-aurora-purple">Match:</span> {reason}
          </p>
        )}

        {/* Make the action row always visible on touch devices */}
        <style jsx>{`
          @media (hover: none) {
            .group :global([class*="opacity-0"]) {
              opacity: 1 !important;
            }
          }
        `}</style>
      </motion.div>

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur" onClick={() => setConfirmDel(false)}>
          <div className="glass-strong w-full max-w-sm rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg text-text">Delete this product?</div>
            <p className="mt-2 text-sm text-text-muted">
              {product.name} will be removed from your vault. This can&apos;t be undone.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDel(false)}
                className="rounded-full px-3 py-1.5 text-xs text-text-muted hover:text-text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  removeProduct(product.id);
                  toast.success("Deleted");
                  setConfirmDel(false);
                }}
                className="rounded-full bg-skip px-3 py-1.5 text-xs font-medium text-white hover:brightness-110"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ActionIconButton({
  label,
  icon,
  onClick,
  href,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const cls =
    "flex h-7 w-7 items-center justify-center rounded-full border border-border-soft bg-surface/70 text-text-muted hover:border-aurora-purple/45 hover:text-text";
  if (href) {
    return (
      <Link href={href} aria-label={label} className={cls}>
        {icon}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} onClick={onClick} className={cls}>
      {icon}
    </button>
  );
}
