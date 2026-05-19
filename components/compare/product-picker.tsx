"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProductStore } from "@/lib/store/products";
import type { Product } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (product: Product) => void;
  excludeIds?: string[];
};

export function ProductPicker({ open, onOpenChange, onPick, excludeIds = [] }: Props) {
  const products = useProductStore((s) => s.products);
  const favorites = useProductStore((s) => s.favorites);
  const recentlyViewed = useProductStore((s) => s.recentlyViewed);

  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const available = products.filter((p) => !excludeIds.includes(p.id));
    if (!t) return null;
    return available.filter((p) =>
      `${p.name} ${p.description}`.toLowerCase().includes(t),
    );
  }, [products, excludeIds, q]);

  const recent: Product[] = useMemo(
    () =>
      recentlyViewed
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p))
        .filter((p) => !excludeIds.includes(p.id))
        .slice(0, 6),
    [recentlyViewed, products, excludeIds],
  );

  const favList: Product[] = useMemo(
    () =>
      products
        .filter((p) => favorites.has(p.id))
        .filter((p) => !excludeIds.includes(p.id))
        .slice(0, 6),
    [products, favorites, excludeIds],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a product to compare</DialogTitle>
          <DialogDescription>
            Search, or pick from your recently viewed and favorites.
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Search by name or description…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mt-2"
        />
        <ScrollArea className="mt-3 h-80 rounded-md border border-border-soft">
          <div className="p-2">
            {filtered !== null ? (
              <Section
                title="Results"
                items={filtered}
                onPick={(p) => {
                  onPick(p);
                  onOpenChange(false);
                  setQ("");
                }}
              />
            ) : (
              <>
                {recent.length > 0 && (
                  <Section
                    title="Recently viewed"
                    items={recent}
                    onPick={(p) => {
                      onPick(p);
                      onOpenChange(false);
                    }}
                  />
                )}
                {favList.length > 0 && (
                  <Section
                    title="Favorites"
                    items={favList}
                    onPick={(p) => {
                      onPick(p);
                      onOpenChange(false);
                    }}
                  />
                )}
                {recent.length === 0 && favList.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-text-muted">
                    Type to search any product.
                  </p>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  items,
  onPick,
}: {
  title: string;
  items: Product[];
  onPick: (p: Product) => void;
}) {
  if (items.length === 0)
    return (
      <div className="px-3 py-2 text-xs text-text-muted">
        No {title.toLowerCase()}.
      </div>
    );
  return (
    <div className="mb-2">
      <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-dim">
        {title}
      </div>
      <ul className="space-y-0.5">
        {items.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onPick(p)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-elevated"
            >
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-surface-elevated">
                <Image
                  src={p.image}
                  alt=""
                  fill
                  sizes="32px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-text">{p.name}</div>
                <div className="font-mono text-[10px] text-text-dim">
                  {p.verdict.toUpperCase()} · {p.targetCountry}
                </div>
              </div>
              <span className="font-mono text-xs tabular-nums text-text-muted">
                {p.sellScore}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
