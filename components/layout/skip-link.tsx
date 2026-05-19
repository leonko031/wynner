"use client";

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[100] focus-visible:rounded-full focus-visible:border focus-visible:border-go/40 focus-visible:bg-surface focus-visible:px-3 focus-visible:py-1.5 focus-visible:text-xs focus-visible:text-go"
    >
      Skip to content
    </a>
  );
}
