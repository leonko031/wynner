"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/types";
import type { VaultDensity, VaultView } from "@/types/vault";
import { ProductCardGrid } from "./product-card-grid";
import { ProductRowV2 } from "./product-row";
import { ProductGalleryCard } from "./product-gallery-card";
import { cn } from "@/lib/utils";

type Props = {
  products: Product[];
  view: VaultView;
  density: VaultDensity;
  selectMode: boolean;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  /** Per-product semantic-search reasons (when AI search has run). */
  reasons?: Map<string, string>;
};

const GRID_CLASS: Record<VaultDensity, string> = {
  compact: "grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  comfortable: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
  spacious: "grid grid-cols-1 gap-6 sm:grid-cols-2",
};

const GALLERY_CLASS: Record<VaultDensity, string> = {
  compact: "grid grid-cols-1 gap-3 md:grid-cols-3",
  comfortable: "grid grid-cols-1 gap-4 md:grid-cols-2",
  spacious: "grid grid-cols-1 gap-5",
};

export function ProductGrid({
  products,
  view,
  density,
  selectMode,
  selectedIds,
  toggleSelect,
  reasons,
}: Props) {
  return (
    <motion.div layout className="relative">
      <AnimatePresence mode="popLayout" initial={false}>
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("flex flex-col", density === "compact" ? "gap-1.5" : "gap-2")}
          >
            {products.map((p, i) => (
              <ProductRowV2
                key={p.id}
                product={p}
                index={i}
                selectMode={selectMode}
                selected={selectedIds.has(p.id)}
                onToggleSelect={() => toggleSelect(p.id)}
              />
            ))}
          </motion.div>
        ) : view === "gallery" ? (
          <motion.div
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={GALLERY_CLASS[density]}
          >
            {products.map((p, i) => (
              <ProductGalleryCard
                key={p.id}
                product={p}
                index={i}
                selectMode={selectMode}
                selected={selectedIds.has(p.id)}
                onToggleSelect={() => toggleSelect(p.id)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(GRID_CLASS[density], "group/grid")}
          >
            {products.map((p, i) => (
              <div key={p.id} className="group">
                <ProductCardGrid
                  product={p}
                  index={i}
                  selectMode={selectMode}
                  selected={selectedIds.has(p.id)}
                  onToggleSelect={() => toggleSelect(p.id)}
                  reason={reasons?.get(p.id)}
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
