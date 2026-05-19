export function FooterZone() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8">
      <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-border-strong to-transparent" />
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
        <div className="flex items-center gap-3">
          <span className="font-mono text-text-dim">v0.1.0</span>
          <span className="text-text-dim">·</span>
          <span>Made by Leon</span>
        </div>
        <span className="font-mono text-text-dim">
          Press{" "}
          <kbd className="rounded border border-border-soft bg-surface px-1.5 py-0.5 text-[10px] text-text-muted">
            ⌘K
          </kbd>{" "}
          to search anywhere
        </span>
      </div>
    </footer>
  );
}
