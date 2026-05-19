import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "./auth-form";
import { ShowcasePanel } from "./showcase-panel";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/**
 * /auth — split-screen sign-in / sign-up.
 *
 * LEFT (always visible) — the glass form card
 * RIGHT (≥1024px)         — the living showcase panel
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
      <section className="relative flex w-full flex-1 flex-col items-center justify-center px-5 py-12 lg:w-[60%] lg:px-12">
        {/* Wordmark — links back home */}
        <header className="absolute left-6 top-6">
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
        </header>

        <Suspense fallback={<div className="glass-strong h-[560px] w-full max-w-md rounded-3xl" />}>
          <AuthForm initialMode={initialMode} />
        </Suspense>
      </section>

      {/* RIGHT — showcase (desktop only) */}
      <aside className="relative hidden w-[40%] overflow-hidden lg:block">
        <ShowcasePanel />
      </aside>
    </main>
  );
}
