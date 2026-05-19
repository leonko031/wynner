"use client";

import { toast as sonnerToast } from "sonner";
import type { Verdict } from "@/types";

type Options = {
  description?: string;
  durationMs?: number;
};

const VERDICT_CLS: Record<Verdict, string> = {
  go: "wynner-toast-go",
  test: "wynner-toast-test",
  risky: "wynner-toast-risky",
  skip: "wynner-toast-skip",
};

const BASE = "wynner-toast";

/**
 * Verdict-accented sonner wrapper. The actual visual treatment lives as
 * scoped CSS in app/globals.css (`.wynner-toast` + `.wynner-toast-<accent>`).
 */
export const wynnerToast = {
  success(title: string, opts: Options = {}) {
    return sonnerToast.success(title, {
      description: opts.description,
      duration: opts.durationMs,
      classNames: { toast: `${BASE} wynner-toast-go` },
    });
  },
  info(title: string, opts: Options = {}) {
    return sonnerToast(title, {
      description: opts.description,
      duration: opts.durationMs,
      classNames: { toast: `${BASE} wynner-toast-info` },
    });
  },
  warning(title: string, opts: Options = {}) {
    return sonnerToast.warning(title, {
      description: opts.description,
      duration: opts.durationMs ?? 5_000,
      classNames: { toast: `${BASE} wynner-toast-test` },
    });
  },
  error(title: string, opts: Options = {}) {
    return sonnerToast.error(title, {
      description: opts.description,
      duration: opts.durationMs ?? 7_000,
      classNames: { toast: `${BASE} wynner-toast-skip` },
    });
  },
  verdict(title: string, verdict: Verdict, opts: Options = {}) {
    return sonnerToast(title, {
      description: opts.description,
      duration: opts.durationMs,
      classNames: { toast: `${BASE} ${VERDICT_CLS[verdict]}` },
    });
  },
};
