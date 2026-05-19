"use client";

import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductDetail } from "./product-detail";
import { useProductStore } from "@/lib/store/products";
import { useIsClient } from "@/lib/hooks";

export function ProductDetailRouter({ id }: { id: string }) {
  const isClient = useIsClient();
  const product = useProductStore((s) => s.products.find((p) => p.id === id));

  // Wait for client hydration before deciding — the store loads from localStorage on mount.
  if (!isClient) {
    return (
      <main className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="h-6 w-32 animate-pulse rounded-md bg-surface-elevated" />
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[5fr_4fr_3fr]">
          <div className="aspect-square animate-pulse rounded-2xl bg-surface-elevated" />
          <div className="h-64 animate-pulse rounded-2xl bg-surface-elevated" />
          <div className="h-64 animate-pulse rounded-2xl bg-surface-elevated" />
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border-soft bg-surface text-text-muted">
          <Compass className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-medium tracking-tight">
          Product not found
        </h1>
        <p className="max-w-sm text-sm text-text-muted">
          We couldn&apos;t find a scan with id <code className="font-mono">{id}</code>.
          It may have been deleted or the link is stale.
        </p>
        <Button asChild className="mt-2 rounded-full">
          <Link href="/dashboard">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </main>
    );
  }

  return <ProductDetail product={product} />;
}
