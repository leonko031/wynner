"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useProductStore } from "@/lib/store/products";
import type { Product } from "@/types";

type ComparisonRow = {
  id: string;
  product_ids: string[];
  winner_product_id: string;
  declaration: string;
  created_at: string;
};

type Props = {
  enabled: boolean;
};

/**
 * Horizontal scroll-snap rail of the user's past comparisons.
 * Pulls from `comparison_verdicts`, joins against the local product store
 * to render mini thumbnails + the crowned winner.
 */
export function ComparisonHistoryRail({ enabled }: Props) {
  const products = useProductStore((s) => s.products);
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) {
      const id = setTimeout(() => setLoaded(true), 0);
      return () => clearTimeout(id);
    }
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoaded(true);
        return;
      }
      const { data } = await supabase
        .from("comparison_verdicts")
        .select("id, product_ids, winner_product_id, declaration, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12);
      if (cancelled) return;
      setRows((data as ComparisonRow[] | null) ?? []);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!loaded) return null;
  if (rows.length === 0) {
    return null; // Don't show empty rail.
  }

  const winnerScores = rows
    .map((r) => products.find((p) => p.id === r.winner_product_id)?.sellScore)
    .filter((n): n is number => typeof n === "number");
  const avgWinner =
    winnerScores.length === 0
      ? 0
      : Math.round(
          winnerScores.reduce((s, n) => s + n, 0) / winnerScores.length,
        );

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-3xl p-6"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl text-text">Your judgment history</h3>
          <p className="mt-1 text-xs text-text-muted">
            {rows.length} comparison{rows.length === 1 ? "" : "s"} ·{" "}
            {winnerScores.length > 0 && (
              <>
                winners avg{" "}
                <span className="font-mono text-text">{avgWinner}</span>
              </>
            )}
          </p>
        </div>
        <Link
          href="/compare"
          className="rounded-full border border-border-soft bg-surface/60 px-3 py-1 text-xs text-text-muted hover:text-text"
        >
          New comparison
        </Link>
      </div>

      <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 hide-scrollbar">
        {rows.map((row, i) => {
          const productList = row.product_ids
            .map((id) => products.find((p) => p.id === id))
            .filter((p): p is Product => Boolean(p));
          const url = `/compare?products=${row.product_ids.join(",")}`;
          return (
            <Link
              key={row.id}
              href={url}
              className="block w-64 shrink-0 snap-start rounded-2xl border border-border-soft bg-surface/60 p-3 transition-colors hover:border-aurora-purple/55"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex gap-2">
                {productList.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="relative h-12 w-12 overflow-hidden rounded-md bg-surface/60"
                  >
                    {p.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {p.id === row.winner_product_id && (
                      <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-go text-white">
                        <Crown className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </div>
                ))}
                {productList.length === 0 && (
                  <div className="text-xs text-text-dim">Products unavailable</div>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-text">
                {row.declaration}
              </p>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                {new Date(row.created_at).toLocaleDateString()}
              </div>
            </Link>
          );
        })}
      </div>
    </motion.section>
  );
}
