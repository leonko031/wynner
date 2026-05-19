"use client";

import { useRef, useState } from "react";
import { Loader2, Sparkles, Upload, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NICHES_LIST } from "@/lib/data/niches";
import { SOURCES, type Niche, type Source } from "@/types";
import { usePreferences } from "@/lib/store/preferences";
import type { Draft } from "./live-preview-card";
import { cn } from "@/lib/utils";

type Props = {
  draft: Draft;
  setDraft: (next: Draft) => void;
  onNext: () => void;
};

type Errors = Partial<Record<keyof Draft, string>>;

const SOURCE_LABEL: Record<Source, string> = {
  aliexpress: "AliExpress",
  temu: "Temu",
  amazon: "Amazon",
  manual: "Manual",
};

export function Step1Details({ draft, setDraft, onNext }: Props) {
  const [errors, setErrors] = useState<Errors>({});
  const [uploading, setUploading] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const productScrapeEnabled = usePreferences(
    (s) => s.scrapers.productScrape,
  );

  function patch(p: Partial<Draft>) {
    const next = { ...draft, ...p };
    // Auto-fill suggested price when cost changes and price is 0
    if (
      "costUSD" in p &&
      p.costUSD !== undefined &&
      p.costUSD > 0 &&
      draft.suggestedPriceUSD === 0
    ) {
      next.suggestedPriceUSD = Number((p.costUSD * 4).toFixed(2));
    }
    setDraft(next);
  }

  function validate(): boolean {
    const e: Errors = {};
    if (!draft.name.trim()) e.name = "Required";
    if (!draft.description.trim()) e.description = "Required";
    if (!draft.image.trim()) e.image = "Image URL or upload required";
    if (draft.costUSD <= 0) e.costUSD = "Must be > 0";
    if (draft.suggestedPriceUSD <= 0) e.suggestedPriceUSD = "Must be > 0";
    if (draft.shippingCostUSD < 0) e.shippingCostUSD = "Must be ≥ 0";
    if (!draft.category) e.category = "Pick a category";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleScrapeUrl() {
    if (!scrapeUrl.trim() || scraping) return;
    setScraping(true);
    setScrapeError(null);
    try {
      const resp = await fetch("/api/scrape/product", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      });
      const data = (await resp.json()) as {
        source?: Source;
        title?: string;
        description?: string;
        priceUSD?: number;
        imageUrls?: string[];
        cached?: boolean;
        creditsUsed?: number;
        error?: string;
        code?: string;
      };
      if (!resp.ok) {
        throw new Error(data.error ?? `Scrape failed (${resp.status})`);
      }
      patch({
        name: data.title ?? draft.name,
        description: data.description ?? draft.description,
        image: data.imageUrls?.[0] ?? draft.image,
        suggestedPriceUSD:
          data.priceUSD && data.priceUSD > 0
            ? Number(data.priceUSD.toFixed(2))
            : draft.suggestedPriceUSD,
        source: (data.source as Source) ?? draft.source,
        sourceUrl: scrapeUrl.trim(),
      });
      toast.success(
        data.cached
          ? "Filled from 24h cache (no credits used)"
          : `Filled — ${data.creditsUsed ?? 0} credits used`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setScrapeError(msg);
      toast.error("Auto-fill failed", { description: msg });
    } finally {
      setScraping(false);
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch("/api/upload", { method: "POST", body: form });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `upload failed (${resp.status})`);
      }
      const data = (await resp.json()) as { url: string };
      patch({ image: data.url });
      toast.success("Image uploaded");
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "unknown",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {productScrapeEnabled && (
        <div className="glass rounded-2xl p-4"
          style={{
            borderColor: "rgba(91, 141, 255, 0.3)",
          }}
        >
          <div className="flex items-center gap-2 text-sm">
            <Wand2 className="h-3.5 w-3.5 text-info" />
            <span className="font-medium text-text">Auto-fill from URL</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              AliExpress · Temu · Amazon
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="https://www.aliexpress.com/item/…"
              inputMode="url"
              className="flex-1"
            />
            <Button
              type="button"
              size="sm"
              className="rounded-full"
              onClick={handleScrapeUrl}
              disabled={!scrapeUrl.trim() || scraping}
            >
              {scraping ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              )}
              {scraping ? "Scraping…" : "Scrape"}
            </Button>
          </div>
          {scrapeError && (
            <p className="mt-2 text-xs text-skip">{scrapeError}</p>
          )}
        </div>
      )}

      <Field label="Product name" error={errors.name}>
        <Input
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="e.g. Magnetic posture corrector belt"
        />
      </Field>

      <Field label="Description" error={errors.description}>
        <Textarea
          value={draft.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="One or two sentences describing what it does."
          rows={3}
        />
      </Field>

      <Field label="Image URL" error={errors.image}>
        <div className="flex items-center gap-2">
          <Input
            value={draft.image}
            onChange={(e) => patch({ image: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-border-soft bg-surface/60"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Upload"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Cost (USD)" error={errors.costUSD}>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={draft.costUSD || ""}
            onChange={(e) =>
              patch({ costUSD: parseFloat(e.target.value) || 0 })
            }
            className="font-mono"
            placeholder="0.00"
          />
        </Field>
        <Field label="Suggested price (USD)" error={errors.suggestedPriceUSD}>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={draft.suggestedPriceUSD || ""}
            onChange={(e) =>
              patch({ suggestedPriceUSD: parseFloat(e.target.value) || 0 })
            }
            className="font-mono"
            placeholder="0.00"
          />
        </Field>
        <Field label="Shipping (USD)" error={errors.shippingCostUSD}>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={draft.shippingCostUSD || ""}
            onChange={(e) =>
              patch({ shippingCostUSD: parseFloat(e.target.value) || 0 })
            }
            className="font-mono"
            placeholder="0.00"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Source">
          <Select
            value={draft.source}
            onValueChange={(v) => patch({ source: v as Source })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick a source" />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {SOURCE_LABEL[s as Source]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Category" error={errors.category}>
          <Select
            value={draft.category || undefined}
            onValueChange={(v) => patch({ category: v as Niche })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick a niche" />
            </SelectTrigger>
            <SelectContent>
              {NICHES_LIST.map((n) => (
                <SelectItem key={n.niche} value={n.niche}>
                  {n.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Source URL (optional)">
        <Input
          value={draft.sourceUrl}
          onChange={(e) => patch({ sourceUrl: e.target.value })}
          placeholder="https://www.aliexpress.com/item/…"
          inputMode="url"
        />
      </Field>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          size="lg"
          className="rounded-full"
          onClick={() => {
            if (validate()) onNext();
          }}
        >
          Next: choose country
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className={cn(
          "font-mono text-[10px] uppercase tracking-wider",
          error ? "text-skip" : "text-text-dim",
        )}
      >
        {label}
        {error ? ` · ${error}` : ""}
      </span>
      {children}
    </label>
  );
}
