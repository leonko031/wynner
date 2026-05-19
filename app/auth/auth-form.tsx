"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { GoogleButton } from "@/components/auth/google-button";
import {
  PasswordStrength,
  evaluatePassword,
} from "@/components/auth/password-strength";
import { SetupBanner } from "@/components/auth/setup-banner";
import { SparkIcon } from "@/components/credits/spark-icon";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

const friendlyError = (raw: string): string => {
  const msg = raw.toLowerCase();
  if (msg.includes("invalid login")) return "Hmm, that doesn't match. Try again or reset?";
  if (msg.includes("already registered") || msg.includes("user already") || msg.includes("duplicate"))
    return "Looks like you already have an account. Want to sign in instead?";
  if (msg.includes("email not confirmed"))
    return "Almost there — check your email to confirm your account first.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Too many tries. Take a 60-second breather and try again.";
  if (msg.includes("network") || msg.includes("fetch"))
    return "Couldn't reach our servers. Mind trying that again?";
  return raw || "Something went wrong. Please try again.";
};

export function AuthForm({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const supabaseReady = isSupabaseConfigured();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [magicMode, setMagicMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthing, setOauthing] = useState(false);
  const [magicSending, setMagicSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const redirectTo = params.get("redirect") || "/dashboard";
  const resetSuccess = params.get("reset") === "success";

  // One-time success toast for "your password was reset, please sign in"
  useEffect(() => {
    if (!resetSuccess) return;
    const t = window.setTimeout(() => {
      toast.success("Password updated", { description: "Sign in with your new password." });
    }, 0);
    return () => window.clearTimeout(t);
  }, [resetSuccess]);

  // Surface ?error=oauth_failed from a failed callback
  useEffect(() => {
    const errParam = params.get("error");
    if (errParam !== "oauth_failed") return;
    const t = window.setTimeout(() => {
      toast.error("Sign-in cancelled", {
        description: "We couldn't complete that sign-in. Try again?",
      });
    }, 0);
    return () => window.clearTimeout(t);
  }, [params]);

  const supabase = useMemo(() => (supabaseReady ? createClient() : null), [supabaseReady]);

  const oauthRedirectUrl = useMemo(() => {
    if (typeof window === "undefined") return "/auth/callback";
    const u = new URL("/auth/callback", window.location.origin);
    if (redirectTo) u.searchParams.set("redirect", redirectTo);
    return u.toString();
  }, [redirectTo]);

  function flagError(message: string) {
    setError(message);
    setShake((s) => s + 1);
  }

  function clearError() {
    setError(null);
  }

  async function handleGoogle() {
    if (!supabase) {
      flagError("Connect Supabase first — see the banner above.");
      return;
    }
    setOauthing(true);
    clearError();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: oauthRedirectUrl },
    });
    if (err) {
      setOauthing(false);
      flagError(friendlyError(err.message));
    }
    // On success, Supabase navigates away — leave the spinner on.
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      flagError("Connect Supabase first — see the banner above.");
      return;
    }
    clearError();

    // Client-side validation
    if (mode === "signup") {
      if (!displayName.trim()) return flagError("Tell us your name so we can greet you properly.");
      if (evaluatePassword(password).score < 50) {
        return flagError("Pick a stronger password — at least 8 chars with a number.");
      }
      if (password !== confirm) return flagError("Passwords don't match yet.");
    }
    if (!email.includes("@")) return flagError("That doesn't look like an email address.");
    if (!password) return flagError("Add a password to continue.");

    setSubmitting(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        toast.success("Welcome back");
        router.replace(redirectTo);
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: displayName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/onboarding")}`,
          },
        });
        if (err) throw err;
        // If email confirmation is enabled, Supabase returns a user with no session.
        if (!data.session) {
          const verifyUrl = new URL("/auth/verify", window.location.origin);
          verifyUrl.searchParams.set("email", email);
          router.replace(verifyUrl.pathname + verifyUrl.search);
        } else {
          toast.success("Account created — let's get you set up");
          router.replace("/onboarding");
        }
      }
    } catch (err) {
      flagError(friendlyError(err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMagicLink() {
    if (!supabase) {
      flagError("Connect Supabase first — see the banner above.");
      return;
    }
    if (!email.includes("@")) return flagError("Add your email above first.");
    setMagicSending(true);
    clearError();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });
    setMagicSending(false);
    if (err) return flagError(friendlyError(err.message));
    toast.success("Magic link sent", { description: `Check ${email} for your sign-in link.` });
  }

  return (
    <motion.div
      ref={cardRef}
      key={`shake-${shake}`}
      initial={false}
      animate={shake ? { x: [-4, 4, -3, 3, -2, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong relative w-full max-w-md rounded-3xl p-6 md:p-8"
      style={{
        boxShadow:
          "0 0 0 1px rgba(167,136,255,0.30), 0 30px 60px -20px rgba(91,141,255,0.30), inset 0 1px 0 0 var(--surface-glass-highlight)",
      }}
    >
      {!supabaseReady && <SetupBanner />}

      {/* Tab toggle */}
      <div className="relative mb-7 flex rounded-full border border-border-soft bg-surface/60 p-1">
        {(["signin", "signup"] as const).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                clearError();
                setMagicMode(false);
              }}
              className="relative z-10 flex-1 rounded-full px-3 py-1.5 text-sm transition-colors"
            >
              {active && (
                <motion.span
                  layoutId="auth-tab-indicator"
                  className="absolute inset-0 -z-10 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(91,141,255,0.18), rgba(167,136,255,0.22), rgba(255,137,197,0.18))",
                    boxShadow:
                      "0 0 0 1px rgba(167,136,255,0.45), inset 0 1px 0 0 rgba(255,255,255,0.45)",
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className={cn(active ? "text-text" : "text-text-muted")}>
                {m === "signin" ? "Sign in" : "Create account"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Headline */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <h1 className="text-3xl font-medium tracking-tight text-text md:text-4xl">
            {mode === "signin" ? "Welcome back" : "Let's get you started"}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {mode === "signin"
              ? "Sign in to your dashboard"
              : "Free forever, no card required"}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Google button */}
      <GoogleButton
        onClick={handleGoogle}
        loading={oauthing}
        disabled={submitting}
      />

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(167,136,255,0.35), transparent)" }} />
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          or continue with email
        </span>
        <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(167,136,255,0.35), transparent)" }} />
      </div>

      {/* Form */}
      <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
        <AnimatePresence initial={false}>
          {mode === "signup" && (
            <motion.div
              key="signup-name"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <Field
                id="display-name"
                label="Your name"
                icon={<UserIcon className="h-4 w-4" />}
                inputProps={{
                  type: "text",
                  autoComplete: "name",
                  value: displayName,
                  onChange: (e) => setDisplayName(e.target.value),
                  placeholder: "Alex",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Field
          id="email"
          label="Email"
          icon={<Mail className="h-4 w-4" />}
          inputProps={{
            type: "email",
            autoComplete: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            placeholder: "you@example.com",
            required: true,
          }}
        />

        <AnimatePresence initial={false}>
          {!magicMode && (
            <motion.div
              key="password-block"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden space-y-4"
            >
              <Field
                id="password"
                label="Password"
                icon={<Lock className="h-4 w-4" />}
                inputProps={{
                  type: showPw ? "text" : "password",
                  autoComplete: mode === "signup" ? "new-password" : "current-password",
                  value: password,
                  onChange: (e) => setPassword(e.target.value),
                  placeholder: mode === "signup" ? "Make it strong" : "Your password",
                  required: true,
                }}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="text-text-dim hover:text-text"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              >
                {mode === "signup" && <PasswordStrength password={password} />}
              </Field>

              {mode === "signup" && (
                <Field
                  id="password-confirm"
                  label="Confirm password"
                  icon={<Lock className="h-4 w-4" />}
                  inputProps={{
                    type: showPw ? "text" : "password",
                    autoComplete: "new-password",
                    value: confirm,
                    onChange: (e) => setConfirm(e.target.value),
                    placeholder: "Same as above",
                    required: true,
                  }}
                  suffix={
                    confirm && confirm === password ? (
                      <Check className="h-4 w-4 text-go" />
                    ) : undefined
                  }
                />
              )}

              {mode === "signin" && (
                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-2 text-text-muted">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-border-strong bg-surface text-aurora-blue focus:ring-aurora-blue"
                    />
                    Remember me
                  </label>
                  <Link
                    href="/auth/reset"
                    className="text-text-muted underline-offset-2 hover:text-text hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="rounded-xl border border-aurora-peach/40 bg-aurora-peach/10 px-3 py-2 text-xs text-aurora-peach"
              role="alert"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type={magicMode ? "button" : "submit"}
          onClick={magicMode ? handleMagicLink : undefined}
          disabled={submitting || magicSending}
          className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-medium text-white shadow-[0_12px_32px_-8px_rgba(91,141,255,0.55)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-80"
          style={{
            background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
          }}
        >
          {submitting || magicSending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {magicMode
                ? "Send magic link"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </>
          )}
        </button>

        {mode === "signup" && (
          <p className="text-center text-[11px] leading-snug text-text-dim">
            By signing up you agree to our{" "}
            <Link href="/terms" className="underline-offset-2 hover:underline">Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline-offset-2 hover:underline">Privacy</Link>.
          </p>
        )}
      </form>

      {/* Magic link toggle (sign-in only) */}
      {mode === "signin" && (
        <div className="mt-4 text-center text-xs text-text-muted">
          {magicMode ? (
            <button
              type="button"
              onClick={() => setMagicMode(false)}
              className="underline-offset-2 hover:text-text hover:underline"
            >
              Use password instead
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMagicMode(true);
                clearError();
              }}
              className="inline-flex items-center gap-1 underline-offset-2 hover:text-text hover:underline"
            >
              <SparkIcon size={10} />
              Or send me a magic link instead
            </button>
          )}
        </div>
      )}

      {/* Switch mode line */}
      <div className="mt-6 border-t border-border-soft/60 pt-5 text-center text-xs text-text-muted">
        {mode === "signin" ? (
          <>
            New to Wynner?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                clearError();
              }}
              className="font-medium text-text underline-offset-2 hover:underline"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                clearError();
              }}
              className="font-medium text-text underline-offset-2 hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Field — glass input with icon + label + optional suffix + children          */
/* -------------------------------------------------------------------------- */

function Field({
  id,
  label,
  icon,
  inputProps,
  suffix,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  suffix?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-text-dim"
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim">
          {icon}
        </span>
        <input
          id={id}
          className={cn(
            "h-12 w-full rounded-xl border border-border-soft bg-surface/70 pl-10 pr-10 text-sm text-text backdrop-blur transition-all",
            "placeholder:text-text-dim/70",
            "focus:border-aurora-blue/55 focus:bg-surface/90 focus:outline-none focus:ring-2 focus:ring-aurora-blue/35",
          )}
          {...inputProps}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</span>
        )}
      </div>
      {children}
    </div>
  );
}
