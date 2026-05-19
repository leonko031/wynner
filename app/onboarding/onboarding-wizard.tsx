"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import * as LIcons from "lucide-react";
import { Check, ChevronLeft, Sparkles, Sprout, TrendingUp, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { COUNTRIES } from "@/lib/data/countries";
import { NICHES } from "@/lib/data/niches";
import { useUser } from "@/lib/auth/use-user";
import type { ExperienceLevel } from "@/types/profile";
import type { Niche } from "@/types";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

type State = {
  country: string | null;
  niches: Niche[];
  experience: ExperienceLevel | null;
};

const STEPS: { id: Step; title: string }[] = [
  { id: 1, title: "Country" },
  { id: 2, title: "Niches" },
  { id: 3, title: "Experience" },
];

const EXPERIENCE_CARDS: {
  value: ExperienceLevel;
  title: string;
  blurb: string;
  icon: React.ElementType;
  accent: string;
}[] = [
  { value: "beginner", title: "Just starting", blurb: "0–3 months", icon: Sprout, accent: "#88E5C8" },
  { value: "intermediate", title: "Getting serious", blurb: "3–12 months", icon: TrendingUp, accent: "#A788FF" },
  { value: "advanced", title: "Battle-tested", blurb: "1+ years", icon: Trophy, accent: "#FF89C5" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const { user, refreshProfile } = useUser();
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<State>({
    country: null,
    niches: [],
    experience: null,
  });
  const [submitting, setSubmitting] = useState(false);

  function toggleNiche(n: Niche) {
    setState((s) => {
      if (s.niches.includes(n)) return { ...s, niches: s.niches.filter((x) => x !== n) };
      if (s.niches.length >= 3) {
        toast("Pick up to 3 — you can change this anytime");
        return s;
      }
      return { ...s, niches: [...s.niches, n] };
    });
  }

  async function persist(opts: { complete: boolean }) {
    if (!isSupabaseConfigured() || !user) {
      // Demo / no-auth — just bounce to dashboard.
      router.replace("/dashboard");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        preferred_country: state.country,
        preferred_niches: state.niches.length ? state.niches : null,
        experience_level: state.experience,
        onboarding_completed: opts.complete,
      })
      .eq("id", user.id);
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't save preferences", { description: error.message });
      return;
    }
    await refreshProfile();
    if (opts.complete) {
      toast.success("Welcome to Wynner ✨", { description: "Your dashboard is ready." });
    }
    router.replace("/dashboard");
  }

  const canContinue =
    (step === 1 && !!state.country) ||
    (step === 2 && state.niches.length > 0) ||
    (step === 3 && !!state.experience);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-3xl">
        {/* Progress dots */}
        <div className="mb-6 flex items-center justify-center gap-3">
          {STEPS.map((s, i) => {
            const status: "done" | "current" | "future" =
              step > s.id ? "done" : step === s.id ? "current" : "future";
            return (
              <div key={s.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <motion.span
                    className={cn(
                      "flex h-2.5 w-2.5 items-center justify-center rounded-full",
                      status === "done" &&
                        "bg-go shadow-[0_0_10px_rgba(61,214,140,0.7)]",
                      status === "current" &&
                        "bg-aurora-purple shadow-[0_0_10px_rgba(167,136,255,0.7)]",
                      status === "future" && "bg-border-strong",
                    )}
                    animate={
                      status === "current" ? { scale: [1, 1.25, 1] } : { scale: 1 }
                    }
                    transition={{
                      duration: 1.6,
                      repeat: status === "current" ? Infinity : 0,
                    }}
                  />
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-wider",
                      status === "current"
                        ? "text-text"
                        : status === "done"
                          ? "text-go"
                          : "text-text-dim",
                    )}
                  >
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="h-px w-12 bg-border-soft" aria-hidden />
                )}
              </div>
            );
          })}
        </div>

        <motion.div
          layout
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong relative rounded-3xl p-6 md:p-10"
          style={{
            boxShadow:
              "0 0 0 1px rgba(167,136,255,0.30), 0 30px 60px -20px rgba(91,141,255,0.30)",
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <header className="text-center">
                  <h1 className="text-3xl font-medium tracking-tight text-text md:text-4xl">
                    Where do you sell?
                  </h1>
                  <p className="mt-2 text-sm text-text-muted">
                    We&apos;ll tailor your scoring to this market.
                  </p>
                </header>
                <div className="mt-7 grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
                  {Object.values(COUNTRIES).map((c) => {
                    const active = state.country === c.code;
                    return (
                      <motion.button
                        key={c.code}
                        type="button"
                        whileHover={{ y: -2 }}
                        onClick={() => setState((s) => ({ ...s, country: c.code }))}
                        className={cn(
                          "glass relative flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all",
                          active && "ring-2 ring-aurora-purple/60",
                        )}
                        style={
                          active
                            ? {
                                boxShadow:
                                  "0 0 0 1px rgba(167,136,255,0.45), 0 14px 28px -10px rgba(167,136,255,0.55)",
                              }
                            : undefined
                        }
                      >
                        <span className="text-2xl" aria-hidden>{c.flag}</span>
                        <span className="text-xs font-medium text-text">{c.code}</span>
                        <span className="text-[9px] text-text-muted">{c.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <header className="text-center">
                  <h1 className="text-3xl font-medium tracking-tight text-text md:text-4xl">
                    What do you love selling?
                  </h1>
                  <p className="mt-2 text-sm text-text-muted">
                    Pick your favorite niche{state.niches.length > 0 ? `s (${state.niches.length}/3)` : "s"} — you can change anytime.
                  </p>
                </header>
                <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                  {Object.values(NICHES).map((n) => {
                    const active = state.niches.includes(n.niche);
                    const Icon =
                      (LIcons[n.icon as keyof typeof LIcons] as React.ElementType | undefined) ??
                      LIcons.Box;
                    return (
                      <motion.button
                        key={n.niche}
                        type="button"
                        whileHover={{ y: -3 }}
                        onClick={() => toggleNiche(n.niche)}
                        className={cn(
                          "glass relative flex flex-col items-start gap-2 rounded-2xl p-3.5 text-left transition-all",
                          active && "ring-2",
                        )}
                        style={
                          active
                            ? {
                                boxShadow: `0 0 0 1px ${n.color}55, 0 14px 30px -10px ${n.color}55`,
                              }
                            : undefined
                        }
                      >
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: `${n.color}1A`,
                            color: n.color,
                            border: `1px solid ${n.color}33`,
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="flex items-baseline justify-between w-full">
                          <span className="text-sm font-medium text-text">{n.label}</span>
                          <span className="font-mono text-[10px] text-text-dim">heat {n.heat}</span>
                        </div>
                        {active && (
                          <Check
                            className="absolute right-2.5 top-2.5 h-3.5 w-3.5"
                            style={{ color: n.color }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <header className="text-center">
                  <h1 className="text-3xl font-medium tracking-tight text-text md:text-4xl">
                    How experienced are you?
                  </h1>
                  <p className="mt-2 text-sm text-text-muted">
                    We&apos;ll customize what we show you.
                  </p>
                </header>
                <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {EXPERIENCE_CARDS.map((c) => {
                    const active = state.experience === c.value;
                    const Icon = c.icon;
                    return (
                      <motion.button
                        key={c.value}
                        type="button"
                        whileHover={{ y: -4 }}
                        onClick={() => setState((s) => ({ ...s, experience: c.value }))}
                        className={cn(
                          "glass flex flex-col items-start gap-3 rounded-3xl p-5 text-left transition-all",
                        )}
                        style={
                          active
                            ? {
                                boxShadow: `0 0 0 1px ${c.accent}55, 0 16px 40px -12px ${c.accent}55`,
                              }
                            : undefined
                        }
                      >
                        <span
                          className="flex h-11 w-11 items-center justify-center rounded-2xl"
                          style={{
                            backgroundColor: `${c.accent}1A`,
                            color: c.accent,
                            border: `1px solid ${c.accent}33`,
                          }}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="text-lg font-medium text-text">{c.title}</div>
                          <div className="text-xs text-text-muted">{c.blurb}</div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer: back / continue / skip */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((step - 1) as Step)}
              disabled={step === 1}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-text-muted hover:text-text disabled:opacity-40"
            >
              <ChevronLeft className="h-3 w-3" />
              Back
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => persist({ complete: true })}
                className="text-xs text-text-dim underline-offset-2 hover:text-text hover:underline"
              >
                Skip onboarding
              </button>
              <Button
                size="lg"
                disabled={!canContinue || submitting}
                onClick={() => {
                  if (step < 3) setStep((step + 1) as Step);
                  else persist({ complete: true });
                }}
                className="rounded-full"
              >
                {step === 3 ? (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Finish setup
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
