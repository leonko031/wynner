"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Layers, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProductStore } from "@/lib/store/products";
import { usePreferences } from "@/lib/store/preferences";
import { useNotifications } from "@/lib/store/notifications";
import { SEED_PRODUCTS } from "@/lib/data/seed";

export function WelcomeModal() {
  const router = useRouter();
  const products = useProductStore((s) => s.products);
  const hydrate = useProductStore((s) => s.hydrate);
  const removeProduct = useProductStore((s) => s.removeProduct);
  const completed = usePreferences((s) => s.completedOnboarding);
  const setCompleted = usePreferences((s) => s.setCompletedOnboarding);
  const startTour = usePreferences((s) => s.startTour);
  const pushNotif = useNotifications((s) => s.push);
  const [open, setOpen] = useState(false);

  // Open when no products + onboarding not yet completed.
  // We hydrate via StoreHydration, so check both flags after a tick.
  useEffect(() => {
    if (completed) return;
    const t = window.setTimeout(() => {
      if (!completed && products.length === 0) {
        setOpen(true);
      } else if (!completed && products.length > 0) {
        // products were already seeded (e.g. existing localStorage); mark done silently
        setCompleted(true);
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [completed, products.length, setCompleted]);

  function useSample() {
    hydrate(SEED_PRODUCTS);
    setCompleted(true);
    setOpen(false);
    pushNotif({
      kind: "tip",
      title: "Welcome to Wynner",
      body: "We loaded 30 sample products so the app feels alive from day one.",
    });
    // Small delay before starting the tour so the dashboard mounts.
    window.setTimeout(() => startTour(), 600);
    router.push("/dashboard");
  }

  function startFresh() {
    // Drop the hydrated seed if any.
    for (const p of [...products]) removeProduct(p.id);
    setCompleted(true);
    setOpen(false);
    pushNotif({
      kind: "tip",
      title: "Welcome to Wynner",
      body: "Hit /scan to score your first product whenever you're ready.",
    });
    router.push("/scan");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-w-lg overflow-hidden p-0"
      >
        {/* Visible eyebrow */}
        <div className="relative px-8 pt-8">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-32 opacity-70"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(0,210,106,0.18) 0%, transparent 70%)",
            }}
          />
          <div className="relative flex items-center gap-2 text-xs text-text-muted">
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-pulse-glow rounded-full bg-go" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-go shadow-[0_0_10px_rgba(0,210,106,0.9)]" />
            </span>
            <span className="font-mono uppercase tracking-wider text-[11px]">
              Wynner
            </span>
          </div>
          <DialogTitle className="mt-4 text-3xl font-medium tracking-tight">
            Know before you launch.
          </DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-relaxed text-text-muted">
            Score any dropshipping product against margin, market fit, demand,
            competition, and creative potential. Surface real Reddit buyer
            language. Pick winners with confidence.
          </DialogDescription>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-3 px-8 py-6"
        >
          <Feature icon={Search} label="Five-pillar score" />
          <Feature icon={Layers} label="Real Reddit voice" />
          <Feature icon={Sparkles} label="Built to ship" />
        </motion.div>

        <div className="flex flex-col-reverse gap-2 border-t border-border-soft bg-surface/50 px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            className="rounded-full text-text-muted"
            onClick={startFresh}
          >
            Start fresh
          </Button>
          <Button className="rounded-full" onClick={useSample}>
            Use sample data <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Feature({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border-soft bg-surface px-3 py-3 text-center">
      <Icon className="h-4 w-4 text-go" />
      <span className="text-[11px] text-text">{label}</span>
    </div>
  );
}
