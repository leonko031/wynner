"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Shortcut = { keys: string[]; label: string };
type Group = { title: string; items: Shortcut[] };

const GROUPS: Group[] = [
  {
    title: "Global",
    items: [
      { keys: ["⌘", "K"], label: "Command palette" },
      { keys: ["?"], label: "Open this dialog" },
      { keys: ["Esc"], label: "Close any open dialog or sheet" },
      { keys: ["⌘", ","], label: "Open settings" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { keys: ["S"], label: "Start a new scan" },
      { keys: ["V"], label: "Open vault" },
      { keys: ["C"], label: "Open compare" },
      { keys: ["⌘", "1"], label: "Dashboard" },
      { keys: ["⌘", "2"], label: "Vault" },
      { keys: ["⌘", "3"], label: "Compare" },
      { keys: ["⌘", "4"], label: "Scan" },
    ],
  },
  {
    title: "Product detail",
    items: [
      { keys: ["F"], label: "Favorite current product" },
      { keys: ["E"], label: "Export current product as PNG" },
      { keys: ["R"], label: "Re-score current product" },
      { keys: ["Esc"], label: "Back to previous page" },
    ],
  },
  {
    title: "Vault",
    items: [
      { keys: ["G"], label: "Grid view" },
      { keys: ["L"], label: "List view" },
      { keys: ["/"], label: "Focus search" },
    ],
  },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShortcutsDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Move fast. Skip the mouse.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-3 space-y-5">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                {group.title}
              </h3>
              <ul className="mt-2 space-y-1.5">
                {group.items.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-center justify-between gap-3 rounded-md border border-border-soft bg-surface px-3 py-2 text-sm"
                  >
                    <span className="text-text">{s.label}</span>
                    <span className="flex items-center gap-1">
                      {s.keys.map((k, i) => (
                        <kbd
                          key={i}
                          className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border-strong bg-surface-elevated px-1.5 font-mono text-[11px] text-text"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
