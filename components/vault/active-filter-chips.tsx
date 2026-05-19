"use client";

import { X } from "lucide-react";
import { COUNTRIES } from "@/lib/data/countries";
import { NICHES } from "@/lib/data/niches";
import type { Verdict } from "@/types";
import {
  DEFAULT_FILTERS,
  type VaultFilters,
} from "./filter-bar";

const VERDICT_LABEL: Record<Verdict, string> = {
  go: "GO",
  test: "TEST",
  risky: "RISKY",
  skip: "SKIP",
};

type Props = {
  value: VaultFilters;
  onChange: (next: VaultFilters) => void;
};

export function ActiveFilterChips({ value, onChange }: Props) {
  const chips: { key: string; label: string; clear: () => void }[] = [];

  if (value.search) {
    chips.push({
      key: "search",
      label: `“${value.search}”`,
      clear: () => onChange({ ...value, search: "" }),
    });
  }
  if (value.scoreRange[0] !== 0 || value.scoreRange[1] !== 100) {
    chips.push({
      key: "score",
      label: `Score ${value.scoreRange[0]}–${value.scoreRange[1]}`,
      clear: () => onChange({ ...value, scoreRange: [0, 100] }),
    });
  }
  for (const code of value.countries) {
    const c = COUNTRIES[code];
    if (!c) continue;
    chips.push({
      key: `country-${code}`,
      label: `${c.flag} ${c.name}`,
      clear: () =>
        onChange({
          ...value,
          countries: value.countries.filter((x) => x !== code),
        }),
    });
  }
  for (const n of value.niches) {
    const meta = NICHES[n];
    if (!meta) continue;
    chips.push({
      key: `niche-${n}`,
      label: meta.label,
      clear: () =>
        onChange({ ...value, niches: value.niches.filter((x) => x !== n) }),
    });
  }
  if (value.verdict !== "all") {
    chips.push({
      key: "verdict",
      label: VERDICT_LABEL[value.verdict],
      clear: () => onChange({ ...value, verdict: "all" }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <span
          key={c.key}
          className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface px-2 py-0.5 text-[11px] text-text"
        >
          {c.label}
          <button
            type="button"
            aria-label={`Remove ${c.label}`}
            onClick={c.clear}
            className="text-text-dim hover:text-text"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onChange(DEFAULT_FILTERS)}
        className="text-[11px] text-text-muted underline-offset-2 hover:text-text hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
