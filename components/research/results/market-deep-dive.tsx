"use client";

import { motion } from "framer-motion";
import type { DeepResearchReport } from "@/types/research";
import { COUNTRIES } from "@/lib/data/countries";
import { ConfidencePill, ResultsSection } from "./section";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_FULL: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

function isPeak(month: string, peakMonths: string[]): boolean {
  const idx = MONTHS.indexOf(month);
  return peakMonths.some((p) => MONTH_FULL[p.trim().toLowerCase()] === idx);
}
function isLow(month: string, lowMonths: string[]): boolean {
  const idx = MONTHS.indexOf(month);
  return lowMonths.some((p) => MONTH_FULL[p.trim().toLowerCase()] === idx);
}

export function MarketDeepDive({ report }: { report: DeepResearchReport }) {
  const market = report.marketAnalysis;
  if (!market) return null;
  const country = COUNTRIES[market.countryCode];
  const currentMonthIdx = new Date().getMonth();

  return (
    <ResultsSection eyebrow="The market" title="Where this lands">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[3fr_4fr]">
        {/* Country profile */}
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden>{report.productSnapshot.countryFlag}</span>
            <div>
              <h3 className="text-lg font-medium tracking-tight text-text">
                {report.productSnapshot.countryName}
              </h3>
              <p className="text-xs text-text-muted">{country?.language?.toUpperCase()} · {country?.currency}</p>
            </div>
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-3 text-xs">
            <Stat label="Avg AOV" value={country ? `€${country.avgAOV}` : "—"} />
            <Stat label="CPM idx" value={country ? `${country.cpmIndex}` : "—"} />
            <Stat label="Shipping tolerance" value={country ? `${country.shippingTolerance}d` : "—"} />
            <Stat label="Return rate" value={country ? `${(country.returnRate * 100).toFixed(0)}%` : "—"} />
            <Stat label="Top platform" value={country?.topPlatform ?? "—"} />
            <Stat label="E-com penetration" value={country ? `${(country.ecommercePenetration * 100).toFixed(0)}%` : "—"} />
          </ul>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">Demand</span>
              <span className="text-text">{market.demandLevel}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">Trend</span>
              <span className="text-text">{market.growthTrend}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">Position</span>
              <span className="text-text">{market.seasonality.currentPosition}</span>
            </div>
          </div>
        </div>

        {/* Seasonality strip */}
        <div className="glass rounded-3xl p-6">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-lg font-medium tracking-tight text-text">Seasonality</h3>
              <p className="mt-0.5 text-xs text-text-muted">
                Where this product sells through the year.
              </p>
            </div>
            <ConfidencePill level={market.confidenceLevel} />
          </div>
          <div className="mt-6 flex items-end gap-1.5">
            {MONTHS.map((m, idx) => {
              const peak = isPeak(m, market.seasonality.peakMonths);
              const low = isLow(m, market.seasonality.lowMonths);
              const height = peak ? 100 : low ? 28 : 60;
              const color = peak ? "#3DD68C" : low ? "#FF7E5F" : "#5B8DFF";
              const isCurrent = idx === currentMonthIdx;
              return (
                <div
                  key={m}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-2",
                    isCurrent && "scale-110",
                  )}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${height}px` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full rounded-md"
                    style={{
                      background: color,
                      boxShadow: isCurrent ? `0 0 12px ${color}cc` : undefined,
                      opacity: isCurrent ? 1 : 0.7,
                    }}
                  />
                  <span
                    className={cn(
                      "font-mono text-[9px] uppercase tracking-wider",
                      isCurrent ? "text-text" : "text-text-dim",
                    )}
                  >
                    {m}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-5 rounded-2xl border border-border-soft bg-surface/50 p-3 text-xs">
            <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Market size
            </div>
            <p className="mt-1 text-text">{market.marketSizeEstimate}</p>
          </div>
          {market.regulatoryNotes.length > 0 && (
            <div className="mt-3 rounded-2xl border border-border-soft bg-surface/50 p-3 text-xs">
              <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                Regulatory notes
              </div>
              <ul className="mt-1.5 space-y-1">
                {market.regulatoryNotes.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-text-muted">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-dim" />
                    <span className="leading-snug">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </ResultsSection>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface/50 p-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">{label}</div>
      <div className="mt-1 text-sm font-medium text-text">{value}</div>
    </div>
  );
}
