"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ChevronDown, Grid2x2, List, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { NICHES_LIST } from "@/lib/data/niches";
import { COUNTRIES_LIST } from "@/lib/data/countries";
import type { Niche, SortKey, Verdict } from "@/types";
import { usePreferences, type VaultLayout } from "@/lib/store/preferences";
import { cn } from "@/lib/utils";

export type VaultFilters = {
  search: string;
  scoreRange: [number, number];
  countries: string[];
  niches: Niche[];
  verdict: Verdict | "all";
  sortBy: SortKey;
};

export const DEFAULT_FILTERS: VaultFilters = {
  search: "",
  scoreRange: [0, 100],
  countries: [],
  niches: [],
  verdict: "all",
  sortBy: "score",
};

export type FilterBarHandle = {
  focusSearch: () => void;
};

type Props = {
  value: VaultFilters;
  onChange: (next: VaultFilters) => void;
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "score", label: "Score (high → low)" },
  { value: "newest", label: "Newest" },
  { value: "margin", label: "Margin" },
  { value: "demand", label: "Demand" },
];

const VERDICTS_BAR: { value: Verdict | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "go", label: "GO" },
  { value: "test", label: "TEST" },
  { value: "risky", label: "RISKY" },
  { value: "skip", label: "SKIP" },
];

export const FilterBar = forwardRef<FilterBarHandle, Props>(function FilterBar(
  { value, onChange },
  ref,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const layout = usePreferences((s) => s.vaultLayout);
  const setLayout = usePreferences((s) => s.setVaultLayout);
  // Collapse the lower row on small screens — open via toggle button.
  const [expanded, setExpanded] = useState(false);

  useImperativeHandle(ref, () => ({
    focusSearch: () => inputRef.current?.focus(),
  }));

  // Global "/" shortcut focuses the search; let parent handle it.
  // We also support cmd+/
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "/" &&
        document.activeElement !== inputRef.current
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function patch(p: Partial<VaultFilters>) {
    onChange({ ...value, ...p });
  }

  return (
    <div className="glass sticky top-20 z-20 rounded-2xl px-3 py-3 md:top-24 md:px-4">
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-dim" />
          <Input
            ref={inputRef}
            placeholder="Search products…"
            value={value.search}
            onChange={(e) => patch({ search: e.target.value })}
            className="h-9 rounded-full border-border-soft bg-surface pl-8 text-sm"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border-soft bg-surface-elevated px-1 font-mono text-[9px] text-text-dim">
            ⌘/
          </kbd>
        </div>

        {/* Score range */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Score
          </span>
          <div className="flex w-44 items-center gap-2">
            <Slider
              min={0}
              max={100}
              step={1}
              minStepsBetweenThumbs={1}
              value={value.scoreRange}
              onValueChange={(v) =>
                patch({ scoreRange: [v[0] ?? 0, v[1] ?? 100] as [number, number] })
              }
              className="flex-1"
            />
            <span className="font-mono text-xs tabular-nums text-text-muted">
              {value.scoreRange[0]}–{value.scoreRange[1]}
            </span>
          </div>
        </div>

        {/* Sort */}
        <Select
          value={value.sortBy}
          onValueChange={(v) => patch({ sortBy: v as SortKey })}
        >
          <SelectTrigger className="h-9 w-44 rounded-full border-border-soft bg-surface text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Layout toggle */}
        <ToggleGroup
          type="single"
          value={layout}
          onValueChange={(v) => {
            if (v) setLayout(v as VaultLayout);
          }}
          className="rounded-full border border-border-soft bg-surface p-0.5"
        >
          <ToggleGroupItem
            value="grid"
            aria-label="Grid"
            className="h-7 w-7 rounded-full p-0 data-[state=on]:bg-surface-elevated"
          >
            <Grid2x2 className="h-3.5 w-3.5" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            aria-label="List"
            className="h-7 w-7 rounded-full p-0 data-[state=on]:bg-surface-elevated"
          >
            <List className="h-3.5 w-3.5" />
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Mobile-only toggle for the chips row */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="md:hidden inline-flex h-9 items-center gap-1.5 rounded-full border border-border-soft bg-surface px-3 text-xs text-text-muted"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          More
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Verdict toggles + chips — collapsed by default on mobile */}
      <div
        className={cn(
          "mt-3 flex flex-wrap items-center gap-2",
          !expanded && "hidden md:flex",
        )}
      >
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          Verdict
        </span>
        <ToggleGroup
          type="single"
          value={value.verdict}
          onValueChange={(v) => {
            if (v) patch({ verdict: v as Verdict | "all" });
          }}
          className="flex flex-wrap rounded-full border border-border-soft bg-surface p-0.5"
        >
          {VERDICTS_BAR.map((v) => (
            <ToggleGroupItem
              key={v.value}
              value={v.value}
              className="h-7 rounded-full px-3 text-[11px] font-medium data-[state=on]:bg-surface-elevated"
            >
              {v.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {/* Country chips */}
        <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
          Country
        </span>
        <div className="flex flex-wrap gap-1">
          {COUNTRIES_LIST.map((c) => {
            const active = value.countries.includes(c.code);
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  const next = active
                    ? value.countries.filter((x) => x !== c.code)
                    : [...value.countries, c.code];
                  patch({ countries: next });
                }}
                className={cn(
                  "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] transition-colors",
                  active
                    ? "border-go/40 bg-go/10 text-go"
                    : "border-border-soft bg-surface text-text-muted hover:border-border-strong hover:text-text",
                )}
              >
                <span aria-hidden>{c.flag}</span>
                {c.code}
              </button>
            );
          })}
        </div>

        {/* Niche chips */}
        <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
          Niche
        </span>
        <div className="flex flex-wrap gap-1">
          {NICHES_LIST.map((n) => {
            const active = value.niches.includes(n.niche);
            return (
              <button
                key={n.niche}
                type="button"
                onClick={() => {
                  const next = active
                    ? value.niches.filter((x) => x !== n.niche)
                    : [...value.niches, n.niche];
                  patch({ niches: next });
                }}
                className={cn(
                  "inline-flex h-6 items-center rounded-full border px-2 text-[11px] transition-colors",
                  active
                    ? "border-current"
                    : "border-border-soft bg-surface text-text-muted hover:border-border-strong hover:text-text",
                )}
                style={
                  active
                    ? {
                        backgroundColor: `${n.color}1A`,
                        color: n.color,
                        borderColor: `${n.color}55`,
                      }
                    : undefined
                }
              >
                {n.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
