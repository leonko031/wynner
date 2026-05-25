"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Megaphone,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import CountUp from "react-countup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

type Row = {
  id: string;
  email: string;
  position: number;
  referral_code: string;
  referrals_count: number;
  source: string | null;
  email_confirmed: boolean;
  email_confirmed_at: string | null;
  created_at: string;
  referred_by: string | null;
};

type Stats = {
  total: number;
  today: number;
  week: number;
  weekSparkline: number[];
  sourceBreakdown: { source: string; count: number }[];
};

type ListResponse = {
  rows: Row[];
  total: number;
  page: number;
  limit: number;
  stats: Stats;
};

export function WaitlistAdminClient() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "referrals">("newest");
  const [confirmedFilter, setConfirmedFilter] = useState<"all" | "true" | "false">("all");
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sortBy,
        confirmed: confirmedFilter,
      });
      if (search) params.set("search", search);
      if (sourceFilter) params.set("source", sourceFilter);
      const res = await fetch(`/api/admin/waitlist/list?${params.toString()}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const d = (await res.json()) as ListResponse;
      setData(d);
    } catch (e) {
      toast.error("Couldn't load waitlist", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, sourceFilter, sortBy, confirmedFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <Header />
      <StatsRow stats={data?.stats ?? null} />
      <ActionsBar onRefresh={() => void fetchData()} loading={loading} />
      <FiltersBar
        search={search}
        setSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        sortBy={sortBy}
        setSortBy={(v) => {
          setSortBy(v);
          setPage(1);
        }}
        confirmedFilter={confirmedFilter}
        setConfirmedFilter={(v) => {
          setConfirmedFilter(v);
          setPage(1);
        }}
        sourceFilter={sourceFilter}
        setSourceFilter={(v) => {
          setSourceFilter(v);
          setPage(1);
        }}
        sources={data?.stats.sourceBreakdown ?? []}
      />
      <RowsTable
        rows={data?.rows ?? []}
        loading={loading}
        onRowClick={setSelectedRow}
        onMutated={() => void fetchData()}
      />
      <Pagination
        page={page}
        totalPages={totalPages}
        total={data?.total ?? 0}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />
      <DetailSheet
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
        onMutated={() => void fetchData()}
      />
    </main>
  );
}

/* -------------------------------------------------------------------------- */

function Header() {
  return (
    <header className="mb-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
        Admin · Waitlist
      </div>
      <h1 className="mt-2 font-serif text-3xl text-text md:text-4xl">
        Waitlist signups
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Pre-launch — everyone here is waiting for early access.
      </p>
    </header>
  );
}

/* -------------------------------------------------------------------------- */

function StatsRow({ stats }: { stats: Stats | null }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard label="TOTAL SIGNUPS" value={stats?.total ?? 0} />
      <StatCard label="JOINED TODAY" value={stats?.today ?? 0} />
      <StatCard
        label="THIS WEEK"
        value={stats?.week ?? 0}
        sparkline={stats?.weekSparkline}
      />
      <StatCard
        label="TOP SOURCE"
        value={stats?.sourceBreakdown[0]?.source ?? "—"}
        numeric={false}
        subValue={
          stats?.sourceBreakdown[0]
            ? `${stats.sourceBreakdown[0].count} signups`
            : "no data"
        }
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  numeric = true,
  sparkline,
  subValue,
}: {
  label: string;
  value: number | string;
  numeric?: boolean;
  sparkline?: number[];
  subValue?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className="mt-3 font-mono text-3xl tabular-nums text-text">
        {numeric && typeof value === "number" ? (
          <CountUp end={value} duration={1.2} preserveValue separator="," />
        ) : (
          value
        )}
      </div>
      {sparkline && (
        <div className="mt-3 flex h-7 items-end gap-0.5">
          {sparkline.map((v, i) => {
            const max = Math.max(...sparkline, 1);
            return (
              <div
                key={i}
                className="flex-1 rounded-sm bg-gradient-to-t from-aurora-blue/30 to-aurora-purple/55"
                style={{ height: `${(v / max) * 100}%`, minHeight: "2px" }}
                title={`${v} on day ${i + 1}`}
              />
            );
          })}
        </div>
      )}
      {subValue && (
        <div className="mt-2 text-xs text-text-muted">{subValue}</div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ActionsBar({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <a
        href="/api/admin/waitlist/export"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-3 text-xs text-text hover:border-aurora-purple/45"
      >
        <Download className="h-3.5 w-3.5" />
        Export all to CSV
      </a>
      <a
        href="/api/admin/waitlist/export?confirmed=true"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-3 text-xs text-text hover:border-aurora-purple/45"
      >
        <Download className="h-3.5 w-3.5" />
        Export confirmed only
      </a>
      <button
        type="button"
        onClick={() =>
          toast("Batch email coming soon", {
            description: "We'll ship this with the wave-1 invite flow.",
          })
        }
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-3 text-xs text-text hover:border-aurora-purple/45"
      >
        <Megaphone className="h-3.5 w-3.5" />
        Send announcement email
      </button>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-3 text-xs text-text hover:border-aurora-purple/45 disabled:opacity-60"
      >
        <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        Refresh
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function FiltersBar({
  search,
  setSearch,
  sortBy,
  setSortBy,
  confirmedFilter,
  setConfirmedFilter,
  sourceFilter,
  setSourceFilter,
  sources,
}: {
  search: string;
  setSearch: (v: string) => void;
  sortBy: "newest" | "oldest" | "referrals";
  setSortBy: (v: "newest" | "oldest" | "referrals") => void;
  confirmedFilter: "all" | "true" | "false";
  setConfirmedFilter: (v: "all" | "true" | "false") => void;
  sourceFilter: string;
  setSourceFilter: (v: string) => void;
  sources: { source: string; count: number }[];
}) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto_auto]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          placeholder="Search by email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass h-10 w-full rounded-2xl border-0 pl-9 pr-3 text-sm text-text outline-none placeholder:text-text-dim focus:shadow-[0_0_0_2px_rgba(167,136,255,0.2)]"
        />
      </div>
      <select
        value={sourceFilter}
        onChange={(e) => setSourceFilter(e.target.value)}
        className="glass h-10 rounded-2xl border-0 px-3 text-sm text-text outline-none"
      >
        <option value="">All sources</option>
        {sources.map((s) => (
          <option key={s.source} value={s.source}>
            {s.source} ({s.count})
          </option>
        ))}
      </select>
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
        className="glass h-10 rounded-2xl border-0 px-3 text-sm text-text outline-none"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="referrals">Most referrals</option>
      </select>
      <select
        value={confirmedFilter}
        onChange={(e) =>
          setConfirmedFilter(e.target.value as typeof confirmedFilter)
        }
        className="glass h-10 rounded-2xl border-0 px-3 text-sm text-text outline-none"
      >
        <option value="all">All emails</option>
        <option value="true">Confirmed only</option>
        <option value="false">Unconfirmed</option>
      </select>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function RowsTable({
  rows,
  loading,
  onRowClick,
  onMutated,
}: {
  rows: Row[];
  loading: boolean;
  onRowClick: (row: Row) => void;
  onMutated: () => void;
}) {
  return (
    <div className="glass mt-6 overflow-hidden rounded-2xl">
      <div className="grid grid-cols-[60px_1fr_140px_120px_80px_60px_44px] gap-3 border-b border-border-soft px-5 py-3 text-[10px] font-mono uppercase tracking-wider text-text-muted">
        <div>#</div>
        <div>Email</div>
        <div>Joined</div>
        <div>Source</div>
        <div className="text-right">Refs</div>
        <div className="text-center">✓</div>
        <div></div>
      </div>
      {loading && rows.length === 0 && (
        <div className="py-12 text-center text-sm text-text-muted">Loading…</div>
      )}
      {!loading && rows.length === 0 && (
        <div className="py-12 text-center text-sm text-text-muted">
          No signups match these filters.
        </div>
      )}
      <ul>
        {rows.map((r) => (
          <li
            key={r.id}
            className="grid cursor-pointer grid-cols-[60px_1fr_140px_120px_80px_60px_44px] items-center gap-3 border-b border-border-soft px-5 py-3 text-sm transition-colors last:border-b-0 hover:bg-surface/50"
            onClick={() => onRowClick(r)}
          >
            <div className="font-mono tabular-nums text-text-muted">{r.position}</div>
            <div className="truncate text-text">{r.email}</div>
            <div className="text-xs text-text-muted" title={r.created_at}>
              {relativeTime(r.created_at)}
            </div>
            <div className="text-xs text-text-muted">{r.source ?? "organic"}</div>
            <div className="text-right">
              {r.referrals_count > 0 ? (
                <span className="inline-flex items-center justify-center rounded-full bg-aurora-purple/15 px-2 py-0.5 font-mono text-[10px] tabular-nums text-aurora-purple">
                  {r.referrals_count}
                </span>
              ) : (
                <span className="font-mono text-[10px] text-text-dim">—</span>
              )}
            </div>
            <div className="text-center">
              {r.email_confirmed ? (
                <Check className="mx-auto h-3.5 w-3.5 text-aurora-green" />
              ) : (
                <span className="mx-auto inline-block h-1.5 w-1.5 rounded-full bg-text-dim" />
              )}
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <RowMenu row={r} onMutated={onMutated} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function RowMenu({ row, onMutated }: { row: Row; onMutated: () => void }) {
  async function patch(action: string, extra?: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/admin/waitlist/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      onMutated();
      return true;
    } catch (e) {
      toast.error("Action failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
      return false;
    }
  }

  async function del() {
    if (!confirm(`Delete ${row.email} from the waitlist? This can't be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/waitlist/${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`${res.status}`);
      toast.success("Removed from waitlist");
      onMutated();
    } catch (e) {
      toast.error("Delete failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Row actions"
          className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-surface hover:text-text"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={async () => {
            const ok = await patch("confirm");
            if (ok) toast.success("Marked confirmed");
          }}
          className="text-xs"
        >
          <CheckCheck className="mr-2 h-3.5 w-3.5" />
          Mark confirmed
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            const ok = await patch("bump", { bumpBy: 10 });
            if (ok) toast.success("Bumped up 10 spots");
          }}
          className="text-xs"
        >
          <TrendingUp className="mr-2 h-3.5 w-3.5" />
          Bump up 10 spots
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            void navigator.clipboard.writeText(row.email);
            toast.success("Email copied");
          }}
          className="text-xs"
        >
          <Copy className="mr-2 h-3.5 w-3.5" />
          Copy email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={del}
          className="text-xs text-skip focus:text-skip"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -------------------------------------------------------------------------- */

function Pagination({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
      <div>
        Showing page <span className="font-mono tabular-nums text-text">{page}</span>{" "}
        of <span className="font-mono tabular-nums text-text">{totalPages}</span>{" "}
        · <span className="font-mono tabular-nums">{total}</span> total
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-border-soft bg-surface/70 px-3 text-xs text-text hover:border-aurora-purple/45 disabled:opacity-40"
        >
          <ChevronLeft className="h-3 w-3" />
          Prev
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-border-soft bg-surface/70 px-3 text-xs text-text hover:border-aurora-purple/45 disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function DetailSheet({
  row,
  onClose,
  onMutated,
}: {
  row: Row | null;
  onClose: () => void;
  onMutated: () => void;
}) {
  return (
    <Sheet open={Boolean(row)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full max-w-md sm:max-w-md">
        {row && <DetailContent row={row} onMutated={onMutated} />}
      </SheetContent>
    </Sheet>
  );
}

function DetailContent({ row, onMutated }: { row: Row; onMutated: () => void }) {
  const refUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${row.referral_code}`
      : "";
  return (
    <div className="space-y-4 pt-4">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Position
        </div>
        <div className="mt-1 font-serif text-4xl text-text">#{row.position}</div>
      </div>
      <Field label="Email" value={row.email} />
      <Field label="Joined" value={new Date(row.created_at).toLocaleString()} />
      <Field
        label="Email confirmed"
        value={
          row.email_confirmed
            ? `✓ ${row.email_confirmed_at ? new Date(row.email_confirmed_at).toLocaleString() : ""}`
            : "Not confirmed"
        }
      />
      <Field label="Source" value={row.source ?? "organic"} />
      <Field label="Referrals" value={String(row.referrals_count)} />
      <Field
        label="Referral link"
        value={refUrl}
        action={
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(refUrl);
              toast.success("Link copied");
            }}
            className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-surface hover:text-text"
          >
            <Copy className="h-3 w-3" />
          </button>
        }
      />
      <div className="pt-4">
        <button
          type="button"
          onClick={async () => {
            const res = await fetch(`/api/admin/waitlist/${row.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "confirm" }),
            });
            if (res.ok) {
              toast.success("Marked confirmed");
              onMutated();
            }
          }}
          disabled={row.email_confirmed}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-3 text-xs text-text hover:border-aurora-purple/45 disabled:opacity-50"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          {row.email_confirmed ? "Already confirmed" : "Mark confirmed"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="flex-1 break-all text-sm text-text">{value}</div>
        {action}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
