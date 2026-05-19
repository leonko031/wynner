"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useProductStore } from "@/lib/store/products";
import {
  useCollectionsStore,
  collectionsWithProducts,
} from "@/lib/store/collections";
import { useCreditsStore } from "@/lib/store/credits";
import { buildSystemCollections } from "@/lib/vault/system-collections";
import { compressProducts } from "@/lib/ai/prompts/vault";
import { CollectionCard } from "./collection-card";
import { NewCollectionModal } from "./new-collection-modal";
import { cn } from "@/lib/utils";

type Props = {
  selectedCollectionId: string | null;
  onSelect: (id: string | null) => void;
};

const ORGANIZE_COST = 3;

/**
 * Horizontal rail of system + user + smart collections. Click selects (the
 * vault grid below filters to that collection's products). "+ New collection"
 * opens the modal. "Auto-organize ✨" calls Gemini Pro (✦ 3 / free for admins).
 */
export function CollectionsRail({ selectedCollectionId, onSelect }: Props) {
  const products = useProductStore((s) => s.products);
  const favorites = useProductStore((s) => s.favorites);
  const recentlyViewed = useProductStore((s) => s.recentlyViewed);
  // Stable refs → memoized assembly. See `lib/store/collections.ts` for the
  // pattern note. Selector that returns a fresh array each call infinite-loops.
  const rawCollections = useCollectionsStore((s) => s.collections);
  const memberships = useCollectionsStore((s) => s.memberships);
  const collections = useMemo(
    () => collectionsWithProducts(rawCollections, memberships),
    [rawCollections, memberships],
  );
  const deleteCollection = useCollectionsStore((s) => s.deleteCollection);
  const renameCollection = useCollectionsStore((s) => s.renameCollection);
  const clearSmart = useCollectionsStore((s) => s.clearSmartCollections);
  const fetchAll = useCollectionsStore((s) => s.fetchAll);

  const isAdmin = useCreditsStore((s) => s.isAdmin);
  const balance = useCreditsStore((s) => s.balance);
  const spend = useCreditsStore((s) => s.spend);

  const [organizing, setOrganizing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const system = buildSystemCollections(products, favorites, recentlyViewed);
  const userCols = collections.filter((c) => c.type === "user");
  const smartCols = collections.filter((c) => c.type === "smart");

  // Track scroll edges so arrow buttons can disable.
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
  }, [system.length, userCols.length, smartCols.length]);

  function scrollBy(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
  }

  async function autoOrganize() {
    if (organizing) return;
    if (products.length < 5) {
      toast.error("Need at least 5 products to auto-organize");
      return;
    }
    if (!isAdmin && balance < ORGANIZE_COST) {
      toast.error("Not enough credits", { description: `Auto-organize costs ✦ ${ORGANIZE_COST}.` });
      return;
    }
    const spendResult = spend("re_score", {
      cost: ORGANIZE_COST,
      description: "Auto-organize vault",
    });
    if (!spendResult.success) {
      toast.error("Not enough credits");
      return;
    }
    setOrganizing(true);
    // Clear existing smart collections client-side immediately so the rail
    // doesn't show stale tiles while we wait.
    await clearSmart();
    try {
      const res = await fetch("/api/vault/auto-organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: compressProducts(products) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Auto-organize failed", {
          description: data?.message ?? "Try again in a moment.",
        });
      } else {
        toast.success(`Created ${data.collections?.length ?? 0} smart collection${data.collections?.length === 1 ? "" : "s"}`);
        await fetchAll();
      }
    } catch (err) {
      toast.error("Auto-organize failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setOrganizing(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl tracking-tight text-text md:text-3xl">
            Collections
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Built-in views + your own folders + AI-curated groupings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-3.5 text-xs text-text hover:border-border-strong"
          >
            <Plus className="h-3.5 w-3.5" />
            New collection
          </button>
          <button
            type="button"
            onClick={autoOrganize}
            disabled={organizing}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium text-white shadow-[0_10px_24px_-8px_rgba(167,136,255,0.55)]",
              organizing ? "opacity-70" : "hover:brightness-110",
            )}
            style={{
              background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
            }}
            title={isAdmin ? "Free for you" : `Costs ✦ ${ORGANIZE_COST}`}
          >
            <Sparkles className={cn("h-3.5 w-3.5", organizing && "animate-spin")} />
            {organizing ? "Organizing…" : "Auto-organize"}
            {!isAdmin && (
              <span className="font-mono text-[10px] opacity-90">· ✦ {ORGANIZE_COST}</span>
            )}
          </button>
        </div>
      </header>

      <div className="relative">
        {/* Edge fades */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[var(--surface-page)] via-[var(--surface-page)] to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[var(--surface-page)] via-[var(--surface-page)] to-transparent"
        />

        {/* Arrows */}
        <div className="absolute -top-12 right-0 hidden items-center gap-1.5 md:flex">
          <ArrowButton direction="left" disabled={!canLeft} onClick={() => scrollBy(-1)} />
          <ArrowButton direction="right" disabled={!canRight} onClick={() => scrollBy(1)} />
        </div>

        <div
          ref={scrollRef}
          className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2"
        >
          <AnimatePresence initial={false}>
            {system.map((c) => (
              <CollectionCard
                key={c.id}
                id={c.id}
                name={c.name}
                description={c.description}
                color={c.color}
                type="system"
                productIds={c.productIds}
                selected={selectedCollectionId === c.id}
                emoji={c.emoji}
                onClick={() =>
                  onSelect(selectedCollectionId === c.id ? null : c.id)
                }
              />
            ))}
            {userCols.map((c) => (
              <CollectionCard
                key={c.id}
                id={c.id}
                name={c.name}
                description={c.description}
                color={c.color}
                type={c.type}
                productIds={c.productIds}
                selected={selectedCollectionId === c.id}
                onClick={() =>
                  onSelect(selectedCollectionId === c.id ? null : c.id)
                }
                onRename={async () => {
                  const next = window.prompt("Rename collection", c.name);
                  if (next && next.trim() !== c.name) {
                    await renameCollection(c.id, next.trim(), c.description ?? undefined);
                  }
                }}
                onDelete={async () => {
                  if (
                    window.confirm(`Delete "${c.name}"? This won't delete the products.`)
                  ) {
                    if (selectedCollectionId === c.id) onSelect(null);
                    await deleteCollection(c.id);
                  }
                }}
              />
            ))}
            {smartCols.map((c) => (
              <CollectionCard
                key={c.id}
                id={c.id}
                name={c.name}
                description={c.description}
                rationale={c.rationale}
                color={c.color}
                type={c.type}
                productIds={c.productIds}
                selected={selectedCollectionId === c.id}
                onClick={() =>
                  onSelect(selectedCollectionId === c.id ? null : c.id)
                }
                onDelete={async () => {
                  if (selectedCollectionId === c.id) onSelect(null);
                  await deleteCollection(c.id);
                }}
              />
            ))}
          </AnimatePresence>
          <div className="w-2 shrink-0" aria-hidden />
        </div>
      </div>

      <NewCollectionModal open={modalOpen} onOpenChange={setModalOpen} />
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
      className="flex h-7 w-7 items-center justify-center rounded-full border border-border-soft bg-surface/70 text-text-muted backdrop-blur hover:border-aurora-purple/45 hover:text-text disabled:opacity-30"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
