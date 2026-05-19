"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowUp,
  ArrowUpRight,
  Copy,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useProductStore } from "@/lib/store/products";
import { usePreferences } from "@/lib/store/preferences";
import { RevealOnScroll } from "@/components/animated/reveal-on-scroll";
import type { CustomerVoice, Product } from "@/types";

type Props = { product: Product };

export function VoiceOfCustomer({ product }: Props) {
  const enabled = usePreferences((s) => s.redditVoiceEnabled);
  if (!enabled && !product.customerVoice) {
    return <UpsellCard />;
  }
  if (!product.customerVoice) {
    return <PromptToMineCard product={product} />;
  }
  return <VoiceContent product={product} voice={product.customerVoice} />;
}

function SectionHeader({
  voice,
}: {
  voice?: CustomerVoice;
}) {
  const subs = voice?.sourceSubreddits ?? [];
  const threads = voice?.threadCount ?? 0;
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/15 font-mono text-[11px] font-semibold text-orange-400">
            r/
          </span>
          <h2 className="text-xl font-medium tracking-tight md:text-2xl">
            Voice of customer
          </h2>
        </div>
        {voice ? (
          <p className="mt-1 text-sm text-text-muted">
            Mined from {threads} Reddit threads across{" "}
            {subs.length} subreddit{subs.length === 1 ? "" : "s"} ·{" "}
            <span className="font-mono text-xs text-text-dim">
              {formatDistanceToNow(new Date(voice.generatedAt))} ago
            </span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-text-muted">
            Real buyer language from Reddit.
          </p>
        )}
      </div>
    </header>
  );
}

function QuoteCard({
  q,
  index,
}: {
  q: CustomerVoice["realQuotes"][number];
  index: number;
}) {
  const accents = ["#00D26A", "#F5A623", "#3B82F6", "#F472B6", "#8B5CF6"];
  const accent = accents[index % accents.length];
  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative overflow-hidden rounded-xl border border-border-soft bg-surface-elevated p-5"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <span
        aria-hidden
        className="absolute right-3 top-1 select-none font-serif text-6xl leading-none text-text-dim/30"
      >
        “
      </span>
      <blockquote className="font-serif text-lg italic leading-relaxed text-text">
        “{q.quote}”
      </blockquote>
      <figcaption className="mt-3 flex items-center justify-between gap-3 text-xs text-text-muted">
        <span className="font-mono">
          r/{q.subreddit}
        </span>
        <span className="flex items-center gap-1 font-mono tabular-nums">
          <ArrowUp className="h-3 w-3" /> {q.upvotes.toLocaleString()}
        </span>
        <HoverCard openDelay={120}>
          <HoverCardTrigger asChild>
            <button
              type="button"
              className="text-text-dim underline-offset-2 hover:text-text hover:underline"
            >
              context
            </button>
          </HoverCardTrigger>
          <HoverCardContent className="max-w-xs text-xs text-text-muted">
            {q.context}
          </HoverCardContent>
        </HoverCard>
      </figcaption>
    </motion.figure>
  );
}

function BulletList({
  title,
  items,
  dotColor,
}: {
  title: string;
  items: string[];
  dotColor: string;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface/40 p-5">
      <h3 className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-text">
            <span
              aria-hidden
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
            <span className="leading-snug">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArchetypeCard({
  voice,
}: {
  voice: CustomerVoice;
}) {
  const a = voice.inferredAvatar;
  return (
    <div className="rounded-2xl border border-border-soft bg-surface/40 p-5">
      <h3 className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
        Buyer archetype
      </h3>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <Field label="Age" value={a.ageRange} />
        <Field label="Occupation" value={a.occupation} />
        <Field label="Lifestyle" value={a.lifestyle} />
        <Field label="Emotional state" value={a.emotionalState} />
      </dl>
      <div className="mt-4">
        <h4 className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          Common phrases
        </h4>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {voice.commonPhrases.map((p, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-full border border-border-soft bg-surface px-2 py-0.5 text-[11px] text-text"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-soft bg-surface px-3 py-2">
      <dt className="font-mono text-[9px] uppercase tracking-wider text-text-dim">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm leading-snug text-text">{value}</dd>
    </div>
  );
}

function AdAngles({ voice }: { voice: CustomerVoice }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface/40 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-go" />
        <h3 className="text-sm font-medium text-text">Ad angle suggestions</h3>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {voice.adAngleSuggestions.map((a, i) => (
          <div
            key={i}
            className="flex flex-col rounded-xl border border-border-soft bg-surface p-4"
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Hook {i + 1}
            </span>
            <p className="mt-2 flex-1 font-serif text-lg italic leading-snug text-text">
              “{a.hook}”
            </p>
            <p className="mt-3 text-xs leading-relaxed text-text-muted">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                Why
              </span>{" "}
              {a.whyItWorks}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-3 self-start rounded-full text-xs text-text-muted hover:bg-surface-elevated hover:text-text"
              onClick={() => {
                navigator.clipboard?.writeText(a.hook);
                toast.success("Hook copied to clipboard");
              }}
            >
              <Copy className="mr-1.5 h-3 w-3" />
              Use as prompt
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function VoiceContent({
  product,
  voice,
}: {
  product: Product;
  voice: CustomerVoice;
}) {
  const updateProduct = useProductStore((s) => s.updateProduct);
  const [remining, setRemining] = useState(false);

  async function remine() {
    if (remining) return;
    setRemining(true);
    try {
      const resp = await fetch("/api/voice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product: {
            name: product.name,
            description: product.description,
            category: product.category,
          },
          countryCode: product.targetCountry,
        }),
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `Re-mine failed (${resp.status})`);
      }
      const next = (await resp.json()) as CustomerVoice;
      updateProduct(product.id, { customerVoice: next });
      toast.success("Voice refreshed");
    } catch (e) {
      toast.error("Re-mine failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setRemining(false);
    }
  }

  return (
    <RevealOnScroll>
      <section>
        <SectionHeader voice={voice} />

        {/* Real quotes — the star */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {voice.realQuotes.map((q, i) => (
            <QuoteCard key={`${q.subreddit}-${i}`} q={q} index={i} />
          ))}
        </div>

        {/* Pains / Objections / Outcomes */}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <BulletList
            title="Top pains"
            items={voice.topPains}
            dotColor="#EF4444"
          />
          <BulletList
            title="Top objections"
            items={voice.topObjections}
            dotColor="#F5A623"
          />
          <BulletList
            title="Desired outcomes"
            items={voice.topDesiredOutcomes}
            dotColor="#00D26A"
          />
        </div>

        {/* Archetype */}
        <div className="mt-6">
          <ArchetypeCard voice={voice} />
        </div>

        {/* Ad angle suggestions */}
        <div className="mt-6">
          <AdAngles voice={voice} />
        </div>

        {/* Footer */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-text-dim">
          <span>
            Sources:{" "}
            {voice.sourceSubreddits.map((s, i) => (
              <span key={s}>
                <span className="font-mono text-text-muted">r/{s}</span>
                {i < voice.sourceSubreddits.length - 1 ? ", " : ""}
              </span>
            ))}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-border-soft bg-surface/60"
            onClick={remine}
            disabled={remining}
          >
            {remining ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            {remining ? "Re-mining…" : "Re-mine voice"}
          </Button>
        </div>
      </section>
    </RevealOnScroll>
  );
}

function UpsellCard() {
  return (
    <section>
      <SectionHeader />
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-border-soft bg-surface/40 p-6">
        <div className="flex items-center gap-2 text-text">
          <MessageSquareQuote className="h-4 w-4 text-text-muted" />
          <span className="font-medium">
            See real buyer language for this product.
          </span>
        </div>
        <p className="max-w-prose text-sm text-text-muted">
          Enable Reddit voice mining in settings to surface verbatim pains,
          objections, and the exact words your customers use — pulled from
          subreddits where they actually hang out.
        </p>
        <Button asChild size="sm" className="rounded-full">
          <Link href="/settings">
            Go to settings
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function PromptToMineCard({ product }: { product: Product }) {
  const updateProduct = useProductStore((s) => s.updateProduct);
  const [mining, setMining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (mining) return;
    setMining(true);
    setError(null);
    try {
      const resp = await fetch("/api/voice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product: {
            name: product.name,
            description: product.description,
            category: product.category,
          },
          countryCode: product.targetCountry,
        }),
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => null)) as {
          error?: string;
          code?: string;
        } | null;
        throw new Error(body?.error ?? `Mine failed (${resp.status})`);
      }
      const voice = (await resp.json()) as CustomerVoice;
      updateProduct(product.id, { customerVoice: voice });
      toast.success("Voice mined");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error("Mining failed", { description: msg });
    } finally {
      setMining(false);
    }
  }

  return (
    <section>
      <SectionHeader />
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-border-soft bg-surface/40 p-6">
        <p className="max-w-prose text-sm text-text-muted">
          Voice mining is enabled — but this product hasn&apos;t been mined yet.
          Run it now to pull real Reddit quotes, pains, and ad angles for{" "}
          <strong className="text-text">{product.name}</strong> in{" "}
          {product.targetCountry}.
        </p>
        {error && (
          <p className="text-xs text-skip">
            Last attempt failed: {error}
          </p>
        )}
        <Button
          size="sm"
          className="rounded-full"
          onClick={start}
          disabled={mining}
        >
          {mining ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          )}
          {mining ? "Mining… (~25s)" : "Mine voice now"}
        </Button>
      </div>
    </section>
  );
}
