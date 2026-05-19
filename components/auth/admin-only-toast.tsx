"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

/**
 * Watches for ?error=admin_only on any page (typically /dashboard) and
 * fires a friendly toast. We strip the param afterward so a refresh doesn't
 * re-trigger.
 *
 * Mount once in the root app layout — cheap, no-op when the param is absent.
 */
export function AdminOnlyToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (params.get("error") !== "admin_only") return;
    // Defer the toast so it fires after hydration settles.
    const t = window.setTimeout(() => {
      toast.error("Admin only", {
        description: "That area is reserved for admins. You've been bounced home.",
      });
      // Strip the param so a refresh / re-render doesn't show the toast again.
      const next = new URLSearchParams(params.toString());
      next.delete("error");
      router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`);
    }, 60);
    return () => window.clearTimeout(t);
  }, [params, router, pathname]);

  return null;
}
