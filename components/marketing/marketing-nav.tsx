"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";

/**
 * Marketing top nav. NOT sticky — scrolls away with the page. Distinct
 * from the authed app's TopNav both visually and structurally.
 *
 * The center links use plain anchors (smooth scroll to #features etc.).
 * The CTAs route into the auth flow.
 */
export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sheet on Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <header className="relative z-30 w-full">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span aria-hidden className="relative inline-flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-pulse-glow rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              }}
            />
            <span
              className="relative inline-flex h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(167,136,255,0.85)]"
              style={{
                background:
                  "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              }}
            />
          </span>
          <span className="font-serif text-xl tracking-tight text-text">
            Wynner
          </span>
        </Link>

        {/* Center links — desktop */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 text-sm text-text-muted md:flex"
        >
          <a href="#features" className="transition-colors hover:text-text">
            Features
          </a>
          <Link href="/pricing" className="transition-colors hover:text-text">
            Pricing
          </Link>
          <a href="#testimonials" className="transition-colors hover:text-text">
            Customers
          </a>
          <a href="#faq" className="transition-colors hover:text-text">
            FAQ
          </a>
        </nav>

        {/* Right CTAs — desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/auth?mode=signin"
            className="rounded-full px-3 py-1.5 text-sm text-text-muted transition-colors hover:text-text"
          >
            Sign in
          </Link>
          <Link
            href="/auth?mode=signup"
            className="group inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-medium text-white transition-all hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              boxShadow: "0 10px 30px -10px rgba(167,136,255,0.6)",
            }}
          >
            Get started free
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-soft bg-surface/70 text-text md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[#0A0B1F]/85 backdrop-blur-xl md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-4 top-4 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-serif text-lg text-white">Wynner</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="space-y-1">
                {[
                  { href: "#features", label: "Features" },
                  { href: "/pricing", label: "Pricing" },
                  { href: "#testimonials", label: "Customers" },
                  { href: "#faq", label: "FAQ" },
                ].map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-3 py-3 text-base text-white hover:bg-white/10"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
              <div className="mt-6 space-y-2">
                <Link
                  href="/auth?mode=signin"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-full border border-white/20 px-4 py-3 text-center text-sm text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth?mode=signup"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-full px-4 py-3 text-center text-sm font-medium text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
                  }}
                >
                  Get started free
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
