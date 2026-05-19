import { Activity, BarChart3, Crown, Database, Shield, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";
import { PLANS } from "@/lib/credits/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /admin — placeholder admin landing.
 *
 * Stats are fetched via the service-role client so we can read across all
 * profiles (regular client + RLS would only return the admin's own row plus
 * what the "admins can view all" policy allows).
 *
 * Every data read MUST be gated by requireAdmin() so accidental import in
 * a non-admin context can't leak.
 */
export default async function AdminPage() {
  await requireAdmin();
  const stats = await loadStats();

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      {/* Header */}
      <header
        className="glass-strong relative overflow-hidden rounded-3xl p-6 md:p-8"
        style={{
          boxShadow:
            "0 0 0 1px rgba(167,136,255,0.30), 0 30px 60px -20px rgba(91,141,255,0.30)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-aurora-purple" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                Admin
              </span>
            </div>
            <h1 className="mt-1 text-3xl font-medium tracking-tight md:text-4xl">
              Admin panel
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-text-muted">
              You&apos;re seeing this because you&apos;re listed in{" "}
              <code className="font-mono text-[12px]">ADMIN_EMAILS</code>.
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white"
            style={{
              background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              boxShadow: "0 8px 24px -6px rgba(167,136,255,0.55)",
            }}
          >
            <Crown className="h-3 w-3" />
            Admin
          </span>
        </div>
      </header>

      {/* Stats grid */}
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          accent="#5B8DFF"
          label="Total users"
          value={fmt(stats.totalUsers)}
          sub={stats.adminCount > 0 ? `${stats.adminCount} admin` : "0 admins"}
        />
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          accent="#A788FF"
          label="Active (7d)"
          value={fmt(stats.activeLast7d)}
          sub={
            stats.totalUsers > 0
              ? `${Math.round((stats.activeLast7d / stats.totalUsers) * 100)}% of users`
              : "—"
          }
        />
        <StatCard
          icon={<Database className="h-4 w-4" />}
          accent="#FF89C5"
          label="Total scans"
          value={fmt(stats.totalScans)}
          sub={
            stats.scansSource === "transactions"
              ? "from credit ledger"
              : "no data yet"
          }
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          accent="#3DD68C"
          label="MRR estimate"
          value={`€${fmt(stats.mrrEstimate)}`}
          sub={`${fmt(stats.proCount)} Pro · ${fmt(stats.operatorCount)} Operator`}
        />
      </section>

      {/* Future sections */}
      <section className="mt-10">
        <h2 className="text-xl font-medium tracking-tight md:text-2xl">Coming soon</h2>
        <p className="mt-1 text-sm text-text-muted">
          More admin tooling lands here as you need it.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {FUTURE.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="glass relative overflow-hidden rounded-2xl p-5 opacity-60"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${c.accent}1A`,
                    color: c.accent,
                    border: `1px solid ${c.accent}33`,
                  }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="mt-3 text-base font-medium tracking-tight text-text">
                  {c.title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  {c.blurb}
                </p>
                <span className="absolute right-3 top-3 inline-flex items-center rounded-full border border-border-soft bg-surface/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-dim">
                  Coming soon
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Methodology */}
      <p className="mt-10 text-[11px] text-text-dim">
        Stats fetched via the service-role client at request time.{" "}
        {stats.warning && (
          <span className="text-aurora-peach">⚠ {stats.warning}</span>
        )}
      </p>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Data loading                                                                */
/* -------------------------------------------------------------------------- */

type Stats = {
  totalUsers: number;
  activeLast7d: number;
  totalScans: number;
  scansSource: "transactions" | "none";
  proCount: number;
  operatorCount: number;
  adminCount: number;
  mrrEstimate: number;
  warning: string | null;
};

async function loadStats(): Promise<Stats> {
  const empty: Stats = {
    totalUsers: 0,
    activeLast7d: 0,
    totalScans: 0,
    scansSource: "none",
    proCount: 0,
    operatorCount: 0,
    adminCount: 0,
    mrrEstimate: 0,
    warning: null,
  };

  if (!isSupabaseAdminConfigured()) {
    return {
      ...empty,
      warning: "SUPABASE_SECRET_KEY is missing — stats unavailable.",
    };
  }

  const supabase = createSupabaseAdminClient();

  // Use `head: true` + `count: 'exact'` for cheap COUNTs (no row data).
  const [
    totalUsersR,
    proCountR,
    operatorCountR,
    adminCountR,
    activeR,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "pro"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "operator"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_admin", true),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("last_scan_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const totalUsers = totalUsersR.count ?? 0;
  const proCount = proCountR.count ?? 0;
  const operatorCount = operatorCountR.count ?? 0;
  const adminCount = adminCountR.count ?? 0;
  const activeLast7d = activeR.count ?? 0;

  const mrrEstimate =
    proCount * PLANS.pro.priceMonthly + operatorCount * PLANS.operator.priceMonthly;

  return {
    totalUsers,
    activeLast7d,
    totalScans: 0, // no scans table yet — placeholder
    scansSource: "none",
    proCount,
    operatorCount,
    adminCount,
    mrrEstimate,
    warning: null,
  };
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/* -------------------------------------------------------------------------- */
/* Placeholder cards for future sections                                       */
/* -------------------------------------------------------------------------- */

const FUTURE = [
  { title: "Users", blurb: "Search, view, and impersonate any user.", icon: Users, accent: "#5B8DFF" },
  { title: "Scans", blurb: "Browse every scan + its raw output.", icon: Database, accent: "#A788FF" },
  { title: "Revenue", blurb: "Daily revenue + cohort retention charts.", icon: BarChart3, accent: "#FF89C5" },
  { title: "System logs", blurb: "API errors, slow queries, refunds.", icon: Activity, accent: "#3DD68C" },
];

/* -------------------------------------------------------------------------- */
/* Stat card                                                                    */
/* -------------------------------------------------------------------------- */

function StatCard({
  icon,
  accent,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  accent: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className="glass relative overflow-hidden rounded-2xl p-5"
      style={{
        boxShadow: `inset 0 1px 0 0 var(--surface-glass-highlight), 0 12px 28px -12px ${accent}45`,
      }}
    >
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
        style={{
          backgroundColor: `${accent}1A`,
          color: accent,
          border: `1px solid ${accent}33`,
        }}
      >
        {icon}
      </span>
      <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-text-dim">
        {label}
      </div>
      <div className="mt-1 text-2xl font-medium tabular-nums tracking-tight text-text">
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-text-muted">{sub}</div>}
    </div>
  );
}
