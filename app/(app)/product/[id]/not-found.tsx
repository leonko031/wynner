import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border-soft bg-surface text-text-muted">
        <Compass className="h-5 w-5" />
      </div>
      <h1 className="text-2xl font-medium tracking-tight">
        Product not found
      </h1>
      <p className="max-w-sm text-sm text-text-muted">
        We couldn&apos;t find a scan with that id. It may have been deleted or
        the link is stale.
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
