"use client";

import * as Lucide from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProductStatusStore } from "@/lib/store/product-status";
import { PRODUCT_STATUSES, STATUS_META } from "@/types/vault";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  /** Visual size variant. */
  size?: "xs" | "sm";
  /** When true, always show the pill even for "active" (default = hide). */
  alwaysShow?: boolean;
};

/**
 * Inline status indicator + setter. Click → opens a dropdown to change.
 * Default status is "active" (hidden unless alwaysShow).
 */
export function StatusPill({ productId, size = "xs", alwaysShow }: Props) {
  const status = useProductStatusStore(
    (s) => s.statuses[productId] ?? "active",
  );
  const setStatus = useProductStatusStore((s) => s.setStatus);

  if (status === "active" && !alwaysShow) return null;

  const meta = STATUS_META[status];
  const Icon =
    ((Lucide as unknown as Record<string, React.ElementType>)[meta.icon] as
      | React.ElementType
      | undefined) ?? Lucide.Sparkles;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center gap-1 rounded-full font-mono uppercase tracking-wider backdrop-blur",
            size === "xs"
              ? "px-1.5 py-0.5 text-[9px]"
              : "px-2 py-0.5 text-[10px]",
          )}
          style={{
            background: `${meta.color}1A`,
            color: meta.color,
            border: `1px solid ${meta.color}55`,
          }}
          aria-label={`Status: ${meta.label}. Click to change.`}
        >
          <Icon className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} />
          {meta.label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className="w-44">
        <DropdownMenuLabel className="px-2 pb-1 pt-1.5 font-mono text-[10px] uppercase tracking-wider text-text-dim">
          Set status
        </DropdownMenuLabel>
        {PRODUCT_STATUSES.map((s) => {
          const m = STATUS_META[s];
          const ItemIcon =
            ((Lucide as unknown as Record<string, React.ElementType>)[m.icon] as
              | React.ElementType
              | undefined) ?? Lucide.Sparkles;
          return (
            <DropdownMenuItem
              key={s}
              onSelect={() => void setStatus(productId, s)}
              className="cursor-pointer text-xs"
            >
              <ItemIcon className="h-3.5 w-3.5" style={{ color: m.color }} />
              <span className="flex-1">{m.label}</span>
              {status === s && <span className="text-text-dim">✓</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
