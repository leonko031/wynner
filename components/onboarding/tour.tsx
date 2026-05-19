"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/lib/store/preferences";
import { wynnerToast } from "@/lib/toast";

type Step = {
  selector: string;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "left" | "right";
  routeHint?: string; // tour only shows when this route prefix matches
};

const STEPS: Step[] = [
  {
    selector: "[data-tour='hero']",
    title: "Today's top pick",
    body: "The big number is the verdict at a glance. Anything 80+ is launch-ready.",
    placement: "right",
    routeHint: "/dashboard",
  },
  {
    selector: "[data-tour='top-grid'] [role='button'][tabindex='0']",
    title: "Open any product",
    body: "Click a card to open its full dossier — pillar breakdown, country fit, real Reddit quotes.",
    placement: "top",
    routeHint: "/dashboard",
  },
  {
    selector: "[data-tour='scan-link']",
    title: "Score your own",
    body: "The /scan flow takes 3 quick steps: details, target country, generate.",
    placement: "bottom",
    routeHint: "/dashboard",
  },
  {
    selector: "[data-tour='cmdk']",
    title: "Press ⌘K anywhere",
    body: "Jump to any product, page, or filter without touching the mouse.",
    placement: "bottom",
    routeHint: "/dashboard",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

export function Tour() {
  const tourStep = usePreferences((s) => s.tourStep);
  const setTourStep = usePreferences((s) => s.setTourStep);
  const endTour = usePreferences((s) => s.endTour);
  const pathname = usePathname();
  const [rect, setRect] = useState<Rect | null>(null);

  const active = tourStep >= 0 && tourStep < STEPS.length;
  const step = active ? STEPS[tourStep] : null;

  // Re-measure target on step change, route change, resize, scroll.
  // All setState calls go through setTimeout(0) so the lint rule against
  // setState-in-effect-body stays happy.
  useEffect(() => {
    if (!step || (step.routeHint && !pathname.startsWith(step.routeHint))) {
      const t = window.setTimeout(() => setRect(null), 0);
      return () => window.clearTimeout(t);
    }
    const measure = () => {
      const el = document.querySelector<HTMLElement>(step.selector);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top + window.scrollY,
        left: r.left + window.scrollX,
        width: r.width,
        height: r.height,
      });
    };
    // First measure on next tick to keep setState out of the effect body.
    const initialMeasure = window.setTimeout(measure, 0);
    const id = window.setInterval(measure, 250); // target may animate in
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(initialMeasure);
      window.clearInterval(id);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, pathname]);

  function next() {
    if (!step) return;
    if (tourStep === STEPS.length - 1) {
      endTour();
      wynnerToast.success("You're all set", {
        description: "Press ? anytime for keyboard shortcuts.",
      });
      return;
    }
    setTourStep(tourStep + 1);
  }
  function skip() {
    endTour();
    wynnerToast.info("Tour skipped", {
      description: "Re-run it any time from Settings.",
    });
  }

  if (!step) return null;

  return (
    <AnimatePresence>
      {/* Spotlight rectangle around the target — clipped via mask */}
      {rect && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[200]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: "rgba(10, 10, 11, 0.72)",
            WebkitMaskImage: `radial-gradient(
              ellipse ${rect.width / 2 + 28}px ${rect.height / 2 + 28}px
              at ${rect.left + rect.width / 2 - window.scrollX}px ${rect.top + rect.height / 2 - window.scrollY}px,
              transparent 0%,
              transparent 60%,
              black 100%
            )`,
            maskImage: `radial-gradient(
              ellipse ${rect.width / 2 + 28}px ${rect.height / 2 + 28}px
              at ${rect.left + rect.width / 2 - window.scrollX}px ${rect.top + rect.height / 2 - window.scrollY}px,
              transparent 0%,
              transparent 60%,
              black 100%
            )`,
          }}
        />
      )}

      {/* Bubble */}
      <motion.div
        key={`bubble-${tourStep}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed z-[201] max-w-xs rounded-2xl border border-border-strong bg-surface-elevated p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]"
        style={
          rect
            ? bubblePosition(rect, step.placement ?? "bottom")
            : { right: "1.25rem", bottom: "1.25rem" }
        }
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            {tourStep + 1} / {STEPS.length}
          </span>
          <span className="ml-auto inline-flex gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={
                  i === tourStep
                    ? "h-1 w-3 rounded-full bg-go"
                    : i < tourStep
                      ? "h-1 w-1 rounded-full bg-go/60"
                      : "h-1 w-1 rounded-full bg-border-strong"
                }
              />
            ))}
          </span>
        </div>
        <h3 className="mt-2 text-sm font-medium text-text">{step.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">
          {step.body}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={skip}
            className="text-[11px] text-text-dim underline-offset-2 hover:text-text hover:underline"
          >
            Skip tour
          </button>
          <Button size="sm" className="rounded-full" onClick={next}>
            {tourStep === STEPS.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function bubblePosition(
  rect: Rect,
  placement: NonNullable<Step["placement"]>,
): React.CSSProperties {
  const PAD = 16;
  const top = rect.top - window.scrollY;
  const left = rect.left - window.scrollX;
  switch (placement) {
    case "top":
      return {
        top: Math.max(PAD, top - 180),
        left: Math.max(PAD, left + rect.width / 2 - 160),
      };
    case "left":
      return {
        top: Math.max(PAD, top + rect.height / 2 - 60),
        left: Math.max(PAD, left - 340),
      };
    case "right":
      return {
        top: Math.max(PAD, top + rect.height / 2 - 60),
        left: Math.min(window.innerWidth - 340, left + rect.width + 16),
      };
    case "bottom":
    default:
      return {
        top: top + rect.height + 12,
        left: Math.max(PAD, Math.min(window.innerWidth - 340, left + rect.width / 2 - 160)),
      };
  }
}
