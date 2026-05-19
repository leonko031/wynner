"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { ScoreRing } from "@/components/animated/score-ring";
import { COUNTRIES } from "@/lib/data/countries";
import type { PillarKey } from "@/lib/scoring/types";
import type { Product, Verdict } from "@/types";
import { cn } from "@/lib/utils";

const VERDICT_META: Record<Verdict, { label: string; color: string }> = {
  go: { label: "GO LIVE", color: "#00D26A" },
  test: { label: "TEST IT", color: "#F5A623" },
  risky: { label: "RISKY", color: "#F97316" },
  skip: { label: "SKIP", color: "#EF4444" },
};

const PILLAR_LABELS: Record<PillarKey, string> = {
  margin: "Margin",
  marketFit: "Market fit",
  demand: "Demand",
  competition: "Competition",
  creative: "Creative",
};

type Props = {
  products: (Product | null)[];
  winnerIndex: number | null;
};

export function ComparisonTable({ products, winnerIndex }: Props) {
  const cols = products.length || 3;

  return (
    <div className="glass overflow-hidden rounded-3xl">
      {/* Sell Score row */}
      <Row label="Sell score">
        {products.map((p, i) => (
          <Cell key={i} highlight={winnerIndex === i}>
            {p ? (
              <div className="relative flex flex-col items-center gap-2">
                <ScoreRing value={p.sellScore} size={96} strokeWidth={7} />
                {winnerIndex === i && (
                  <motion.span
                    initial={{ opacity: 0, y: -6, scale: 0.7 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 360, damping: 22 }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                  >
                    <Crown className="h-5 w-5 text-go drop-shadow-[0_0_8px_rgba(0,210,106,0.7)]" />
                  </motion.span>
                )}
              </div>
            ) : (
              <Empty />
            )}
          </Cell>
        ))}
      </Row>

      {/* Pillars */}
      {(["margin", "marketFit", "demand", "competition", "creative"] as PillarKey[]).map(
        (k) => {
          const values = products.map((p) => (p ? p.pillars[k] : null));
          const max = Math.max(...values.filter((v): v is number => v !== null));
          return (
            <Row key={k} label={PILLAR_LABELS[k]}>
              {products.map((p, i) => {
                if (!p) return <Cell key={i}><Empty /></Cell>;
                const v = p.pillars[k];
                const isMax = v === max && values.filter((x) => x === max).length === 1;
                return (
                  <Cell key={i}>
                    <div className="flex flex-col items-center gap-1.5">
                      <span
                        className={cn(
                          "font-mono text-2xl tabular-nums",
                          isMax ? "text-go" : "text-text",
                        )}
                      >
                        {v}
                      </span>
                      <div className="h-1 w-24 overflow-hidden rounded-full bg-surface-elevated">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${v}%`,
                            backgroundColor:
                              v >= 75 ? "#00D26A" : v >= 50 ? "#F5A623" : "#EF4444",
                          }}
                        />
                      </div>
                    </div>
                  </Cell>
                );
              })}
            </Row>
          );
        },
      )}

      {/* Country */}
      <Row label="Country">
        {products.map((p, i) => (
          <Cell key={i}>
            {p ? (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xl">{COUNTRIES[p.targetCountry]?.flag}</span>
                <span className="text-sm">{COUNTRIES[p.targetCountry]?.name}</span>
                <span className="font-mono text-[10px] text-text-dim">
                  AOV €{COUNTRIES[p.targetCountry]?.avgAOV} · CPM idx{" "}
                  {COUNTRIES[p.targetCountry]?.cpmIndex}
                </span>
              </div>
            ) : (
              <Empty />
            )}
          </Cell>
        ))}
      </Row>

      {/* Margin */}
      <Row label="Margin">
        {products.map((p, i) => {
          if (!p) return <Cell key={i}><Empty /></Cell>;
          const gross = p.suggestedPriceUSD - p.costUSD - p.shippingCostUSD;
          const markup = p.suggestedPriceUSD / (p.costUSD + p.shippingCostUSD);
          return (
            <Cell key={i}>
              <div className="flex flex-col items-center">
                <span className="font-mono text-base tabular-nums text-text">
                  ${gross.toFixed(2)}
                </span>
                <span className="font-mono text-[10px] text-text-dim">
                  {markup.toFixed(1)}× markup
                </span>
              </div>
            </Cell>
          );
        })}
      </Row>

      {/* Verdict */}
      <Row label="Verdict">
        {products.map((p, i) => (
          <Cell key={i}>
            {p ? (
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wider"
                style={{
                  backgroundColor: `${VERDICT_META[p.verdict].color}26`,
                  color: VERDICT_META[p.verdict].color,
                  border: `1px solid ${VERDICT_META[p.verdict].color}40`,
                }}
              >
                {VERDICT_META[p.verdict].label}
              </span>
            ) : (
              <Empty />
            )}
          </Cell>
        ))}
      </Row>

      {/* Top angle */}
      <Row label="Top angle" tall>
        {products.map((p, i) => (
          <Cell key={i} tall>
            {p ? (
              <p className="max-w-xs text-center text-xs leading-relaxed text-text-muted">
                {p.reasoning.topAngle}
              </p>
            ) : (
              <Empty />
            )}
          </Cell>
        ))}
      </Row>

      {/* implicit grid sizing via flex */}
      <span hidden>{cols}</span>
    </div>
  );
}

function Row({
  label,
  tall,
  children,
}: {
  label: string;
  tall?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[120px_repeat(3,1fr)] border-b border-border-soft last:border-b-0",
        tall ? "min-h-[100px]" : "min-h-[80px]",
      )}
    >
      <div className="flex items-center justify-end border-r border-border-soft bg-surface/40 px-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">
        {label}
      </div>
      {children}
    </div>
  );
}

function Cell({
  children,
  highlight,
  tall,
}: {
  children: React.ReactNode;
  highlight?: boolean;
  tall?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center border-r border-border-soft px-4 py-4 last:border-r-0",
        highlight && "bg-go/5",
        tall && "py-5",
      )}
    >
      {children}
    </div>
  );
}

function Empty() {
  return <span className="text-xs text-text-dim">—</span>;
}
