"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────── */
/* VideoSlot — smart wrapper that swaps in a fallback when the video is     */
/* missing. Probes the asset URL on mount via a HEAD request; if it 404s,    */
/* renders the fallback prop instead. Same dimensions either way.            */
/* ────────────────────────────────────────────────────────────────────────── */

type VideoSlotProps = {
  videoSrc?: string;
  posterSrc?: string;
  fallback: React.ReactNode;
  aspectRatio?: "16/9" | "16/10" | "4/5" | "1/1";
  /** Auto-play + loop + muted (silent demo loops). Default true. */
  autoplay?: boolean;
  /** "open in modal" hover affordance. Set false for purely decorative loops. */
  openable?: boolean;
  onOpenModal?: () => void;
  className?: string;
};

export function VideoSlot({
  videoSrc,
  posterSrc,
  fallback,
  aspectRatio = "16/9",
  autoplay = true,
  openable = false,
  onOpenModal,
  className,
}: VideoSlotProps) {
  const [available, setAvailable] = useState<boolean | null>(
    videoSrc ? null : false,
  );

  // Probe the asset on mount. We HEAD instead of GET so we don't pull a
  // 30MB video file just to check existence. If it 404s or the network
  // fails, we render the fallback — never block the page on a missing
  // asset.
  useEffect(() => {
    if (!videoSrc) {
      setAvailable(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(videoSrc, { method: "HEAD" });
        if (!cancelled) setAvailable(res.ok);
      } catch {
        if (!cancelled) setAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [videoSrc]);

  const ratioClass =
    aspectRatio === "16/9"
      ? "aspect-video"
      : aspectRatio === "16/10"
        ? "aspect-[16/10]"
        : aspectRatio === "4/5"
          ? "aspect-[4/5]"
          : "aspect-square";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-3xl border border-border-soft bg-surface",
        ratioClass,
        className,
      )}
      style={{
        boxShadow:
          "0 30px 80px -20px rgba(91,141,255,0.35), inset 0 1px 0 0 rgba(255,255,255,0.6)",
      }}
    >
      {/* Animated aurora border shimmer */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-3xl"
        style={{
          background:
            "linear-gradient(120deg, transparent 30%, rgba(167,136,255,0.5) 50%, transparent 70%)",
          backgroundSize: "300% 100%",
          animation: "videoslot-shimmer 8s ease-in-out infinite",
          maskImage:
            "linear-gradient(black, black) content-box, linear-gradient(black, black)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
      />

      {/* Video — only mounted when we've confirmed the asset is available. */}
      {available === true && videoSrc ? (
        <video
          src={videoSrc}
          poster={posterSrc}
          autoPlay={autoplay}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : available === false ? (
        // Confirmed missing → fallback. Renders inside the same frame.
        <div className="absolute inset-0">{fallback}</div>
      ) : (
        // Probe pending — render the fallback immediately so the page
        // doesn't flash empty. When the probe resolves, we either keep
        // the fallback or swap to the video.
        <div className="absolute inset-0">{fallback}</div>
      )}

      {/* Hover "open" affordance */}
      {openable && (
        <button
          type="button"
          onClick={onOpenModal}
          aria-label="Open video"
          className="group absolute inset-0 flex items-center justify-center bg-transparent transition-colors hover:bg-black/10"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/15 opacity-0 backdrop-blur-xl transition-opacity group-hover:opacity-100">
            <Play className="h-5 w-5 text-white" fill="currentColor" />
          </span>
        </button>
      )}

      <style jsx>{`
        @keyframes videoslot-shimmer {
          0%, 100% { background-position: -100% 0%; }
          50% { background-position: 200% 0%; }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* VideoModal — full-screen player. Esc + backdrop click close.              */
/* ────────────────────────────────────────────────────────────────────────── */

type VideoModalProps = {
  open: boolean;
  onClose: () => void;
  videoSrc: string;
  title?: string;
};

export function VideoModal({ open, onClose, videoSrc, title }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Pause + reset on close so reopening starts from 0.
  useEffect(() => {
    if (!open && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0A0B1F]/85 px-6 backdrop-blur-2xl"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title ?? "Video player"}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-black shadow-[0_40px_120px_-20px_rgba(167,136,255,0.65)]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close video"
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-xl hover:bg-black/60"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="aspect-video w-full">
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                autoPlay
                playsInline
                className="h-full w-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Fallback: hero visual — a designed glass mockup of a Wynner scan result. */
/* Pure HTML + Tailwind. Looks like an intentional product shot, not a      */
/* placeholder. Gentle float.                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export function FallbackHeroVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#5B8DFF]/12 via-[#A788FF]/12 to-[#FF89C5]/12 p-6 [animation:hero-float_5s_ease-in-out_infinite] motion-reduce:animate-none">
      {/* Phantom product image plate */}
      <div className="relative w-full max-w-md">
        <div className="glass relative overflow-hidden rounded-2xl p-5 backdrop-blur-2xl">
          <div className="flex items-start gap-4">
            {/* Mock product image */}
            <div
              className="relative h-24 w-24 shrink-0 rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(91,141,255,0.45), rgba(167,136,255,0.4))",
                boxShadow: "0 12px 24px -10px rgba(91,141,255,0.5)",
              }}
            >
              <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-white/80" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-aurora-green/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-aurora-green">
                Test it
              </div>
              <h4 className="font-serif text-lg leading-tight text-text">
                Posture corrector belt
              </h4>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                Wellness · 🇩🇪 Germany
              </p>
            </div>
            {/* Score ring */}
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
              <svg viewBox="0 0 64 64" className="absolute inset-0">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="rgba(167,136,255,0.18)"
                  strokeWidth="4"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="url(#hero-score-grad)"
                  strokeWidth="4"
                  strokeDasharray={`${(87 / 100) * 175.93} 175.93`}
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)"
                />
                <defs>
                  <linearGradient id="hero-score-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5B8DFF" />
                    <stop offset="50%" stopColor="#A788FF" />
                    <stop offset="100%" stopColor="#FF89C5" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="relative font-serif text-xl text-text">87</span>
            </div>
          </div>

          {/* Pillar bars */}
          <div className="mt-5 grid grid-cols-5 gap-2">
            {[
              { label: "MGN", v: 78, c: "#5B8DFF" },
              { label: "FIT", v: 92, c: "#A788FF" },
              { label: "DMD", v: 85, c: "#FF89C5" },
              { label: "CMP", v: 64, c: "#FFB088" },
              { label: "CRT", v: 81, c: "#88E5C8" },
            ].map((p) => (
              <div key={p.label}>
                <div className="font-mono text-[8px] uppercase tracking-wider text-text-muted">
                  {p.label}
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border-soft">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${p.v}%`, backgroundColor: p.c }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-surface/70 px-2.5 py-1 font-mono text-[10px] text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-aurora-green" />
            Grounded · 42 sources
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Fallback: demo composite — mini AI orb + source feed + stage timeline    */
/* ────────────────────────────────────────────────────────────────────────── */

export function FallbackDemoVideo() {
  return (
    <div className="relative grid h-full w-full grid-cols-[140px_1fr_140px] grid-rows-1 gap-3 bg-gradient-to-br from-[#5B8DFF]/8 via-[#A788FF]/10 to-[#FF89C5]/8 p-6">
      {/* Left — mini source feed */}
      <div className="glass flex flex-col gap-2 rounded-2xl p-3 backdrop-blur-2xl">
        <div className="font-mono text-[8px] uppercase tracking-wider text-text-muted">
          Live research
        </div>
        {[
          "🔍 reddit posture",
          "📄 reddit.com",
          "🔍 amazon reviews",
          "📄 amazon.de",
          "📄 forum.fitness",
        ].map((line, i) => (
          <div
            key={i}
            className="rounded-md border border-border-soft/50 bg-surface/40 px-2 py-1 text-[10px] text-text"
            style={{ opacity: 1 - i * 0.15 }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Center — mini orb */}
      <div className="relative flex items-center justify-center">
        <div
          aria-hidden
          className="absolute h-48 w-48 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(167,136,255,0.5), transparent 70%)",
            filter: "blur(28px)",
          }}
        />
        <div
          className="relative h-32 w-32 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, #FFFFFF 0%, #A788FF 35%, #5B8DFF 70%, #FF89C5 100%)",
            boxShadow:
              "0 20px 40px -10px rgba(167,136,255,0.7), inset 0 0 30px rgba(255,255,255,0.3)",
          }}
        />
        <div
          className="absolute h-44 w-44 rounded-full border border-aurora-purple/40 [animation:demo-pulse_3s_ease-out_infinite]"
        />
      </div>

      {/* Right — stage list */}
      <div className="glass flex flex-col gap-2 rounded-2xl p-3 backdrop-blur-2xl">
        <div className="font-mono text-[8px] uppercase tracking-wider text-text-muted">
          Stages
        </div>
        {[
          { l: "Landscape", done: true },
          { l: "Voice", done: true },
          { l: "Competitors", active: true },
          { l: "Personas", done: false },
          { l: "Angles", done: false },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px]">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: s.done
                  ? "#3DD68C"
                  : s.active
                    ? "#A788FF"
                    : "rgba(167,136,255,0.2)",
              }}
            />
            <span className={s.done || s.active ? "text-text" : "text-text-muted"}>
              {s.l}
            </span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes demo-pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Fallback: feature card — adapts shape per type prop                       */
/* ────────────────────────────────────────────────────────────────────────── */

type FeatureCardType = "scoring" | "angles" | "pdf";

export function FallbackFeatureCard({ type }: { type: FeatureCardType }) {
  if (type === "scoring") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#5B8DFF]/10 to-[#A788FF]/10 p-8">
        <div className="relative h-40 w-40">
          <svg viewBox="0 0 160 160" className="absolute inset-0">
            <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(167,136,255,0.15)" strokeWidth="10" />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="url(#fb-score-grad)"
              strokeWidth="10"
              strokeDasharray={`${(87 / 100) * 439.82} 439.82`}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
            <defs>
              <linearGradient id="fb-score-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5B8DFF" />
                <stop offset="50%" stopColor="#A788FF" />
                <stop offset="100%" stopColor="#FF89C5" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif text-5xl text-text">87</span>
          </div>
        </div>
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          style={{ backgroundColor: "rgba(255,171,64,0.18)", color: "#D69230" }}
        >
          Test it
        </div>
        <div className="grid w-full max-w-xs grid-cols-5 gap-2">
          {[78, 92, 85, 64, 81].map((v, i) => (
            <div
              key={i}
              className="h-2 overflow-hidden rounded-full bg-border-soft"
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${v}%`,
                  background:
                    "linear-gradient(90deg, #5B8DFF, #A788FF, #FF89C5)",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "angles") {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#A788FF]/12 to-[#FF89C5]/12 p-8">
        {/* 3 stacked angle cards */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="glass absolute w-3/4 max-w-sm rounded-2xl p-5 backdrop-blur-2xl"
            style={{
              top: `${20 + i * 18}%`,
              left: i === 0 ? "8%" : i === 1 ? "16%" : "24%",
              zIndex: 3 - i,
              transform: `rotate(${-3 + i * 2}deg)`,
              opacity: 1 - i * 0.15,
              boxShadow: `0 20px 40px -16px rgba(167,136,255,0.4)`,
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-aurora-purple text-xs text-white">
                #{i + 1}
              </span>
              <span className="inline-flex rounded-full bg-aurora-blue/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-aurora-blue">
                Problem-aware
              </span>
            </div>
            <p className="font-serif text-base italic leading-tight text-text">
              &ldquo;Stop scrolling past products that look like back pain.&rdquo;
            </p>
            <div className="mt-3 flex gap-1.5">
              {[78, 92, 64, 40].map((v, k) => (
                <div
                  key={k}
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-soft"
                >
                  <div
                    className="h-full rounded-full bg-aurora-purple"
                    style={{ width: `${v}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // PDF cover fallback
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FFB088]/12 to-[#FF89C5]/12 p-8">
      <div
        className="relative w-full max-w-xs bg-white p-6 shadow-[0_30px_60px_-20px_rgba(91,141,255,0.4)]"
        style={{
          aspectRatio: "1 / 1.414",
          border: "1px solid rgba(167,136,255,0.25)",
        }}
      >
        <div className="font-mono text-[9px] uppercase tracking-wider text-[#9DA0BF]">
          Wynner · Deep Research
        </div>
        <div className="mt-12 font-serif text-3xl leading-tight text-[#1A1B3A]">
          Posture corrector belt
        </div>
        <div className="mt-1 text-xs text-[#5B5E8C]">Germany · DACH market</div>
        <div className="mt-8 inline-flex items-baseline gap-2">
          <span className="font-serif text-6xl text-[#1A1B3A]">87</span>
          <span className="font-mono text-xs text-[#5B5E8C]">/ 100</span>
        </div>
        <div
          className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: "rgba(255,171,64,0.2)", color: "#D69230" }}
        >
          Test it
        </div>
        <div className="absolute bottom-6 left-6 right-6 border-t border-[#E6E6F0] pt-3 text-[9px] font-mono uppercase tracking-wider text-[#9DA0BF]">
          14 pages · 42 sources · 8 angles
        </div>
      </div>
    </div>
  );
}

/* Fallback avatar — used by testimonial cards. */
export function FallbackAvatar({
  name,
  accent = "#A788FF",
}: {
  name: string;
  accent?: string;
}) {
  const initial = (name?.[0] ?? "?").toUpperCase();
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-full font-serif text-sm text-white"
      style={{
        background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
        boxShadow: `0 4px 12px -2px ${accent}66`,
      }}
    >
      {initial}
    </div>
  );
}
