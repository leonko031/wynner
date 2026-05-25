"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  FileText,
  Globe2,
  Loader2,
  Search,
  Share2,
  Sparkles,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import CountUp from "react-countup";
import { WaitlistOrb } from "./waitlist-orb";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────── */
/* Tunable constants                                                         */
/* ──────────────────────────────────────────────────────────────────────── */

const TAGLINES = [
  "An unfair advantage, quietly arriving.",
  "Intelligence, before instinct.",
  "Stop guessing what to launch.",
  "Real research. Real angles. Real verdicts.",
];
const TAGLINE_INTERVAL_MS = 4000;
const COUNT_POLL_MS = 30_000;
const RECENT_POLL_MS = 45_000;
const RECENT_ROTATE_MS = 4500;

/**
 * Public-facing counter math. Real signups + a configurable baseline + a
 * configurable daily drift. Lets the operator anchor the count somewhere
 * that doesn't read as "1 person signed up so far" in the first weeks of a
 * launch, without flat-out fabricating data.
 *
 * Set in Vercel:
 *   NEXT_PUBLIC_WAITLIST_BASELINE       default 0
 *   NEXT_PUBLIC_WAITLIST_DAILY_DRIFT    default 0 (extra signups per day)
 *   NEXT_PUBLIC_WAITLIST_LAUNCH_DATE    YYYY-MM-DD; required for drift
 *
 * Admin dashboard always shows real numbers — only the public page applies
 * these adjustments. Position math: displayed = real + baseline. Count
 * math: displayed = real + baseline + (days-since-launch × drift).
 */
const BASELINE = Number(process.env.NEXT_PUBLIC_WAITLIST_BASELINE ?? "0") || 0;
const DAILY_DRIFT =
  Number(process.env.NEXT_PUBLIC_WAITLIST_DAILY_DRIFT ?? "0") || 0;
const LAUNCH_DATE = process.env.NEXT_PUBLIC_WAITLIST_LAUNCH_DATE ?? null;

function displayedCount(realCount: number): number {
  let drift = 0;
  if (DAILY_DRIFT > 0 && LAUNCH_DATE) {
    const launch = new Date(`${LAUNCH_DATE}T00:00:00Z`).getTime();
    const days = Math.max(0, Math.floor((Date.now() - launch) / 86_400_000));
    drift = days * DAILY_DRIFT;
  }
  return realCount + BASELINE + drift;
}
function displayedPosition(realPosition: number): number {
  return realPosition + BASELINE;
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Top-level page                                                            */
/* ──────────────────────────────────────────────────────────────────────── */

type FormState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; position: number; referralCode: string; alreadyOnList: boolean }
  | { kind: "error"; message: string };

type RecentRow = { email: string; source: string; createdAt: string };

export function WaitlistPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <WaitlistBackground />
      <main className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-between gap-10 px-5 pb-10 pt-8 sm:gap-12 sm:px-6 sm:pt-10 md:gap-14 md:pt-14">
        <BrandMark />
        <CenterStack />
        <FooterMark />
      </main>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Background canvas                                                         */
/* ──────────────────────────────────────────────────────────────────────── */

function WaitlistBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ contain: "strict" }}
    >
      <div className="absolute inset-0 bg-[#FCFCFD] dark:bg-[#0A0B1F]" />
      <div
        className="absolute opacity-[0.18] dark:opacity-[0.28] [animation:wl-drift-a_64s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          left: "5%",
          top: "5%",
          width: "55vw",
          height: "55vw",
          maxWidth: "900px",
          maxHeight: "900px",
          background: "radial-gradient(closest-side, #5B8DFF, transparent 65%)",
          filter: "blur(140px)",
          willChange: "transform",
        }}
      />
      <div
        className="absolute opacity-[0.18] dark:opacity-[0.28] [animation:wl-drift-b_80s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          right: "5%",
          top: "20%",
          width: "55vw",
          height: "55vw",
          maxWidth: "900px",
          maxHeight: "900px",
          background: "radial-gradient(closest-side, #A788FF, transparent 65%)",
          filter: "blur(140px)",
          willChange: "transform",
        }}
      />
      <div
        className="absolute opacity-[0.18] dark:opacity-[0.28] [animation:wl-drift-c_94s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          left: "25%",
          bottom: "0%",
          width: "55vw",
          height: "55vw",
          maxWidth: "900px",
          maxHeight: "900px",
          background: "radial-gradient(closest-side, #FFB088, transparent 65%)",
          filter: "blur(140px)",
          willChange: "transform",
        }}
      />
      <div
        className="absolute inset-0 mix-blend-overlay opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
            `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0"/></filter><rect width="240" height="240" filter="url(#n)"/></svg>`,
          )}")`,
          backgroundSize: "240px 240px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 50%, rgba(26,27,58,0.08) 100%)",
        }}
      />
      <style jsx>{`
        @keyframes wl-drift-a {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(60px, -30px); }
          50% { transform: translate(-40px, 40px); }
          75% { transform: translate(-30px, -20px); }
        }
        @keyframes wl-drift-b {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-50px, 40px); }
          66% { transform: translate(30px, -30px); }
        }
        @keyframes wl-drift-c {
          0%, 100% { transform: translate(0, 0); }
          40% { transform: translate(40px, -50px); }
          70% { transform: translate(-50px, 20px); }
        }
      `}</style>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Brand mark                                                                */
/* ──────────────────────────────────────────────────────────────────────── */

function BrandMark() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.85 }}
      transition={{ duration: 0.8 }}
      className="flex items-center gap-2"
    >
      <span aria-hidden className="relative inline-flex h-2 w-2">
        <span
          className="absolute inline-flex h-full w-full animate-pulse-glow rounded-full"
          style={{
            background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
          }}
        />
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(167,136,255,0.85)]"
          style={{
            background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
          }}
        />
      </span>
      <span
        className="font-serif text-base font-medium text-text"
        style={{ letterSpacing: "0.05em" }}
      >
        Wynner
      </span>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Center stack                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

function CenterStack() {
  return (
    <div className="flex w-full flex-col items-center gap-10 sm:gap-12">
      <OrbWrap />
      <HeadlineAndTagline />
      <UnlockPreview />
      <SignupForm />
      <LiveSocialProof />
    </div>
  );
}

function OrbWrap() {
  // Tier the orb size to viewport so mobile doesn't get crowded.
  return (
    <>
      <div className="hidden md:block">
        <WaitlistOrb size={300} />
      </div>
      <div className="hidden sm:block md:hidden">
        <WaitlistOrb size={240} />
      </div>
      <div className="sm:hidden">
        <WaitlistOrb size={200} />
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Headline + rotating tagline                                               */
/* ──────────────────────────────────────────────────────────────────────── */

function HeadlineAndTagline() {
  const reduce = useReducedMotion();
  const headline = "Something is coming.";
  const chars = useMemo(() => Array.from(headline), [headline]);

  const [taglineIdx, setTaglineIdx] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(
      () => setTaglineIdx((i) => (i + 1) % TAGLINES.length),
      TAGLINE_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <div className="text-center">
      <h1
        className="font-serif leading-[1.0] tracking-[-0.02em] text-text"
        aria-label={headline}
        style={{ fontSize: "clamp(2.5rem, 8vw, 5.25rem)" }}
      >
        {reduce ? (
          <span>{headline}</span>
        ) : (
          <motion.span
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.025, delayChildren: 0.3 },
              },
            }}
            aria-hidden
          >
            {chars.map((c, i) => {
              const isPeriod = c === ".";
              return (
                <motion.span
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 14 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "inline-block",
                    isPeriod &&
                      "bg-gradient-to-br from-aurora-blue via-aurora-purple to-aurora-pink bg-clip-text text-transparent",
                  )}
                  style={c === " " ? { whiteSpace: "pre" } : undefined}
                >
                  {c}
                </motion.span>
              );
            })}
          </motion.span>
        )}
      </h1>

      <div
        className="relative mx-auto mt-5 h-7 max-w-md text-base text-text-muted md:mt-6 md:h-9 md:text-xl"
        aria-live="polite"
      >
        {reduce ? (
          <span className="font-serif italic">{TAGLINES[0]}</span>
        ) : (
          <AnimatePresence mode="wait">
            <motion.span
              key={taglineIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 block font-serif italic"
            >
              {TAGLINES[taglineIdx]}
            </motion.span>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* "What you unlock" — 3-item value preview strip                            */
/* ──────────────────────────────────────────────────────────────────────── */

const UNLOCKS: { icon: React.ElementType; title: string; body: string }[] = [
  {
    icon: Search,
    title: "Real web research",
    body: "Gemini reads Reddit, Amazon, forums — cited.",
  },
  {
    icon: Target,
    title: "Ready-to-ship angles",
    body: "Hooks, scripts, captions — pre-written.",
  },
  {
    icon: FileText,
    title: "14-page dossier",
    body: "Customer voice + launch playbook + sources.",
  },
];

function UnlockPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3"
    >
      {UNLOCKS.map((u) => {
        const Icon = u.icon;
        return (
          <div
            key={u.title}
            className="glass flex items-start gap-3 rounded-2xl p-4 backdrop-blur-2xl"
          >
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-aurora-purple/12">
              <Icon className="h-3.5 w-3.5 text-aurora-purple" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-text">{u.title}</div>
              <div className="mt-0.5 text-xs leading-snug text-text-muted">
                {u.body}
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Signup form                                                               */
/* ──────────────────────────────────────────────────────────────────────── */

function SignupForm() {
  const [state, setState] = useState<FormState>({ kind: "idle" });
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [refBumpAcknowledged, setRefBumpAcknowledged] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const shakeKey = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state.kind === "loading") return;
    const trimmed = email.trim();
    if (!trimmed) {
      shakeKey.current++;
      setState({ kind: "error", message: "Please enter your email." });
      return;
    }
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/waitlist/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          referralCode: referralCode ?? undefined,
          source:
            typeof document !== "undefined"
              ? document.referrer || "organic"
              : "organic",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        shakeKey.current++;
        setState({
          kind: "error",
          message: data?.error?.message ?? "Couldn't add you — try again?",
        });
        return;
      }
      setState({
        kind: "success",
        position: data.position,
        referralCode: data.referralCode,
        alreadyOnList: Boolean(data.alreadyOnList),
      });
    } catch (err) {
      shakeKey.current++;
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Network hiccup.",
      });
    }
  }

  if (state.kind === "success") {
    return (
      <SuccessCard
        position={state.position}
        referralCode={state.referralCode}
        alreadyOnList={state.alreadyOnList}
      />
    );
  }

  return (
    <motion.form
      onSubmit={submit}
      key={shakeKey.current}
      initial={state.kind === "error" ? { x: -6 } : false}
      animate={state.kind === "error" ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="glass relative w-full max-w-xl rounded-3xl p-5 backdrop-blur-2xl sm:p-7"
      style={{
        boxShadow:
          "0 30px 60px -20px rgba(91,141,255,0.30), inset 0 1px 0 0 var(--surface-glass-highlight)",
      }}
    >
      {referralCode && !refBumpAcknowledged && (
        <button
          type="button"
          onClick={() => setRefBumpAcknowledged(true)}
          className="mb-4 inline-flex w-full items-center justify-between gap-2 rounded-2xl border border-aurora-purple/40 bg-aurora-purple/10 px-3 py-2 text-left text-xs text-text"
        >
          <span>🎁 Invited by an operator — you start with a bonus spot.</span>
          <span className="text-text-muted">×</span>
        </button>
      )}

      <label htmlFor="waitlist-email" className="sr-only">
        Email address
      </label>
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          Get early access
        </div>
        <div className="hidden text-xs text-text-dim sm:block">
          Free · no card required
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          id="waitlist-email"
          type="email"
          required
          autoComplete="email"
          spellCheck={false}
          inputMode="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state.kind === "error") setState({ kind: "idle" });
          }}
          disabled={state.kind === "loading"}
          className={cn(
            "h-14 flex-1 rounded-2xl border bg-transparent px-5 text-base text-text outline-none transition-colors",
            "border-border-soft hover:border-aurora-purple/40 focus:border-aurora-purple",
            "focus:shadow-[0_0_0_4px_rgba(167,136,255,0.18)]",
            "placeholder:text-text-dim",
            state.kind === "error" && "border-aurora-peach",
          )}
        />
        <button
          type="submit"
          disabled={state.kind === "loading"}
          aria-label="Join the waitlist"
          className="group relative inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-7 text-base font-medium text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-80"
          style={{
            background: "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
            boxShadow: "0 14px 40px -10px rgba(167,136,255,0.65)",
          }}
        >
          {state.kind === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Join the waitlist
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
      {state.kind === "error" && (
        <p className="mt-2 text-xs text-aurora-peach">{state.message}</p>
      )}
      <p className="mt-3 text-center text-xs text-text-dim sm:text-left">
        By joining, you accept early access. No spam. Unsubscribe anytime.
      </p>
    </motion.form>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Success card                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

function SuccessCard({
  position,
  referralCode,
  alreadyOnList,
}: {
  position: number;
  referralCode: string;
  alreadyOnList: boolean;
}) {
  const refUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${referralCode}`
      : `https://wynner.app/?ref=${referralCode}`;
  const display = displayedPosition(position);

  function copy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    void navigator.clipboard.writeText(refUrl);
    toast.success("Link copied", { description: refUrl });
  }

  function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      void (
        navigator as Navigator & { share: (data: ShareData) => Promise<void> }
      )
        .share({
          title: "Wynner — Early access",
          text: "Real-time AI product intelligence for dropshippers. Join the waitlist:",
          url: refUrl,
        })
        .catch(() => copy());
    } else {
      copy();
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass w-full max-w-xl rounded-3xl p-6 backdrop-blur-2xl sm:p-8"
      style={{
        boxShadow:
          "0 0 0 1px rgba(167,136,255,0.30), 0 30px 60px -20px rgba(91,141,255,0.35), inset 0 1px 0 0 var(--surface-glass-highlight)",
      }}
      role="region"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center">
        <CheckmarkBurst />
        <h2 className="mt-5 font-serif text-2xl text-text sm:text-3xl">
          {alreadyOnList ? "Already in." : "You're in."}
        </h2>
        <p className="mt-2 text-base text-text-muted">
          {alreadyOnList ? "You were on the list at " : "You're "}
          <span className="font-mono tabular-nums text-text">#</span>
          <span className="font-mono tabular-nums text-text">
            <CountUp end={display} duration={1.4} useEasing separator="," />
          </span>
          {alreadyOnList ? "." : " in line."}
        </p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-6 text-sm text-text-muted"
        >
          Want to move up? Share with operators who&apos;d love this.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mt-4 flex w-full items-center gap-1 rounded-2xl border border-border-soft bg-surface/70 p-1.5"
        >
          <code className="flex-1 truncate px-2 font-mono text-[11px] text-text-muted">
            {refUrl}
          </code>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy link"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-text-muted hover:bg-surface hover:text-text"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={share}
            aria-label="Share link"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-text-muted hover:bg-surface hover:text-text"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </motion.div>
        <p className="mt-3 text-xs text-text-dim">
          Each signup from your link bumps you up 5 spots.
        </p>
      </div>
    </motion.div>
  );
}

function CheckmarkBurst() {
  return (
    <motion.div
      className="relative flex h-14 w-14 items-center justify-center rounded-full"
      style={{
        background:
          "radial-gradient(closest-side, rgba(61,214,140,0.35), transparent 70%)",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ scale: 0.6, opacity: 0.8 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(closest-side, rgba(61,214,140,0.45), transparent 70%)",
        }}
      />
      <motion.div
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-aurora-green/20"
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 20 }}
      >
        <Check className="h-6 w-6 text-aurora-green" strokeWidth={2.5} />
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Live counter + recently-joined ticker                                     */
/* ──────────────────────────────────────────────────────────────────────── */

function LiveSocialProof() {
  const [realCount, setRealCount] = useState<number | null>(null);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [tickerIdx, setTickerIdx] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/waitlist/count");
      if (!res.ok) return;
      const data = (await res.json()) as { count: number };
      setRealCount(data.count);
    } catch {
      /* swallow */
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await fetch("/api/waitlist/recent");
      if (!res.ok) return;
      const data = (await res.json()) as { rows: RecentRow[] };
      setRecent(data.rows);
    } catch {
      /* swallow */
    }
  }, []);

  useEffect(() => {
    void fetchCount();
    void fetchRecent();
    let cId: number | null = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchCount();
    }, COUNT_POLL_MS);
    let rId: number | null = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchRecent();
    }, RECENT_POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void fetchCount();
        void fetchRecent();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (cId) window.clearInterval(cId);
      if (rId) window.clearInterval(rId);
      cId = null;
      rId = null;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchCount, fetchRecent]);

  useEffect(() => {
    if (recent.length === 0) return;
    const id = window.setInterval(() => {
      setTickerIdx((i) => (i + 1) % recent.length);
    }, RECENT_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [recent.length]);

  const display = realCount === null ? null : displayedCount(realCount);
  const noun = display === 1 ? "operator" : "operators";
  const tickerRow = recent[tickerIdx];

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/60 px-4 py-1.5 text-sm text-text-muted backdrop-blur-md">
        <span
          aria-hidden
          className="inline-flex h-1.5 w-1.5 rounded-full bg-aurora-green shadow-[0_0_8px_rgba(61,214,140,0.8)] [animation:wl-livedot_2s_ease-in-out_infinite] motion-reduce:animate-none"
        />
        <span className="font-mono tabular-nums text-text">
          {display === null ? (
            "—"
          ) : (
            <CountUp end={display} duration={1.2} preserveValue separator="," />
          )}
        </span>
        <span>{noun} on the list</span>
      </div>

      <div className="relative h-6 w-full max-w-md overflow-hidden text-center">
        <AnimatePresence mode="wait">
          {tickerRow && (
            <motion.div
              key={`${tickerRow.email}-${tickerIdx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-text-dim"
            >
              <Sparkles className="h-3 w-3 text-aurora-purple" />
              <span>
                {tickerRow.email} joined {relativeShort(tickerRow.createdAt)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        @keyframes wl-livedot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

function relativeShort(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Footer mark                                                               */
/* ──────────────────────────────────────────────────────────────────────── */

function FooterMark() {
  return (
    <div className="flex flex-col items-center gap-1 text-center text-xs text-text-dim">
      <div className="flex items-center gap-1.5">
        <Globe2 className="h-3 w-3" />
        <span>Built quietly in Zagreb. Early access opens in waves.</span>
      </div>
    </div>
  );
}
