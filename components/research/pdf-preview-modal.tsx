"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreditsStore } from "@/lib/store/credits";
import type { DeepResearchReport } from "@/types/research";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: DeepResearchReport;
};

/**
 * Preview modal for the PDF report. Uses an inline <iframe> over a Blob URL
 * so users can flip through pages before downloading. Also offers an
 * "Email it to me" path which POSTs to /api/research/[id]/email.
 *
 * The PDF is generated on demand by POSTing the report JSON to
 * /api/research/[id]/pdf — the server renders with @react-pdf/renderer and
 * streams the Blob back. Cached in component state to avoid re-rendering.
 */
export function PdfPreviewModal({ open, onOpenChange, report }: Props) {
  const plan = useCreditsStore((s) => s.plan);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [emailing, setEmailing] = useState(false);

  const watermark = plan === "starter"
    ? "Generated on the Starter plan — upgrade to remove this watermark."
    : undefined;

  useEffect(() => {
    if (!open) return;
    if (blobUrl) return; // already generated
    let cancelled = false;

    async function generate() {
      setLoading(true);
      try {
        const res = await fetch(`/api/research/${report.id}/pdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ report, watermark }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `PDF request failed (${res.status})`);
        }
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err) {
        if (!cancelled) {
          toast.error("Could not generate PDF", {
            description: err instanceof Error ? err.message : "Unknown error",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    generate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, report.id]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  function downloadNow() {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `wynner-${report.productSnapshot.name.toLowerCase().replace(/\s+/g, "-")}-deep-research.pdf`;
    a.click();
    toast.success("PDF downloaded");
  }

  async function emailIt() {
    if (!emailValue.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setEmailing(true);
    try {
      const res = await fetch(`/api/research/${report.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, watermark, to: emailValue }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; devMode?: boolean };
      if (!res.ok) throw new Error(data.error ?? "Email failed");
      if (data.devMode) {
        toast.success("Email captured (dev mode)", {
          description: `RESEND_API_KEY not set — would have emailed ${emailValue}.`,
        });
      } else {
        toast.success(`Sent to ${emailValue}`);
      }
    } catch (err) {
      toast.error("Could not send email", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setEmailing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass-strong max-w-4xl rounded-3xl border-0 p-0"
      >
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-3">
          <DialogTitle className="text-base font-medium tracking-tight text-text">
            {report.productSnapshot.name} — Deep Research Report
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-surface-elevated hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className={cn(
            "relative flex h-[60vh] items-center justify-center bg-surface/40",
            !blobUrl && "min-h-[400px]",
          )}
        >
          {loading || !blobUrl ? (
            <div className="flex flex-col items-center gap-3 text-text-muted">
              <Loader2 className="h-6 w-6 animate-spin text-aurora-blue" />
              <span className="text-sm">Rendering your PDF…</span>
            </div>
          ) : (
            <iframe
              src={blobUrl}
              className="h-full w-full rounded-b-3xl"
              title="Wynner research PDF preview"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft px-5 py-4">
          <div className="flex items-center gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              className="h-9 w-[240px] rounded-full text-sm"
              disabled={emailing}
            />
            <Button
              onClick={emailIt}
              disabled={emailing || !emailValue}
              variant="outline"
              size="sm"
              className="rounded-full border-border-soft bg-surface/70"
            >
              {emailing ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mail className="mr-1.5 h-3.5 w-3.5" />
              )}
              Email it
            </Button>
          </div>
          <Button
            onClick={downloadNow}
            disabled={!blobUrl}
            size="sm"
            className="rounded-full"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
