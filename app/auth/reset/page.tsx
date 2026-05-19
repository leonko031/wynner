"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { SetupBanner } from "@/components/auth/setup-banner";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Connect Supabase first — see the banner above.");
      return;
    }
    if (!email.includes("@")) {
      setError("That doesn't look like an email address.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset/confirm`,
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
    toast.success("Reset link sent");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong w-full max-w-md rounded-3xl p-8"
        style={{
          boxShadow:
            "0 0 0 1px rgba(167,136,255,0.30), 0 30px 60px -20px rgba(91,141,255,0.30)",
        }}
      >
        {!isSupabaseConfigured() && <SetupBanner />}

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-aurora-purple/40"
                   style={{ background: "linear-gradient(135deg, rgba(91,141,255,0.18), rgba(167,136,255,0.22))" }}>
                <Mail className="h-6 w-6 text-aurora-purple" />
              </div>
              <h1 className="text-2xl font-medium tracking-tight text-text">
                ✨ Check your email
              </h1>
              <p className="mt-2 text-sm text-text-muted">
                We sent a reset link to <strong className="text-text">{email}</strong>. Click it
                to set a new password.
              </p>
              <Link
                href="/auth"
                className="mt-6 inline-flex items-center gap-1.5 text-xs text-text-muted underline-offset-2 hover:text-text hover:underline"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to sign in
              </Link>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <h1 className="text-3xl font-medium tracking-tight text-text">
                  Reset your password
                </h1>
                <p className="mt-2 text-sm text-text-muted">
                  Enter the email tied to your account and we&apos;ll send you a link.
                </p>
              </div>

              <div>
                <label
                  htmlFor="reset-email"
                  className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-text-dim"
                >
                  Email
                </label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                  placeholder="you@example.com"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-aurora-peach/40 bg-aurora-peach/10 px-3 py-2 text-xs text-aurora-peach">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-white shadow-[0_12px_32px_-8px_rgba(91,141,255,0.55)] hover:brightness-110 disabled:opacity-80"
                style={{ background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)" }}
              >
                {submitting ? "Sending…" : "Send reset link"}
              </button>

              <div className="border-t border-border-soft/60 pt-4 text-center">
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-1.5 text-xs text-text-muted underline-offset-2 hover:text-text hover:underline"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to sign in
                </Link>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
