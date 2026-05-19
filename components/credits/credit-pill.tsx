"use client";

import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { Crown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCreditsStore } from "@/lib/store/credits";
import { isLowBalance } from "@/lib/credits/helpers";
import { cn } from "@/lib/utils";
import { CreditPopover } from "./credit-popover";
import { CreditPulse } from "./credit-pulse";
import { SparkIcon } from "./spark-icon";

/**
 * Top-nav credit balance pill. Click → opens the credit popover with usage,
 * plan info, and quick actions. Balance count-animates on change; floating
 * +/- indicators puff out via <CreditPulse />.
 *
 * SSR-safe: gates the dynamic number behind a `mounted` flag because Zustand
 * persist hydrates after first paint and would otherwise mismatch.
 */
export function CreditPill() {
  const balance = useCreditsStore((s) => s.balance);
  const plan = useCreditsStore((s) => s.plan);
  const isAdmin = useCreditsStore((s) => s.isAdmin);
  const [mounted, setMounted] = useState(false);
  const [prev, setPrev] = useState(balance);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  // Track the "previous" value for CountUp's `start` so it animates between
  // the old and new balances rather than from 0 each time.
  useEffect(() => {
    if (!mounted) return;
    const t = window.setTimeout(() => setPrev(balance), 1600);
    return () => window.clearTimeout(t);
  }, [balance, mounted]);

  // Admins never trigger the low-balance pulse.
  const low = !isAdmin && isLowBalance({ balance, plan });

  const trigger = (
    <button
      type="button"
      aria-label={isAdmin ? "Admin — unlimited credits" : `Credits: ${balance}`}
      className={cn(
        "group relative inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 transition-all",
        "backdrop-blur-xl",
        "border border-transparent",
        low && "animate-pulse-glow",
      )}
      style={{
        background: isAdmin
          ? "linear-gradient(135deg, rgba(91,141,255,0.18), rgba(167,136,255,0.22), rgba(255,137,197,0.18))"
          : "linear-gradient(135deg, rgba(91,141,255,0.10), rgba(167,136,255,0.12), rgba(255,137,197,0.10))",
        boxShadow: low
          ? "0 0 0 1px rgba(255,176,136,0.55), 0 0 18px rgba(255,176,136,0.35)"
          : isAdmin
            ? "0 0 0 1px rgba(167,136,255,0.55), 0 8px 20px -8px rgba(167,136,255,0.45)"
            : "0 0 0 1px rgba(167,136,255,0.30)",
      }}
    >
      {/* Gradient ring on hover (skipped for admins — already vivid) */}
      {!isAdmin && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(135deg, rgba(91,141,255,0.18), rgba(167,136,255,0.22), rgba(255,137,197,0.18))",
            boxShadow:
              "0 0 0 1px rgba(167,136,255,0.55), 0 10px 30px -8px rgba(167,136,255,0.45)",
          }}
        />
      )}

      {isAdmin ? (
        // Crown masked with the aurora gradient — premium, never gold-cheesy.
        <Crown
          aria-hidden
          className="relative z-10 h-3.5 w-3.5"
          style={{
            background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
            WebkitMask: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M2 4l5 6 5-8 5 8 5-6-1.5 13H3.5L2 4z'/></svg>\") center / contain no-repeat",
            mask: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M2 4l5 6 5-8 5 8 5-6-1.5 13H3.5L2 4z'/></svg>\") center / contain no-repeat",
          }}
        />
      ) : (
        <SparkIcon size={13} className="relative z-10" />
      )}

      <span
        className={cn(
          "relative z-10 text-text",
          isAdmin
            ? "font-serif text-[18px] font-medium leading-none"
            : "font-mono text-[13px] font-semibold tabular-nums",
        )}
      >
        {isAdmin ? (
          "∞"
        ) : mounted ? (
          <CountUp start={prev} end={balance} duration={1.1} preserveValue separator="," />
        ) : (
          "—"
        )}
      </span>
      <span className="relative z-10 hidden text-[10px] uppercase tracking-wider text-text-dim sm:inline">
        credits
      </span>
    </button>
  );

  return (
    <div className="relative">
      <Popover>
        <PopoverTrigger asChild>
          {isAdmin ? (
            <Tooltip>
              <TooltipTrigger asChild>{trigger}</TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Admin — unlimited credits
              </TooltipContent>
            </Tooltip>
          ) : (
            trigger
          )}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="glass-strong w-[360px] rounded-3xl border-0 p-0 shadow-[0_30px_60px_-20px_rgba(91,141,255,0.45)]"
        >
          <CreditPopover />
        </PopoverContent>
      </Popover>
      <CreditPulse />
    </div>
  );
}
