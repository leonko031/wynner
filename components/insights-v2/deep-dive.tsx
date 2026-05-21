"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Sparkline } from "@/components/animated/sparkline";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import type { Product, Verdict } from "@/types";
import { cn } from "@/lib/utils";

type Tab = "niche" | "country";

type Props = {
  products: Product[];
};

const VERDICT_COLOR: Record<Verdict, string> = {
  go: "#3DD68C",
  test: "#FFAB40",
  risky: "#FF7E5F",
  skip: "#FF5C7C",
};

type Row = {
  key: string;
  label: string;
  swatch: string;
  icon?: string;
  count: number;
  avgScore: number;
  verdicts: Record<Verdict, number>;
  winRate: number;
  spark: number[];
  drillUrl: string;
};

function buildSparkline(products: Product[]): number[] {
  // Use the last 14 daily score averages (filling empties with 0).
  const MS_DAY = 24 * 60 * 60 * 1000;
  const days = 14;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets: { sum: number; n: number }[] = Array.from(
    { length: days },
    () => ({ sum: 0, n: 0 }),
  );
  for (const p of products) {
    const t = new Date(p.createdAt).getTime();
    const offset = Math.floor((today.getTime() - t) / MS_DAY);
    if (offset >= 0 && offset < days) {
      const idx = days - 1 - offset;
      buckets[idx].sum += p.sellScore;
      buckets[idx].n += 1;
    }
  }
  // Carry forward last seen value so sparkline doesn't crash to zero.
  let lastSeen = 0;
  return buckets.map((b) => {
    if (b.n === 0) return lastSeen;
    lastSeen = Math.round(b.sum / b.n);
    return lastSeen;
  });
}

/** "Win rate" — % of scans in this slice that landed GO or TEST. */
function positiveRate(arr: Product[]): number {
  if (arr.length === 0) return 0;
  const wins = arr.filter((p) => p.verdict === "go" || p.verdict === "test").length;
  return wins / arr.length;
}

function rowsByNiche(products: Product[]): Row[] {
  const groups = new Map<string, Product[]>();
  for (const p of products) {
    const arr = groups.get(p.category) ?? [];
    arr.push(p);
    groups.set(p.category, arr);
  }
  return [...groups.entries()]
    .map(([k, arr]): Row => {
      const meta = NICHES[k as keyof typeof NICHES];
      const verdicts: Record<Verdict, number> = { go: 0, test: 0, risky: 0, skip: 0 };
      for (const p of arr) verdicts[p.verdict]++;
      return {
        key: k,
        label: meta?.label ?? k,
        swatch: meta?.color ?? "#A788FF",
        icon: meta?.icon,
        count: arr.length,
        avgScore: Math.round(
          arr.reduce((s, p) => s + p.sellScore, 0) / arr.length,
        ),
        verdicts,
        winRate: positiveRate(arr),
        spark: buildSparkline(arr),
        drillUrl: `/scan?niche=${k}`,
      };
    })
    .sort((a, b) => b.count - a.count);
}

function rowsByCountry(products: Product[]): Row[] {
  const groups = new Map<string, Product[]>();
  for (const p of products) {
    const arr = groups.get(p.targetCountry) ?? [];
    arr.push(p);
    groups.set(p.targetCountry, arr);
  }
  return [...groups.entries()]
    .map(([k, arr]): Row => {
      const meta = COUNTRIES[k];
      const verdicts: Record<Verdict, number> = { go: 0, test: 0, risky: 0, skip: 0 };
      for (const p of arr) verdicts[p.verdict]++;
      return {
        key: k,
        label: meta ? `${meta.flag} ${meta.name}` : k,
        swatch: "#5B8DFF",
        count: arr.length,
        avgScore: Math.round(
          arr.reduce((s, p) => s + p.sellScore, 0) / arr.length,
        ),
        verdicts,
        winRate: positiveRate(arr),
        spark: buildSparkline(arr),
        drillUrl: `/scan?country=${k}`,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export function DeepDive({ products }: Props) {
  const [tab, setTab] = useState<Tab>("niche");
  const rows = useMemo(
    () => (tab === "niche" ? rowsByNiche(products) : rowsByCountry(products)),
    [tab, products],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-3xl p-6"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <h3 className="font-serif text-xl text-text">Per-category performance</h3>
        <div className="flex items-center gap-1 rounded-full bg-surface/60 p-1">
          <button
            type="button"
            onClick={() => setTab("niche")}
            className={cn(
              "rounded-full px-3 py-1 text-xs",
              tab === "niche"
                ? "bg-surface text-text shadow-sm"
                : "text-text-muted hover:text-text",
            )}
          >
            By niche
          </button>
          <button
            type="button"
            onClick={() => setTab("country")}
            className={cn(
              "rounded-full px-3 py-1 text-xs",
              tab === "country"
                ? "bg-surface text-text shadow-sm"
                : "text-text-muted hover:text-text",
            )}
          >
            By country
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-soft p-8 text-center text-sm text-text-muted">
          Score a few products to break it down per category.
        </div>
      ) : (
        <ul className="divide-y divide-border-soft">
          {rows.map((row, i) => (
            <DeepDiveRow key={row.key} row={row} delay={i * 0.04} />
          ))}
        </ul>
      )}
    </motion.section>
  );
}

function DeepDiveRow({ row, delay }: { row: Row; delay: number }) {
  const router = useRouter();
  const total = Object.values(row.verdicts).reduce((s, n) => s + n, 0);
  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-[160px_60px_1fr_80px_60px_24px] items-center gap-3 py-3 text-sm"
    >
      <div className="flex items-center gap-2 truncate">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: row.swatch }}
        />
        <span className="truncate font-medium text-text">{row.label}</span>
      </div>
      <span className="font-mono tabular-nums text-text-muted">
        {row.count}
      </span>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface/60">
          <div
            className="h-full rounded-full"
            style={{
              width: `${row.avgScore}%`,
              background:
                row.avgScore >= 80
                  ? "#3DD68C"
                  : row.avgScore >= 60
                    ? "#FFAB40"
                    : row.avgScore >= 40
                      ? "#FF7E5F"
                      : "#FF5C7C",
            }}
          />
        </div>
        <span className="font-mono text-xs tabular-nums text-text">
          {row.avgScore}
        </span>
        {/* Verdict stack bar */}
        <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-surface/60 md:flex">
          {(["go", "test", "risky", "skip"] as const).map((v) => {
            const pct = total === 0 ? 0 : (row.verdicts[v] / total) * 100;
            if (pct === 0) return null;
            return (
              <span
                key={v}
                className="h-full"
                style={{ width: `${pct}%`, backgroundColor: VERDICT_COLOR[v] }}
              />
            );
          })}
        </div>
      </div>
      <div className="hidden h-7 w-full md:block">
        <Sparkline data={row.spark} color={row.swatch} height={28} />
      </div>
      <span className="font-mono text-xs tabular-nums text-text-muted">
        {Math.round(row.winRate * 100)}%
      </span>
      <button
        type="button"
        onClick={() => router.push(row.drillUrl)}
        className="rounded-full p-1.5 text-text-muted hover:bg-surface hover:text-text"
        aria-label="Drill into category"
      >
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </motion.li>
  );
}
