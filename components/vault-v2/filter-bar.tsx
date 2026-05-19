"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CheckSquare,
  ChevronDown,
  Globe2,
  LayoutGrid,
  Image as ImageIcon,
  List,
  Tag,
  Target,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import {
  DEFAULT_VAULT_FILTERS,
  PRODUCT_STATUSES,
  STATUS_META,
  VAULT_DENSITIES,
  VAULT_VIEWS,
  type ProductStatus,
  type VaultDensity,
  type VaultV2Filters,
  type VaultView,
} from "@/types/vault";
import { hasActiveFilters } from "@/lib/vault/url-state";
import { cn } from "@/lib/utils";
import { VERDICTS, type Verdict } from "@/types";

type Props = {
  filters: VaultV2Filters;
  onChange: (next: Partial<VaultV2Filters>) => void;
  visibleCount: number;
  totalCount: number;
};

const VERDICT_COLORS: Record<Verdict, string> = {
  go: "#3DD68C",
  test: "#FFAB40",
  risky: "#FF7E5F",
  skip: "#FF5C7C",
};

const DATE_LABELS: Record<VaultV2Filters["dateRange"], string> = {
  all: "All time",
  recent: "Last 7 days",
  week: "This week",
  month: "This month",
};

const SORT_LABELS: Record<VaultV2Filters["sortBy"], string> = {
  "score-desc": "Score (high → low)",
  "score-asc": "Score (low → high)",
  newest: "Recently added",
  lastViewed: "Last viewed",
  "margin-desc": "Margin (high → low)",
  alphabetical: "Alphabetical",
  random: "Random",
};

/**
 * Sticky filter strip. Each chip opens a popover; the dropdown sorts; the
 * view toggle on the right switches between grid / list / gallery + density.
 */
export function FilterBar({ filters, onChange, visibleCount, totalCount }: Props) {
  const active = hasActiveFilters(filters);

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-14 z-20"
    >
      <div
        className="glass-flat flex flex-wrap items-center gap-2 rounded-2xl border border-border-soft px-3 py-2.5"
      >
        {/* LEFT — filter chips */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <FilterChip
            label="Verdict"
            icon={<Target className="h-3 w-3" />}
            active={filters.verdicts.length > 0}
            summary={filters.verdicts.length > 0 ? filters.verdicts.map((v) => v.toUpperCase()).join(", ") : "All"}
          >
            <div className="space-y-1.5">
              {VERDICTS.map((v) => {
                const checked = filters.verdicts.includes(v);
                return (
                  <CheckboxRow
                    key={v}
                    label={v.toUpperCase()}
                    checked={checked}
                    color={VERDICT_COLORS[v]}
                    onChange={() => {
                      const next = checked
                        ? filters.verdicts.filter((x) => x !== v)
                        : [...filters.verdicts, v];
                      onChange({ verdicts: next });
                    }}
                  />
                );
              })}
            </div>
          </FilterChip>

          <FilterChip
            label="Score"
            icon={<span className="font-mono text-[10px] leading-none">★</span>}
            active={
              filters.scoreRange[0] !== DEFAULT_VAULT_FILTERS.scoreRange[0] ||
              filters.scoreRange[1] !== DEFAULT_VAULT_FILTERS.scoreRange[1]
            }
            summary={`${filters.scoreRange[0]}–${filters.scoreRange[1]}`}
          >
            <RangeSliderRow
              value={filters.scoreRange}
              onChange={(scoreRange) => onChange({ scoreRange })}
            />
          </FilterChip>

          <FilterChip
            label="Country"
            icon={<Globe2 className="h-3 w-3" />}
            active={filters.countries.length > 0}
            summary={
              filters.countries.length === 0
                ? "All"
                : filters.countries.length <= 3
                  ? filters.countries
                      .map((c) => `${COUNTRIES[c]?.flag ?? ""} ${c}`)
                      .join(" ")
                  : `${filters.countries.length} selected`
            }
          >
            <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
              {Object.values(COUNTRIES).map((c) => {
                const checked = filters.countries.includes(c.code);
                return (
                  <CheckboxRow
                    key={c.code}
                    label={
                      <span className="flex items-center gap-2">
                        <span aria-hidden>{c.flag}</span>
                        {c.name}
                      </span>
                    }
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? filters.countries.filter((x) => x !== c.code)
                        : [...filters.countries, c.code];
                      onChange({ countries: next });
                    }}
                  />
                );
              })}
            </div>
          </FilterChip>

          <FilterChip
            label="Niche"
            icon={<Tag className="h-3 w-3" />}
            active={filters.niches.length > 0}
            summary={
              filters.niches.length === 0
                ? "All"
                : filters.niches.length <= 3
                  ? filters.niches
                      .map((n) => NICHES[n as keyof typeof NICHES]?.label ?? n)
                      .join(", ")
                  : `${filters.niches.length} selected`
            }
          >
            <div className="grid grid-cols-2 gap-1.5">
              {Object.values(NICHES).map((n) => {
                const checked = filters.niches.includes(n.niche);
                return (
                  <CheckboxRow
                    key={n.niche}
                    label={n.label}
                    color={n.color}
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? filters.niches.filter((x) => x !== n.niche)
                        : [...filters.niches, n.niche];
                      onChange({ niches: next });
                    }}
                  />
                );
              })}
            </div>
          </FilterChip>

          <FilterChip
            label="Status"
            icon={<CheckSquare className="h-3 w-3" />}
            active={filters.statuses.length > 0}
            summary={
              filters.statuses.length === 0
                ? "All"
                : filters.statuses.map((s) => STATUS_META[s].label).join(", ")
            }
          >
            <div className="space-y-1.5">
              {PRODUCT_STATUSES.map((s) => {
                const meta = STATUS_META[s];
                const checked = filters.statuses.includes(s);
                return (
                  <CheckboxRow
                    key={s}
                    label={meta.label}
                    color={meta.color}
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? filters.statuses.filter((x) => x !== s)
                        : ([...filters.statuses, s] as ProductStatus[]);
                      onChange({ statuses: next });
                    }}
                  />
                );
              })}
            </div>
          </FilterChip>

          <FilterChip
            label="Date"
            icon={<Calendar className="h-3 w-3" />}
            active={filters.dateRange !== "all"}
            summary={DATE_LABELS[filters.dateRange]}
          >
            <div className="space-y-1">
              {(Object.keys(DATE_LABELS) as VaultV2Filters["dateRange"][]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onChange({ dateRange: d })}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs",
                    filters.dateRange === d
                      ? "bg-aurora-purple/15 text-text"
                      : "text-text-muted hover:bg-surface-elevated hover:text-text",
                  )}
                >
                  <span>{DATE_LABELS[d]}</span>
                  {filters.dateRange === d && <span className="text-aurora-purple">✓</span>}
                </button>
              ))}
            </div>
          </FilterChip>

          <AnimatePresence>
            {active && (
              <motion.button
                key="clear"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.2 }}
                type="button"
                onClick={() => onChange(DEFAULT_VAULT_FILTERS)}
                className="inline-flex items-center gap-1 rounded-full border border-aurora-peach/45 bg-aurora-peach/10 px-2.5 py-1 text-[11px] text-aurora-peach hover:bg-aurora-peach/20"
              >
                <X className="h-3 w-3" />
                Clear all
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* MIDDLE — sort */}
        <Select value={filters.sortBy} onValueChange={(v) => onChange({ sortBy: v as VaultV2Filters["sortBy"] })}>
          <SelectTrigger className="h-8 w-[180px] rounded-full border-border-soft bg-surface/70 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as VaultV2Filters["sortBy"][]).map((s) => (
              <SelectItem key={s} value={s}>{SORT_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* RIGHT — view + density */}
        <div className="flex items-center gap-1">
          <ViewToggle current={filters.view} onChange={(view) => onChange({ view })} />
          <Select
            value={filters.density}
            onValueChange={(v) => onChange({ density: v as VaultDensity })}
          >
            <SelectTrigger className="h-8 w-[120px] rounded-full border-border-soft bg-surface/70 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VAULT_DENSITIES.map((d) => (
                <SelectItem key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Count indicator */}
      <div className="mt-2 flex items-center justify-between text-[11px] text-text-dim">
        <span className="font-mono">
          Showing {visibleCount} of {totalCount} products
        </span>
      </div>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function FilterChip({
  label,
  icon,
  summary,
  active,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  summary: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-all",
            active
              ? "border-aurora-purple/55 bg-aurora-purple/10 text-text"
              : "border-border-soft bg-surface/70 text-text-muted hover:border-border-strong hover:text-text",
          )}
        >
          {icon}
          <span className="font-medium">{label}:</span>
          <span className="text-text">{summary}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="glass-strong w-64 rounded-2xl border-0 p-3"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
  color,
}: {
  label: React.ReactNode;
  checked: boolean;
  onChange: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors",
        checked
          ? "bg-aurora-purple/10 text-text"
          : "text-text-muted hover:bg-surface-elevated hover:text-text",
      )}
    >
      <span className="flex items-center gap-2">
        <span
          aria-hidden
          className="flex h-3.5 w-3.5 items-center justify-center rounded border"
          style={{
            background: checked ? color ?? "#A788FF" : "transparent",
            borderColor: checked ? color ?? "#A788FF" : "var(--surface-glass-border-strong)",
          }}
        >
          {checked && (
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white">
              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        {label}
      </span>
    </button>
  );
}

function RangeSliderRow({
  value,
  onChange,
}: {
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[11px] text-text-dim">
        <span>Min: <span className="font-mono text-text">{value[0]}</span></span>
        <span>Max: <span className="font-mono text-text">{value[1]}</span></span>
      </div>
      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={100}
          value={value[0]}
          onChange={(e) => {
            const lo = Math.min(value[1], Number(e.target.value));
            onChange([lo, value[1]]);
          }}
          className="w-full accent-aurora-purple"
        />
        <input
          type="range"
          min={0}
          max={100}
          value={value[1]}
          onChange={(e) => {
            const hi = Math.max(value[0], Number(e.target.value));
            onChange([value[0], hi]);
          }}
          className="w-full accent-aurora-purple"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(
          [
            { label: "All", v: [0, 100] as [number, number] },
            { label: "70+", v: [70, 100] as [number, number] },
            { label: "80+", v: [80, 100] as [number, number] },
            { label: "Under 50", v: [0, 49] as [number, number] },
          ]
        ).map(({ label, v }) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange(v)}
            className="rounded-full border border-border-soft bg-surface/60 px-2 py-0.5 text-[10px] text-text-muted hover:border-border-strong hover:text-text"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ViewToggle({
  current,
  onChange,
}: {
  current: VaultView;
  onChange: (v: VaultView) => void;
}) {
  const items: { v: VaultView; icon: React.ElementType; label: string }[] = [
    { v: "grid", icon: LayoutGrid, label: "Grid" },
    { v: "list", icon: List, label: "List" },
    { v: "gallery", icon: ImageIcon, label: "Gallery" },
  ];
  return (
    <div className="inline-flex items-center rounded-full border border-border-soft bg-surface/70 p-0.5">
      {items.map(({ v, icon: Icon, label }) => {
        const active = current === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full transition-all",
              active
                ? "bg-aurora-purple/15 text-text"
                : "text-text-muted hover:text-text",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

// Reference VAULT_VIEWS so it stays in the build.
void VAULT_VIEWS;
