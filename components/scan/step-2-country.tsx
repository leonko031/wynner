"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { COUNTRIES_LIST } from "@/lib/data/countries";
import { NICHES } from "@/lib/data/niches";
import type { Country, Niche } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  category: Niche | "";
  selected: string | undefined;
  onSelect: (code: string) => void;
  context: string;
  setContext: (next: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export function Step2Country({
  category,
  selected,
  onSelect,
  context,
  setContext,
  onBack,
  onNext,
}: Props) {
  const [showContext, setShowContext] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {COUNTRIES_LIST.map((c) => (
          <CountryCard
            key={c.code}
            country={c}
            category={category}
            active={selected === c.code}
            onClick={() => onSelect(c.code)}
          />
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <button
          type="button"
          className="font-mono text-[11px] uppercase tracking-wider text-text-muted hover:text-text"
          onClick={() => setShowContext((s) => !s)}
        >
          {showContext ? "− Hide context" : "+ Why this country? (optional)"}
        </button>
        {showContext && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            <Textarea
              className="mt-3"
              rows={3}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Optional — anything specific about this country you want the analyst to weigh."
            />
          </motion.div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button
          variant="ghost"
          size="lg"
          className="rounded-full text-text-muted"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          size="lg"
          className="rounded-full"
          disabled={!selected}
          onClick={onNext}
        >
          Next: generate
        </Button>
      </div>
    </div>
  );
}

function CountryCard({
  country,
  category,
  active,
  onClick,
}: {
  country: Country;
  category: Niche | "";
  active: boolean;
  onClick: () => void;
}) {
  const nicheHeat = category ? NICHES[category].heat : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group glass flex flex-col gap-2 rounded-2xl p-4 text-left transition-all",
        active
          ? "halo-go ring-2 ring-go/60"
          : "hover:-translate-y-0.5",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none" aria-hidden>
          {country.flag}
        </span>
        <span className="text-sm font-medium text-text">{country.name}</span>
      </div>
      <dl className="grid grid-cols-2 gap-1 font-mono text-[10px] text-text-dim">
        <dt>AOV</dt>
        <dd className="text-right text-text">€{country.avgAOV}</dd>
        <dt>Platform</dt>
        <dd className="text-right text-text">{country.topPlatform}</dd>
        {nicheHeat !== null && (
          <>
            <dt>Niche heat</dt>
            <dd className="text-right text-text">{nicheHeat}</dd>
          </>
        )}
      </dl>
    </button>
  );
}
