"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProductStore } from "@/lib/store/products";
import { usePreferences } from "@/lib/store/preferences";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

type Confetti = {
  id: number;
  left: number;
  color: string;
  delay: number;
  rotateEnd: number;
  duration: number;
  fallTo: number;
};

const PALETTE = ["#00D26A", "#F5A623", "#3B82F6", "#F472B6", "#8B5CF6"];

export function EasterEggs() {
  const [confetti, setConfetti] = useState<Confetti[] | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const buffer = useRef<string[]>([]);
  const wordBuffer = useRef<string>("");
  const wordTimer = useRef<number | null>(null);

  const productsCount = useProductStore((s) => s.products.length);
  const favoritesCount = useProductStore((s) => s.favorites.size);
  const prefs = usePreferences();

  const triggerKonami = useCallback(() => {
    // Precompute all randomness here (outside JSX render) so React 19's
    // purity rule is happy.
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const items: Confetti[] = Array.from({ length: 90 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: PALETTE[i % PALETTE.length],
      delay: Math.random() * 0.3,
      rotateEnd: Math.random() * 720 - 360,
      duration: 2 + Math.random() * 0.8,
      fallTo: vh + 50,
    }));
    setConfetti(items);
    toast.success("You found the easter egg.", {
      description: "Enjoy the confetti.",
    });
    window.setTimeout(() => setConfetti(null), 2800);
  }, []);

  const triggerLogoGlow = useCallback(() => {
    document.documentElement.dataset.logoGlow = "1";
    window.setTimeout(() => {
      delete document.documentElement.dataset.logoGlow;
    }, 2800);
    toast("Wynner.");
  }, []);

  // Konami listener
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      buffer.current.push(k);
      if (buffer.current.length > KONAMI.length) buffer.current.shift();
      if (
        buffer.current.length === KONAMI.length &&
        buffer.current.every((v, i) => v === KONAMI[i])
      ) {
        buffer.current = [];
        triggerKonami();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [triggerKonami]);

  // "wynner" word trap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing in form fields.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key.length !== 1) return;
      wordBuffer.current = (wordBuffer.current + e.key.toLowerCase()).slice(-12);
      if (wordTimer.current) window.clearTimeout(wordTimer.current);
      wordTimer.current = window.setTimeout(() => {
        wordBuffer.current = "";
      }, 1500);
      if (wordBuffer.current.endsWith("wynner")) {
        wordBuffer.current = "";
        triggerLogoGlow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [triggerLogoGlow]);

  // Listen for logo-click events emitted by the top nav (5 clicks → debug)
  useEffect(() => {
    const onDebug = () => setDebugOpen(true);
    window.addEventListener("wynner:debug", onDebug);
    return () => window.removeEventListener("wynner:debug", onDebug);
  }, []);

  return (
    <>
      <AnimatePresence>
        {confetti && (
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[110] overflow-hidden"
          >
            {confetti.map((c) => (
              <motion.span
                key={c.id}
                className="absolute top-0 inline-block h-2 w-1 rounded-sm"
                style={{
                  left: `${c.left}%`,
                  background: c.color,
                  boxShadow: `0 0 8px ${c.color}80`,
                }}
                initial={{ y: -20, opacity: 0, rotate: 0 }}
                animate={{
                  y: c.fallTo,
                  opacity: [0, 1, 1, 0],
                  rotate: c.rotateEnd,
                }}
                transition={{
                  duration: c.duration,
                  delay: c.delay,
                  ease: "easeIn",
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <Dialog open={debugOpen} onOpenChange={setDebugOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Debug · Zustand snapshot</DialogTitle>
            <DialogDescription>
              Five clicks on the logo opened this. Press Esc to close.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <Stat label="products" value={productsCount} />
              <Stat label="favorites" value={favoritesCount} />
              <Stat label="vault layout" value={prefs.vaultLayout} />
              <Stat label="compact mode" value={String(prefs.compactMode)} />
              <Stat label="prefer pro" value={String(prefs.preferProModel)} />
              <Stat label="premium cursor" value={String(prefs.premiumCursor)} />
              <Stat
                label="reddit voice"
                value={String(prefs.redditVoiceEnabled)}
              />
              <Stat
                label="scrapers on"
                value={Object.entries(prefs.scrapers)
                  .filter(([, v]) => v)
                  .map(([k]) => k)
                  .join(", ") || "—"}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logo glow when triggered by word-trap */}
      <style>{`
        html[data-logo-glow="1"] [data-wynner-logo] {
          text-shadow: 0 0 18px rgba(0, 210, 106, 0.9);
          transition: text-shadow 0.5s ease-out;
        }
      `}</style>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border-soft bg-surface px-2.5 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-text-dim">
        {label}
      </div>
      <div className="mt-0.5 truncate text-text">{value}</div>
    </div>
  );
}
