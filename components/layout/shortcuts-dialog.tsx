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
      { keys: ["C"], label: "Open compare" },
      { keys: ["I"], label: "Open insights" },
      { keys: ["⌘", "1"], label: "Dashboard" },
      { keys: ["⌘", "2"], label: "Compare" },
      { keys: ["⌘", "3"], label: "Insights" },
      { keys: ["⌘", "4"], label: "Scan" },
    ],
  },
  {
    title: "Dashboard",
    items: [
      { keys: ["Space"], label: "Scroll past first fold (when at top)" },
      { keys: ["⇧", "1"], label: "Jump to briefing" },
      { keys: ["⇧", "2"], label: "Jump to picks" },
      { keys: ["⇧", "3"], label: "Jump to operator pulse" },
      { keys: ["⇧", "4"], label: "Jump to trail" },
      { keys: ["⇧", "5"], label: "Jump to next move" },
      { keys: ["⇧", "B"], label: "Regenerate today's briefing" },
      { keys: ["⇧", "N"], label: "Trigger today's recommended action" },
    ],
  },
  {
    title: "Insights",
    items: [
      { keys: ["⇧", "T"], label: "Cycle time period" },
      { keys: ["⇧", "R"], label: "Regenerate strategic brief" },
      { keys: ["⇧", "E"], label: "Export insights as PDF" },
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
