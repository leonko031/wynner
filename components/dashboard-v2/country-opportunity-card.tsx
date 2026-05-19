"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Globe2 } from "lucide-react";
import { useProductStore } from "@/lib/store/products";
import {
  countryOpportunity,
  userProducts,
} from "@/lib/dashboard/momentum";
import { COUNTRIES } from "@/lib/data/countries";
import { COUNTRY_POSITIONS } from "@/lib/dashboard/country-positions";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CountryOpportunityCard() {
  const router = useRouter();
  const all = useProductStore((s) => s.products);
  const mine = userProducts(all);
  const rows = countryOpportunity(all, mine);

  // Pre-compute max opportunity for normalization
  const maxOp = Math.max(...rows.map((r) => r.opportunity), 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass h-full rounded-3xl p-6"
    >
      <div className="flex items-baseline justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-aurora-blue" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Country opportunity
            </span>
          </div>
          <h3 className="mt-1 font-serif text-xl text-text">Where the wind is blowing</h3>
        </div>
      </div>

      {/* Stylized world canvas with positioned dots */}
      <div
        className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border-soft"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(167,136,255,0.10), transparent 70%), radial-gradient(ellipse 70% 60% at 30% 40%, rgba(91,141,255,0.10), transparent 70%)",
        }}
      >
        {/* Decorative continent silhouettes — very simplified, just for context */}
        <svg
          viewBox="0 0 100 56"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full opacity-30"
          aria-hidden
        >
          {/* Americas blob */}
          <path
            d="M14,20 Q22,15 26,22 Q30,30 24,40 Q22,46 30,50 Q34,52 32,48 Q28,42 34,38 Q40,40 38,46 L36,52 Q30,54 22,52 Q16,48 14,40 Q12,30 14,20 Z"
            fill="rgba(167,136,255,0.18)"
          />
          {/* Eurafrica blob */}
          <path
            d="M45,20 Q50,18 53,22 Q57,28 55,34 Q56,42 52,48 Q56,52 54,54 Q50,52 48,46 Q44,42 46,36 Q42,30 45,20 Z"
            fill="rgba(91,141,255,0.18)"
          />
          {/* Asia blob */}
          <path
            d="M60,18 Q70,14 78,18 Q86,24 84,30 Q82,36 76,38 Q72,44 78,46 Q86,52 84,56 Q78,54 72,52 Q66,48 64,40 Q60,30 60,18 Z"
            fill="rgba(255,137,197,0.18)"
          />
          {/* Oceania */}
          <path
            d="M78,60 Q84,58 88,62 Q92,66 88,72 Q82,74 78,70 Q76,66 78,60 Z"
            fill="rgba(136,229,200,0.20)"
          />
        </svg>

        {/* Country dots */}
        {rows.map((row) => {
          const pos = COUNTRY_POSITIONS[row.code];
          if (!pos) return null;
          const country = COUNTRIES[row.code];
          const intensity = row.opportunity / maxOp; // 0..1
          const size = 10 + intensity * 18;
          return (
            <Tooltip key={row.code}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => router.push(`/vault?country=${row.code}`)}
                  aria-label={`${country?.name ?? row.code} — opportunity ${row.opportunity}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: size,
                    height: size,
                  }}
                >
                  <span
                    className="block h-full w-full rounded-full"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), transparent 60%), linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)`,
                      boxShadow: `0 0 ${Math.max(6, intensity * 18)}px rgba(167,136,255,${0.5 + intensity * 0.4})`,
                      opacity: 0.6 + intensity * 0.4,
                    }}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                <div className="font-medium">
                  {country?.flag} {country?.name}
                </div>
                <div className="mt-1 text-text-muted">
                  Opportunity {row.opportunity} · avg score {row.avgScore}
                </div>
                <div className="text-text-dim">
                  Your scans there: {row.scanCount}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Top 3 country rows below the map */}
      <div className="mt-4 space-y-1.5">
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          Top 3 this week
        </div>
        {rows.slice(0, 3).map((r) => {
          const country = COUNTRIES[r.code];
          return (
            <Link
              key={r.code}
              href={`/vault?country=${r.code}`}
              className="flex items-center justify-between rounded-xl border border-border-soft bg-surface/40 px-3 py-2 text-sm transition-colors hover:bg-surface/70"
            >
              <span className="flex items-center gap-2 text-text">
                <span aria-hidden>{country?.flag}</span>
                {country?.name ?? r.code}
              </span>
              <span className="font-mono text-xs tabular-nums text-text-dim">
                opp {r.opportunity}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
