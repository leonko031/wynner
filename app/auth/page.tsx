import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "./auth-form";
import { ShowcasePanel } from "./showcase-panel";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/**
 * /auth — split-screen sign-in / sign-up.
 *
 * LEFT (always visible) — the form card (refined chrome, bigger headlines)
 * RIGHT (≥1024px)         — the showcase panel (sample verdict + benefits)
 *
 * Server component so the initial `mode` (from ?mode= query param) renders
 * SSR — keeps the headline correct before hydration.
 */
export default async function AuthPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const initialMode = params.mode === "signup" ? "signup" : "signin";

  return (
    <main className="relative flex min-h-screen w-full flex-col lg:flex-row">
      {/* LEFT — form panel */}
      <section className="relative flex w-full flex-1 flex-col items-center justify-center px-5 py-12 lg:w-[58%] lg:px-12">
        {/* Top chrome — wordmark left, back link right. Sticky to corners
            so the form stays visually centered in the panel. */}
        <header className="absolute inset-x-6 top-6 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2.5">
            <span
              aria-hidden
              className="relative flex h-2 w-2 items-center justify-center"
            >
              <span
                className="absolute inline-flex h-full w-full animate-pulse-glow rounded-full"
                style={{ background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)" }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(167,136,255,0.85)]"
                style={{ background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)" }}
              />
            </span>
            <span className="font-medium tracking-tight text-text">Wynner</span>
          </Link>
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 rounded-full border border-border-soft/0 px-2 py-1 text-xs text-text-muted transition-colors hover:border-border-soft hover:text-text"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
            <span>Back</span>
          </Link>
        </header>

        <Suspense
          fallback={
            <div className="h-[560px] w-full max-w-md rounded-3xl border border-border-soft bg-surface-elevated/60" />
          }
        >
          <AuthForm initialMode={initialMode} />
        </Suspense>
      </section>

      {/* RIGHT — showcase (desktop only) */}
      <aside className="relative hidden w-[42%] overflow-hidden lg:block">
        <ShowcasePanel />
      </aside>
    </main>
  );
}
