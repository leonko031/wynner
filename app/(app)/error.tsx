"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, RotateCw } from "lucide-react";

/**
 * Route-level error boundary for everything under `/(app)`. Catches errors
 * inside the authed shell so a crash on /insights doesn't blow up /scan.
 *
 * The top nav + footer (rendered in the (app) layout) keep working — only
 * the failing page swaps in for this view.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-24">
      <div className="glass relative w-full max-w-lg rounded-3xl p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 left-1/2 -z-10 h-32 w-64 -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,176,136,0.3), transparent 70%)",
          }}
        />
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
          Something broke on this page
        </div>
        <h1 className="mt-3 font-serif text-3xl leading-tight text-text md:text-4xl">
          We couldn&apos;t finish loading this view.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          Try again — most issues here resolve on a second attempt. If it keeps
          happening, head to your dashboard and we&apos;ll route it back to
          health.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Error ref · {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(167,136,255,0.65)]"
            style={{
              background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
            }}
          >
            <RotateCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border-soft bg-surface/70 px-4 text-sm text-text hover:border-aurora-purple/45"
          >
            Back to dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
