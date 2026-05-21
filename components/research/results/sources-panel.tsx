"use client";

import { ChevronDown, ChevronRight, ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  bucketForDomain,
  groundingQualityLabel,
  type SourceBucket,
} from "@/types/grounding";
import type { DeepResearchReport } from "@/types/research";
import { cn } from "@/lib/utils";

const FILTER_LABELS: Record<"all" | SourceBucket, string> = {
  all: "All",
  reddit: "Reddit",
  amazon: "Amazon",
  news: "News",
  forums: "Forums",
  other: "Other",
};

/**
 * Bottom-of-page panel listing every web source consulted during the scan
 * + every search query Gemini executed. Filter chips by bucket. Expandable
 * "search queries" section for power users to audit the research.
 */
export function SourcesPanel({ report }: { report: DeepResearchReport }) {
  const [filter, setFilter] = useState<"all" | SourceBucket>("all");
  const [queriesOpen, setQueriesOpen] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return report.sources;
    return report.sources.filter((s) => bucketForDomain(s.domain) === filter);
  }, [filter, report.sources]);

  const tier = groundingQualityLabel(report.groundingQualityScore);

  if (report.sources.length === 0) {
    return (
      <section
        id="research-sources-panel"
        className="glass rounded-3xl border border-aurora-peach/30 bg-aurora-peach/5 p-6"
      >
        <h3 className="font-serif text-xl text-text">Sources</h3>
        <p className="mt-2 text-sm text-text-muted">
          This scan ran without web grounding. Set{" "}
          <code className="rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-[11px]">
            GEMINI_GROUNDING_ENABLED=true
          </code>{" "}
          to enable citations on future scans.
        </p>
      </section>
    );
  }

  return (
    <section
      id="research-sources-panel"
      className="glass rounded-3xl p-6 md:p-8"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl text-text">Sources & methodology</h3>
          <p className="mt-1 text-xs text-text-muted">
            <span className="font-mono tabular-nums">{report.sources.length}</span>{" "}
            web source{report.sources.length === 1 ? "" : "s"}
            {" · "}
            <span className="font-mono tabular-nums">
              {report.searchQueriesRun.length}
            </span>{" "}
            search quer{report.searchQueriesRun.length === 1 ? "y" : "ies"}
            {" · "}
            <span className="text-text">{tier} quality</span>
          </p>
        </div>
      </header>

      {/* Filter chips */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {(Object.keys(FILTER_LABELS) as ("all" | SourceBucket)[]).map((key) => {
          const count =
            key === "all"
              ? report.sources.length
              : report.sources.filter((s) => bucketForDomain(s.domain) === key)
                  .length;
          if (key !== "all" && count === 0) return null;
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                active
                  ? "border-aurora-purple/55 bg-aurora-purple/15 text-text"
                  : "border-border-soft bg-surface/70 text-text-muted hover:border-aurora-purple/45 hover:text-text",
              )}
            >
              {FILTER_LABELS[key]}{" "}
              <span className="font-mono tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Source list */}
      <ul className="mt-6 divide-y divide-border-soft">
        {filtered.map((src) => (
          <li
            key={src.index}
            className="grid grid-cols-[40px_1fr_auto] items-center gap-3 py-2.5"
          >
            <span className="font-mono text-[10px] tabular-nums text-text-dim">
              [{src.index + 1}]
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
                  alt=""
                  width={14}
                  height={14}
                  className="h-3.5 w-3.5 rounded-sm"
                />
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  {src.domain}
                </span>
              </div>
              <div className="mt-0.5 truncate text-sm text-text">{src.title}</div>
            </div>
            <a
              href={src.uri}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-7 items-center gap-1 rounded-full border border-border-soft px-2.5 text-xs text-text-muted hover:border-aurora-purple/45 hover:text-text"
            >
              <ExternalLink className="h-3 w-3" />
              Open
            </a>
          </li>
        ))}
      </ul>

      {/* Search queries (collapsible) */}
      <div className="mt-6 border-t border-border-soft pt-5">
        <button
          type="button"
          onClick={() => setQueriesOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text"
        >
          {queriesOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {queriesOpen ? "Hide" : "Show"} the{" "}
          <span className="font-mono tabular-nums">
            {report.searchQueriesRun.length}
          </span>{" "}
          search quer{report.searchQueriesRun.length === 1 ? "y" : "ies"} Gemini ran
        </button>
        {queriesOpen && (
          <ul className="mt-3 space-y-1">
            {report.searchQueriesRun.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text-muted">
                <Search className="mt-0.5 h-3 w-3 shrink-0 text-text-dim" />
                <span className="font-mono">{q}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
