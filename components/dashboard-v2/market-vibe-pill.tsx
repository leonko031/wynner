"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProductStore } from "@/lib/store/products";
import { VIBE_META, computeMarketVibe, type MarketVibe } from "@/lib/dashboard/market-vibe";

/**
 * Greeting-bar pill that surfaces a current market mood. Polls every 60s
 * from the local product store. Color + emoji + tooltip swap smoothly when
 * the bucket changes.
 */
export function MarketVibePill({ className }: { className?: string }) {
  const products = useProductStore((s) => s.products);
  const [vibe, setVibe] = useState<MarketVibe>(() => computeMarketVibe(products));

  // Recompute every 60s (cheap — pure read from local state). Initial
  // setState is deferred via setTimeout(0) so React 19 strict mode doesn't
  // flag it as in-effect-body.
  useEffect(() => {
    const tInit = window.setTimeout(() => setVibe(computeMarketVibe(products)), 0);
    const tInterval = window.setInterval(() => {
      setVibe(computeMarketVibe(products));
    }, 60_000);
    return () => {
      window.clearTimeout(tInit);
      window.clearInterval(tInterval);
    };
  }, [products]);

  const meta = VIBE_META[vibe];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.span
          key={vibe}
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs backdrop-blur ${className ?? ""}`}
          style={{
            color: meta.color,
            background: `${meta.color}1A`,
            border: `1px solid ${meta.color}45`,
          }}
        >
          <span className="text-text-muted">Market:</span>
          <span className="text-base leading-none" aria-hidden>
            {meta.emoji}
          </span>
          <span className="font-medium" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </motion.span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[260px] text-xs">
        {meta.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
