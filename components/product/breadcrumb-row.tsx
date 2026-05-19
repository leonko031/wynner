"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

export function BreadcrumbRow({ updatedAt }: { updatedAt: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 flex items-center justify-between"
    >
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm text-text-muted transition-colors hover:bg-surface hover:text-text"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Dashboard
      </Link>
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
        Updated{" "}
        {formatDistanceToNowStrict(new Date(updatedAt), { addSuffix: false })}{" "}
        ago
      </span>
    </motion.div>
  );
}
