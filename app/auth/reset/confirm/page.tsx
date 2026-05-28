"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  PasswordStrength,
  evaluatePassword,
} from "@/components/auth/password-strength";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { SetupBanner } from "@/components/auth/setup-banner";

/**
 * Reached via the link in the password-reset email. Supabase has already
 * given the visitor a temporary recovery session, so updateUser() works.
 *
 * On success we sign them out (so they re-enter their new password
 * deliberately) and bounce to /auth?reset=success.
 */
export default function ResetConfirmPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Connect Supabase first — see the banner above.");
      return;
    }
    if (evaluatePassword(pw).score < 50) {
      setError("Pick a stronger password — at least 8 chars with a number.");
      return;
    }
    if (pw !== confirm) {
      setError("Passwords don't match yet.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: pw });
    if (err) {
      setSubmitting(false);
      setError(err.message);
      return;
    }
    await supabase.auth.signOut();
    toast.success("Password updated");
    router.replace("/auth?reset=success");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-3xl border border-border-soft bg-surface-elevated/90 p-7 backdrop-blur-2xl md:p-9"
        style={{
          boxShadow: "0 24px 60px -24px rgba(0,0,0,0.45)",
        }}
      >
        {!isSupabaseConfigured() && <SetupBanner />}

        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
          New password
        </div>
        <h1 className="mt-3 font-serif text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-text md:text-5xl">
          Set a new password
        </h1>
        <p className="mt-3 text-sm text-text-muted md:text-base">
          Pick something you&apos;ll remember — but make it strong.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <PwField
            id="new-pw"
            label="New password"
            value={pw}
            onChange={setPw}
            show={showPw}
            onToggleShow={() => setShowPw((s) => !s)}
          >
            <PasswordStrength password={pw} />
          </PwField>

          <PwField
            id="confirm-pw"
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            show={showPw}
            onToggleShow={() => setShowPw((s) => !s)}
          />

          {error && (
            <div className="rounded-xl border border-aurora-peach/40 bg-aurora-peach/10 px-3 py-2 text-xs text-aurora-peach">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-white shadow-[0_10px_28px_-10px_rgba(167,136,255,0.50)] hover:brightness-110 disabled:opacity-80"
            style={{ background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)" }}
          >
            {submitting ? "Updating…" : "Update password"}
          </button>
        </form>
      </motion.div>
    </main>
  );
}

function PwField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim">
          <Lock className="h-4 w-4" />
        </span>
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full rounded-xl border border-border-soft bg-surface/70 pl-10 pr-10 text-sm text-text backdrop-blur focus:border-aurora-blue/55 focus:outline-none focus:ring-2 focus:ring-aurora-blue/35"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Hide" : "Show"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {children}
    </div>
  );
}
