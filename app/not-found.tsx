import Link from "next/link";
import { ArrowRight, Home, Search } from "lucide-react";

/**
 * App-wide 404. Friendly, glass-styled, lands the user back on something
 * useful (dashboard if authed via middleware redirect, or the marketing
 * page otherwise).
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center px-6">
      <div className="glass relative w-full max-w-md rounded-3xl p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 left-1/2 -z-10 h-32 w-64 -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(167,136,255,0.25), transparent 70%)",
          }}
        />
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
          404 · Off the map
        </div>
        <h1 className="mt-3 font-serif text-3xl leading-tight text-text md:text-4xl">
          We couldn&apos;t find that page.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          The link may be stale or the page was moved. Try the dashboard, or
          search for what you were looking for.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(167,136,255,0.65)]"
            style={{
              background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
            }}
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/scan"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-4 text-sm text-text hover:border-aurora-purple/45"
          >
            <Search className="h-4 w-4" />
            Start a scan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
