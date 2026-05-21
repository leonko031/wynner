"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, RotateCw } from "lucide-react";

/**
 * Global error boundary — catches uncaught render errors anywhere in the app.
 *
 * Next 16 hands us `error` (with optional `digest`) + a `reset` function.
 * Calling reset() re-renders the segment. We also log to console so Sentry
 * (if configured) picks it up.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FCFCFD] text-[#1A1B3A] dark:bg-[#0A0B1F] dark:text-[#FAFAFA]">
        <main className="flex min-h-screen w-full items-center justify-center px-6">
          <div
            className="w-full max-w-md rounded-3xl border p-8 backdrop-blur-xl"
            style={{
              borderColor: "rgba(167,136,255,0.35)",
              backgroundColor: "rgba(255,255,255,0.6)",
              boxShadow:
                "0 30px 60px -20px rgba(91,141,255,0.35), inset 0 1px 0 0 rgba(255,255,255,0.7)",
            }}
          >
            <div
              aria-hidden
              className="mb-5 inline-flex h-2 w-2 rounded-full"
              style={{
                background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              }}
            />
            <h1 className="font-serif text-3xl leading-tight md:text-4xl">
              Something went sideways.
            </h1>
            <p className="mt-3 text-sm leading-relaxed opacity-70">
              An unexpected error broke this view. We&apos;ve logged it. Try the
              same action again, or head back to your dashboard.
            </p>
            {error.digest && (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider opacity-50">
                Error ref · {error.digest}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                  boxShadow: "0 10px 30px -10px rgba(167,136,255,0.65)",
                }}
              >
                <RotateCw className="h-4 w-4" />
                Try again
              </button>
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm"
                style={{ borderColor: "rgba(0,0,0,0.1)" }}
              >
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
