"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Drawer } from "vaul";
import { Sparkles } from "lucide-react";
import { Stepper } from "@/components/scan/stepper";

/**
 * Glass-pill Scan FAB anchored bottom-right of the (app) shell.
 *
 * Click opens a vaul bottom-sheet that nudges the user to the full /scan
 * flow. We don't re-mount the wizard inside the sheet (its state is heavy,
 * tied to the route, and the Step 3 → /product/[id] navigation already gives
 * the right "land on detail page" feeling). The sheet is a fast launch
 * surface; routing forward keeps everything coherent.
 *
 * Hidden when already on /scan to avoid duplication.
 */
export function ScanFAB() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Pressing S anywhere outside an input should also open the sheet — handled
  // by the existing global shortcut which pushes /scan. The FAB is the
  // mouse path.
  useEffect(() => {
    if (!pathname.startsWith("/scan")) return;
    const t = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(t);
  }, [pathname]);

  if (pathname.startsWith("/scan")) return null;

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <motion.button
          type="button"
          aria-label="Start a new scan"
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 22,
            delay: 0.6,
          }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 z-40 flex h-12 items-center gap-2 rounded-full px-5 text-sm font-medium text-white shadow-[0_18px_50px_-12px_rgba(91,141,255,0.55),0_0_36px_rgba(167,136,255,0.4)]"
          style={{
            background:
              "linear-gradient(135deg, #5B8DFF 0%, #A788FF 60%, #FF89C5 100%)",
          }}
        >
          {/* Pulsing inner glow */}
          <motion.span
            aria-hidden
            animate={{ opacity: [0.5, 0.85, 0.5] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,255,255,0.4) 0%, transparent 70%)",
            }}
          />
          <Sparkles className="relative h-4 w-4" />
          <span className="relative">Scan</span>
        </motion.button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-[88vh] flex-col rounded-t-3xl border border-border-strong bg-surface-elevated outline-none">
          <Drawer.Title className="sr-only">Start a new scan</Drawer.Title>
          <Drawer.Description className="sr-only">
            3-step product scoring wizard.
          </Drawer.Description>
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border-strong" />
          <div className="px-6 py-6">
            <Stepper current={1} />
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 pb-12 text-center">
            <div
              aria-hidden
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #5B8DFF 0%, #A788FF 60%, #FF89C5 100%)",
                boxShadow:
                  "0 18px 40px -10px rgba(91,141,255,0.5), 0 0 28px rgba(167,136,255,0.35)",
              }}
            >
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-medium tracking-tight">
              Score your next product
            </h2>
            <p className="max-w-md text-sm text-text-muted">
              Open the full scan flow — three quick steps, then a verdict in
              ~5 seconds.
            </p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/scan");
              }}
              className="mt-2 inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-medium text-white shadow-[0_18px_40px_-10px_rgba(91,141,255,0.55)]"
              style={{
                background:
                  "linear-gradient(135deg, #5B8DFF 0%, #A788FF 60%, #FF89C5 100%)",
              }}
            >
              Open scan wizard
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
