"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Crown, Image as ImageIcon, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ComparisonTable } from "@/components/compare/comparison-table";
import {
  EmptySlot,
  FilledSlot,
} from "@/components/compare/compare-slot";
import { ProductPicker } from "@/components/compare/product-picker";
import { useProductStore } from "@/lib/store/products";
import { useCreditsStore } from "@/lib/store/credits";
import { CREDIT_COSTS } from "@/lib/credits/config";
import { CostPreview } from "@/components/credits/cost-preview";
import { InsufficientModal } from "@/components/credits/insufficient-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Product } from "@/types";

const SLOT_COUNT = 3;

function parseQuery(qs: string | null): (string | null)[] {
  const slots: (string | null)[] = [null, null, null];
  if (!qs) return slots;
  const ids = qs.split(",").map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < Math.min(ids.length, SLOT_COUNT); i++) {
    slots[i] = ids[i];
  }
  return slots;
}

export default function ComparePage() {
  const router = useRouter();
  const params = useSearchParams();
  const products = useProductStore((s) => s.products);

  const [slots, setSlots] = useState<(string | null)[]>(() =>
    parseQuery(params.get("products")),
  );
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [winnerLocked, setWinnerLocked] = useState(false);
  const [confirmPick, setConfirmPick] = useState(false);
  const [insufficient, setInsufficient] = useState<{ open: boolean; needed: number }>({
    open: false,
    needed: 0,
  });
  const spend = useCreditsStore((s) => s.spend);

  // Hydrate from URL whenever params change — deferred to keep the setState out of the effect body.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setSlots(parseQuery(params.get("products")));
    }, 0);
    return () => window.clearTimeout(t);
  }, [params]);

  // Resolve slot IDs to product records; URL ids that don't exist render as null.
  const slotProducts: (Product | null)[] = useMemo(() => {
    return slots.map((id) =>
      id ? products.find((p) => p.id === id) ?? null : null,
    );
  }, [slots, products]);

  const filled = slotProducts.filter((p): p is Product => p !== null);
  const winnerIndex = useMemo(() => {
    if (!winnerLocked || filled.length === 0) return null;
    let bestIdx = -1;
    let bestScore = -1;
    slotProducts.forEach((p, i) => {
      if (p && p.sellScore > bestScore) {
        bestScore = p.sellScore;
        bestIdx = i;
      }
    });
    return bestIdx >= 0 ? bestIdx : null;
  }, [slotProducts, filled.length, winnerLocked]);

  function writeUrl(next: (string | null)[]) {
    const ids = next.filter((x): x is string => Boolean(x));
    if (ids.length === 0) {
      router.replace("/compare");
    } else {
      router.replace(`/compare?products=${ids.join(",")}`);
    }
  }

  function setSlot(index: number, productId: string | null) {
    const next = [...slots];
    next[index] = productId;
    setWinnerLocked(false);
    setSlots(next);
    // router.replace happens outside the setState updater so it can't fire mid-render.
    writeUrl(next);
  }

  function pickWinner() {
    if (filled.length < 2) {
      toast("Add at least 2 products to compare.");
      return;
    }
    // If they're re-picking (already locked), don't charge again — pure UI swap.
    if (winnerLocked) {
      setWinnerLocked(false);
      return;
    }
    // Open confirmation so users see the cost before committing.
    setConfirmPick(true);
  }

  function confirmPickWinner() {
    const result = spend("country_compare", {
      description: `Compared ${filled.length} products — winner picked`,
    });
    if (!result.success) {
      setConfirmPick(false);
      setInsufficient({ open: true, needed: result.needed });
      return;
    }
    setWinnerLocked(true);
    setConfirmPick(false);
    toast.success("Winner locked in", {
      description: `✦ ${CREDIT_COSTS.country_compare} credits — analysis complete`,
    });
  }

  function shareComparison() {
    const url = `${window.location.origin}/compare?products=${slots
      .filter(Boolean)
      .join(",")}`;
    if (filled.length === 0) {
      toast("Add a product first.");
      return;
    }
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url);
      toast.success("Comparison link copied", { description: url });
    } else {
      toast("Copy this link", { description: url });
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 md:py-12">
      <header className="mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
            Side-by-side
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-text">
            Compare
          </h1>
          <p className="text-sm md:text-base text-text-muted">
            Stack up to 3 products. Pick a winner when you&apos;re ready.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-border-soft bg-surface/60"
            onClick={shareComparison}
          >
            <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
            Share comparison
          </Button>
          <Button
            size="sm"
            className="rounded-full text-white"
            onClick={pickWinner}
            disabled={filled.length < 2}
            style={
              filled.length < 2
                ? undefined
                : {
                    background:
                      "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                    boxShadow: "0 8px 22px -6px rgba(91,141,255,0.55)",
                  }
            }
          >
            <Trophy className="mr-1.5 h-3.5 w-3.5" />
            {winnerLocked ? "Re-pick" : "Pick the winner"}
          </Button>
        </div>
      </header>

      <section className="space-y-10 md:space-y-12">
        {/* Slot row */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
              Contenders
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim tabular-nums">
              {filled.length} / {SLOT_COUNT}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {slotProducts.map((p, i) => {
              if (!p)
                return (
                  <EmptySlot
                    key={`empty-${i}`}
                    index={i}
                    onAdd={() => setOpenIdx(i)}
                    onDrop={(pid) => setSlot(i, pid)}
                  />
                );
              return (
                <FilledSlot
                  key={p.id}
                  product={p}
                  highlighted={
                    winnerLocked ? winnerIndex === i : undefined
                  }
                  onRemove={() => setSlot(i, null)}
                />
              );
            })}
          </div>

          {/* Helper banners */}
          {filled.length === 1 && (
            <p className="mt-4 text-center text-xs text-text-muted">
              Add another product to start comparing.
            </p>
          )}
          {winnerLocked && winnerIndex !== null && slotProducts[winnerIndex] && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-center justify-center"
            >
              <div
                className="flex items-center gap-2 rounded-full border border-border-soft px-4 py-2 text-sm backdrop-blur-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(91,141,255,0.10), rgba(167,136,255,0.14), rgba(255,137,197,0.10))",
                }}
              >
                <Crown className="h-4 w-4 text-go" />
                <span className="text-text">
                  Winner:{" "}
                  <strong className="text-go">
                    {slotProducts[winnerIndex]!.name}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setWinnerLocked(false)}
                  aria-label="Clear winner"
                  className="ml-1 text-text-dim transition-colors hover:text-text"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Comparison table */}
        {filled.length >= 1 && (
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
              Breakdown
            </p>
            <ComparisonTable
              products={slotProducts}
              winnerIndex={winnerIndex}
            />
          </div>
        )}
      </section>

      <ProductPicker
        open={openIdx !== null}
        onOpenChange={(o) => {
          if (!o) setOpenIdx(null);
        }}
        excludeIds={slots.filter((x): x is string => Boolean(x))}
        onPick={(p) => {
          if (openIdx !== null) setSlot(openIdx, p.id);
          setOpenIdx(null);
        }}
      />

      <Dialog open={confirmPick} onOpenChange={setConfirmPick}>
        <DialogContent
          className="rounded-3xl border border-border-soft bg-surface-elevated/90 backdrop-blur-2xl sm:max-w-md"
          style={{
            boxShadow: "0 24px 60px -24px rgba(0,0,0,0.45)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium tracking-[-0.01em]">
              Pick the winner?
            </DialogTitle>
            <DialogDescription className="text-sm text-text-muted">
              Wynner will lock in the highest-scoring product as your winner
              and surface a comparison summary you can share.
            </DialogDescription>
          </DialogHeader>
          <div className="my-2 flex items-center justify-between gap-3 rounded-2xl border border-border-soft bg-surface/60 p-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
              Comparison fee
            </span>
            <CostPreview cost={CREDIT_COSTS.country_compare} showInsufficient />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmPick(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPickWinner}
              className="rounded-full text-white"
              style={{
                background:
                  "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                boxShadow: "0 8px 22px -6px rgba(91,141,255,0.55)",
              }}
            >
              <Trophy className="mr-1.5 h-3.5 w-3.5" />
              Confirm — ✦ {CREDIT_COSTS.country_compare}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InsufficientModal
        open={insufficient.open}
        onOpenChange={(open) => setInsufficient((s) => ({ ...s, open }))}
        needed={insufficient.needed}
        forAction="pick a winner"
      />
    </main>
  );
}
