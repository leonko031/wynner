"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MoreVertical, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProductStore } from "@/lib/store/products";
import { COLLECTION_COLOR_HEX, type CollectionColor, type CollectionType } from "@/types/vault";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  name: string;
  description?: string | null;
  rationale?: string | null;
  color: CollectionColor;
  type: CollectionType;
  productIds: string[];
  selected: boolean;
  emoji?: string;
  onClick: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onChangeColor?: (color: CollectionColor) => void;
};

/**
 * Tile card for the horizontal rail. Top: 2×2 mini grid of the highest-scored
 * product images in the collection. Bottom: name + count + type pill.
 */
export function CollectionCard({
  id,
  name,
  description,
  rationale,
  color,
  type,
  productIds,
  selected,
  emoji,
  onClick,
  onRename,
  onDelete,
  onChangeColor,
}: Props) {
  const accent = COLLECTION_COLOR_HEX[color];
  const products = useProductStore((s) => s.products);
  // Top-4 images by score from the assigned product ids.
  const thumbs = products
    .filter((p) => productIds.includes(p.id))
    .sort((a, b) => b.sellScore - a.sellScore)
    .slice(0, 4);

  // Pad to 4 slots
  const slots = [...thumbs];
  while (slots.length < 4) slots.push(null as unknown as (typeof thumbs)[number]);

  const card = (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass relative flex w-[200px] shrink-0 flex-col gap-3 rounded-2xl p-3 text-left transition-all",
        selected && "ring-2",
      )}
      style={{
        boxShadow: selected
          ? `0 0 0 1px ${accent}AA, 0 16px 36px -10px ${accent}55, inset 0 1px 0 0 var(--surface-glass-highlight)`
          : `0 0 0 1px ${accent}22, 0 12px 24px -16px ${accent}40, inset 0 1px 0 0 var(--surface-glass-highlight)`,
        ...(selected ? { ["--tw-ring-color" as string]: accent } : {}),
      }}
      data-collection-id={id}
    >
      {/* Type ribbon */}
      <span
        className="absolute -top-2 right-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white"
        style={{
          background: accent,
          boxShadow: `0 4px 12px -2px ${accent}aa`,
        }}
      >
        {type === "smart" && <Sparkles className="h-2.5 w-2.5" />}
        {type}
      </span>

      {/* 2×2 thumbnail grid */}
      <div className="grid grid-cols-2 gap-1.5 overflow-hidden rounded-xl">
        {slots.map((p, i) => (
          <div
            key={i}
            className="relative aspect-square overflow-hidden rounded-md border border-border-soft/60"
            style={{ background: p ? undefined : "var(--surface-glass)" }}
          >
            {p ? (
              <Image
                src={p.image}
                alt=""
                fill
                sizes="100px"
                className="object-cover"
                unoptimized
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* Name + count */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {emoji && <span aria-hidden className="text-sm leading-none">{emoji}</span>}
            <span className="truncate text-sm font-medium text-text">{name}</span>
          </div>
          {(onRename || onDelete || onChangeColor) && (
            <CollectionMenu
              onRename={onRename}
              onDelete={onDelete}
              onChangeColor={onChangeColor}
            />
          )}
        </div>
        <div className="mt-0.5 font-mono text-[10px] text-text-dim">
          {productIds.length} product{productIds.length === 1 ? "" : "s"}
        </div>
      </div>
    </motion.button>
  );

  // Smart collections get a rationale tooltip on hover.
  if (type === "smart" && rationale) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-xs">
          <div className="font-medium">Why this group?</div>
          <p className="mt-1 leading-snug text-text-muted">{rationale}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (description) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[240px] text-xs">
          {description}
        </TooltipContent>
      </Tooltip>
    );
  }

  return card;
}

function CollectionMenu({
  onRename,
  onDelete,
  onChangeColor,
}: {
  onRename?: () => void;
  onDelete?: () => void;
  onChangeColor?: (color: CollectionColor) => void;
}) {
  void onChangeColor; // color picker UI lives in the rename modal; surfacing later
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Collection options"
          onClick={(e) => e.stopPropagation()}
          className="flex h-6 w-6 items-center justify-center rounded-full text-text-dim hover:bg-surface-elevated hover:text-text"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className="w-40">
        {onRename && (
          <DropdownMenuItem onSelect={onRename} className="cursor-pointer text-xs">
            Rename
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            onSelect={onDelete}
            className="cursor-pointer text-xs text-skip focus:text-skip"
          >
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
