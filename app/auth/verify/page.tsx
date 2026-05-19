"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const RESEND_COOLDOWN = 60; // seconds

export default function VerifyPage() {
  const params = useSearchParams();
  const email = params.get("email") ?? "your inbox";
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  async function resend() {
    if (!email.includes("@") || cooldown > 0 || sending) return;
    if (!isSupabaseConfigured()) {
      toast.error("Supabase isn't connected yet.");
      return;
    }
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/onboarding")}`,
      },
    });
    setSending(false);
    if (error) {
      toast.error("Couldn't resend", { description: error.message });
      return;
    }
    setCooldown(RESEND_COOLDOWN);
    toast.success("Sent another one — give it a minute.");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong w-full max-w-md rounded-3xl p-8 text-center"
        style={{
          boxShadow:
            "0 0 0 1px rgba(167,136,255,0.30), 0 30px 60px -20px rgba(91,141,255,0.30)",
        }}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center">
          <motion.div
            className="relative flex h-16 w-16 items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-2xl"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(167,136,255,0.55), transparent 70%)",
                filter: "blur(16px)",
              }}
            />
            <span
              className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-aurora-purple/40"
              style={{
                background:
                  "linear-gradient(135deg, rgba(91,141,255,0.18), rgba(167,136,255,0.22), rgba(255,137,197,0.18))",
              }}
            >
              <Mail className="h-7 w-7 text-aurora-purple" />
            </span>
          </motion.div>
        </div>

        <h1 className="mt-6 text-3xl font-medium tracking-tight text-text md:text-4xl">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          We sent a confirmation link to <strong className="text-text">{email}</strong>
        </p>
        <p className="mt-5 text-sm leading-relaxed text-text-muted">
          Click the link in that email to verify your account. It usually arrives within a minute.
        </p>

        <div className="mt-7 flex flex-col gap-2.5">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full border-border-soft bg-surface/70"
            onClick={resend}
            disabled={cooldown > 0 || sending}
          >
            {sending
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend email"}
          </Button>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center gap-1.5 text-xs text-text-muted underline-offset-2 hover:text-text hover:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            Use a different email
          </Link>
        </div>

        <p className="mt-6 text-[11px] text-text-dim">
          Can&apos;t find it? Check your spam folder.
        </p>
      </motion.div>
    </main>
  );
}
