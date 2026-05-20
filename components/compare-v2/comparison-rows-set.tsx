"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Minus,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Sparkline } from "@/components/animated/sparkline";
import { ComparisonRow, WinningValue } from "./comparison-row";
import { COUNTRIES } from "@/lib/data/countries";
import type { Product, Verdict } from "@/types";
import { cn } from "@/lib/utils";

const VERDICT_COLOR: Record<Verdict, string> = {
  go: "#3DD68C",
  test: "#FFAB40",
  risky: "#FF7E5F",
  skip: "#FF5C7C",
};

const PILLAR_LABELS = {
  margin: "Margin",
  marketFit: "Market fit",
  demand: "Demand",
  competition: "Competition",
  creative: "Creative",
} as const;

type Props = {
  products: Product[];
  /** Per-slot display score (already weighted/what-if-adjusted). */
  scores: number[];
};

/**
 * The full set of 10 comparison rows. Built as a single component so the
 * grid alignment + winner highlighting stay consistent in one place.
 */
export function ComparisonRowsSet({ products, scores }: Props) {
  const columns = products.length;

  /* ---------- helpers shared across rows --------------------------------- */

  const maxIndex = (vals: number[]): number =>
    vals.reduce((best, v, i) => (v > vals[best]! ? i : best), 0);
  const minIndex = (vals: number[]): number =>
    vals.reduce((best, v, i) => (v < vals[best]! ? i : best), 0);

  return (
    <div className="space-y-3">
      {/* ROW 1 — Sell score */}
      <ComparisonRow
        label="Sell score"
        description="Wynner's overall 0-100 score, weighted across the 5 pillars."
        winnerIndex={maxIndex(scores)}
        index={0}
        columns={columns}
        cells={products.map((p, i) => {
          const accent = VERDICT_COLOR[p.verdict];
          return (
            <div key={p.id} className="flex flex-col gap-1">
              <span
                className={cn(
                  "font-mono text-3xl font-medium tabular-nums leading-none",
                  scores[i] === Math.max(...scores) ? "text-go" : "text-text",
                )}
              >
                {scores[i]}
              </span>
              <span
                className="inline-flex w-fit items-center rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                style={{
                  background: `${accent}1A`,
                  color: accent,
                  border: `1px solid ${accent}40`,
                }}
              >
                {p.verdict.toUpperCase()}
              </span>
            </div>
          );
        })}
      />

      {/* ROW 2 — Verdict reasoning */}
      <ComparisonRow
        label="Reasoning"
        description="Wynner's one-line take on each product."
        index={1}
        columns={columns}
        cells={products.map((p) => (
          <p key={p.id} className="text-sm leading-snug text-text-muted">
            {p.reasoning?.whyTest?.[0] ?? p.reasoning?.topAngle ?? "—"}
          </p>
        ))}
      />

      {/* ROW 3 — Five pillars (collapsed) */}
      {(Object.keys(PILLAR_LABELS) as (keyof typeof PILLAR_LABELS)[]).map(
        (key, pi) => {
          const vals = products.map((p) => p.pillars[key]);
          const winIdx = maxIndex(vals);
          return (
            <ComparisonRow
              key={`pillar-${key}`}
              label={PILLAR_LABELS[key]}
              description={`Pillar score 0-100. ${
                key === "competition"
                  ? "Higher = less saturated = better."
                  : "Higher = stronger signal."
              }`}
              winnerIndex={winIdx}
              index={2 + pi}
              columns={columns}
              cells={products.map((p, i) => {
                const v = p.pillars[key];
                const color =
                  v >= 75 ? "#3DD68C" : v >= 50 ? "#FFAB40" : "#FF7E5F";
                return (
                  <div key={p.id} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-mono text-base tabular-nums w-9",
                        i === winIdx ? "text-go" : "text-text",
                      )}
                    >
                      {v}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-elevated">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${v}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{
                          background: color,
                          boxShadow:
                            i === winIdx
                              ? `0 0 8px ${color}aa`
                              : undefined,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              expanded={
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `minmax(140px, 200px) repeat(${columns}, minmax(0, 1fr)) 40px`,
                  }}
                >
                  <span />
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-border-soft bg-surface/40 p-3"
                    >
                      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                        {p.name}
                      </div>
                      <p className="text-xs leading-relaxed text-text">
                        {pillarReasonFor(p, key)}
                      </p>
                    </div>
                  ))}
                  <span />
                </div>
              }
            />
          );
        },
      )}

      {/* ROW 4 — Country fit */}
      <ComparisonRow
        label="Country fit"
        description="How well the destination country's profile lines up with this product."
        index={8}
        columns={columns}
        cells={products.map((p) => {
          const c = COUNTRIES[p.targetCountry];
          if (!c) return <span key={p.id} className="text-text-muted">—</span>;
          const aovFit = c.avgAOV >= p.suggestedPriceUSD * 0.8;
          const paymentFit = c.cardTrust >= 7;
          const shippingFit = c.shippingTolerance >= 5;
          return (
            <div key={p.id} className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm">
                <span aria-hidden>{c.flag}</span>
                <span className="text-text">{c.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <FitChip ok={aovFit} label="AOV" />
                <FitChip ok={paymentFit} label="Cards" />
                <FitChip ok={shippingFit} label="Ship" />
              </div>
            </div>
          );
        })}
      />

      {/* ROW 5 — Margin math */}
      <ComparisonRow
        label="Margin"
        description="Cost, price, and gross margin per product."
        winnerIndex={maxIndex(
          products.map(
            (p) => p.suggestedPriceUSD - p.costUSD - p.shippingCostUSD,
          ),
        )}
        index={9}
        columns={columns}
        cells={products.map((p, i) => {
          const margin = p.suggestedPriceUSD - p.costUSD - p.shippingCostUSD;
          const markup = p.suggestedPriceUSD / Math.max(0.01, p.costUSD + p.shippingCostUSD);
          const winning =
            i ===
            maxIndex(
              products.map((q) => q.suggestedPriceUSD - q.costUSD - q.shippingCostUSD),
            );
          return (
            <div key={p.id} className="space-y-0.5">
              <div className="flex items-baseline gap-2 text-sm">
                <WinningValue winning={winning}>${margin.toFixed(2)}</WinningValue>
                <span className="font-mono text-[10px] text-text-dim">
                  {markup.toFixed(1)}×
                </span>
              </div>
              <div className="font-mono text-[10px] text-text-dim">
                ${p.costUSD.toFixed(2)} → ${p.suggestedPriceUSD.toFixed(2)}
              </div>
            </div>
          );
        })}
      />

      {/* ROW 6 — Demand signal */}
      <ComparisonRow
        label="Demand"
        description="30-day demand sparkline + trend direction."
        winnerIndex={maxIndex(
          products.map((p) => p.pillars.demand),
        )}
        index={10}
        columns={columns}
        cells={products.map((p) => {
          const len = p.demandTrend.length;
          const first = p.demandTrend[0] ?? 0;
          const last = p.demandTrend[len - 1] ?? 0;
          const deltaPct = first === 0 ? 0 : Math.round(((last - first) / first) * 100);
          const accent = VERDICT_COLOR[p.verdict];
          const trendIcon =
            deltaPct > 5 ? ArrowUp : deltaPct < -5 ? ArrowDown : Minus;
          const TrendIcon = trendIcon;
          return (
            <div key={p.id} className="space-y-1">
              <div className="h-10">
                <Sparkline data={p.demandTrend} color={accent} height={40} />
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] text-text-muted">
                <TrendIcon className="h-3 w-3" />
                {deltaPct >= 0 ? "+" : ""}{deltaPct}%
              </div>
            </div>
          );
        })}
      />

      {/* ROW 7 — Top angle */}
      <ComparisonRow
        label="Top angle"
        description="The recommended creative hook for this product."
        index={11}
        columns={columns}
        cells={products.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-aurora-purple/25 bg-aurora-purple/[0.06] p-2.5"
          >
            <p className="text-xs italic leading-snug text-text">
              &ldquo;{p.reasoning?.topAngle ?? "Angle not generated yet — re-score to surface it."}&rdquo;
            </p>
          </div>
        ))}
      />

      {/* ROW 8 — Risk profile */}
      <ComparisonRow
        label="Risks"
        description="Number of red flags surfaced by the scoring engine."
        winnerIndex={minIndex(products.map((p) => p.reasoning?.redFlags?.length ?? 0))}
        index={12}
        columns={columns}
        cells={products.map((p) => {
          const flags = p.reasoning?.redFlags ?? [];
          return (
            <div key={p.id} className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm">
                <AlertTriangle
                  className={cn(
                    "h-3.5 w-3.5",
                    flags.length === 0
                      ? "text-go"
                      : flags.length <= 2
                        ? "text-test"
                        : "text-skip",
                  )}
                />
                <span className="font-mono tabular-nums">
                  {flags.length} flag{flags.length === 1 ? "" : "s"}
                </span>
              </div>
              {flags[0] && (
                <p className="line-clamp-2 text-[11px] text-text-muted">
                  {flags[0]}
                </p>
              )}
            </div>
          );
        })}
        expanded={
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `minmax(140px, 200px) repeat(${columns}, minmax(0, 1fr)) 40px`,
            }}
          >
            <span />
            {products.map((p) => {
              const flags = p.reasoning?.redFlags ?? [];
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-border-soft bg-surface/40 p-3"
                >
                  <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                    <ShieldAlert className="h-3 w-3" />
                    {p.name}
                  </div>
                  {flags.length === 0 ? (
                    <p className="text-xs text-text-muted">No flags raised.</p>
                  ) : (
                    <ul className="space-y-1">
                      {flags.slice(0, 5).map((f, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-text"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-skip" />
                          <span className="leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
            <span />
          </div>
        }
      />

      {/* ROW 9 — Target persona snapshot — uses customerVoice if present */}
      <ComparisonRow
        label="Persona"
        description="The buyer Wynner's voice mining identified for this product."
        index={13}
        columns={columns}
        cells={products.map((p) => {
          const persona = p.customerVoice?.inferredAvatar;
          if (!persona) {
            return (
              <span key={p.id} className="text-xs text-text-dim">
                Persona not generated. Run voice mining on the product page.
              </span>
            );
          }
          return (
            <div key={p.id} className="space-y-0.5">
              <div className="text-sm font-medium text-text">{persona.ageRange}</div>
              <div className="text-[11px] leading-snug text-text-muted">
                {persona.occupation}
              </div>
            </div>
          );
        })}
      />

      {/* ROW 10 — Required budget */}
      <ComparisonRow
        label="Test budget"
        description="Rough starting budget for a 4-day creative test, based on price + country CPM."
        winnerIndex={minIndex(products.map((p) => estimateBudget(p)))}
        index={14}
        columns={columns}
        cells={products.map((p) => {
          const budget = estimateBudget(p);
          const roas = estimateRoas(p);
          return (
            <div key={p.id} className="space-y-0.5 text-sm">
              <div className="font-mono tabular-nums">${budget}</div>
              <div className="font-mono text-[10px] text-text-dim">
                target {roas.toFixed(1)}× ROAS
              </div>
            </div>
          );
        })}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function FitChip({ ok, label }: { ok: boolean; label: string }) {
  const Icon = ok ? CheckCircle2 : XCircle;
  const color = ok ? "var(--color-go)" : "var(--color-risky)";
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5"
      style={{
        color,
        background: ok ? "rgba(61,214,140,0.08)" : "rgba(255,126,95,0.08)",
        borderColor: ok ? "rgba(61,214,140,0.30)" : "rgba(255,126,95,0.30)",
      }}
    >
      <Icon className="h-2.5 w-2.5" />
      <span className="font-mono text-[9px] uppercase tracking-wider">{label}</span>
    </span>
  );
}

function pillarReasonFor(p: Product, key: keyof typeof PILLAR_LABELS): string {
  const v = p.pillars[key];
  const tier = v >= 75 ? "strong" : v >= 50 ? "decent" : "weak";
  const labels: Record<typeof key, string> = {
    margin: `${tier} margin headroom (${v}/100)`,
    marketFit: `${tier} match to ${p.targetCountry} (${v}/100)`,
    demand: `${tier} demand signal (${v}/100)`,
    competition: `${tier} competitive position (${v}/100) — higher = less saturated`,
    creative: `${tier} creative angle potential (${v}/100)`,
  };
  return labels[key];
}

function estimateBudget(p: Product): number {
  const country = COUNTRIES[p.targetCountry];
  const cpmIndex = country?.cpmIndex ?? 10;
  // Daily budget proportional to price × CPM tier, rounded to nearest 10.
  const daily = Math.max(30, Math.round((p.suggestedPriceUSD * cpmIndex) / 8 / 10) * 10);
  return daily * 4; // 4-day test
}

function estimateRoas(p: Product): number {
  // Higher pillar scores → higher target ROAS; cap at 2.5.
  const blend =
    (p.pillars.margin + p.pillars.demand + p.pillars.competition) / 3;
  return Math.max(1.2, Math.min(2.5, 1.0 + blend / 100));
}
