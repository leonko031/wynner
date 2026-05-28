"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProductStore } from "@/lib/store/products";
import { usePreferences } from "@/lib/store/preferences";
import { COUNTRIES_LIST } from "@/lib/data/countries";
import { downloadCsv } from "@/lib/export/csv";
import {
  deleteBackup,
  listBackups,
  restoreBackup,
  takeBackup,
  type BackupSnapshot,
} from "@/lib/store/backups";
import { formatDistanceToNowStrict } from "date-fns";
import { SEED_PRODUCTS } from "@/lib/data/seed";
import { cn } from "@/lib/utils";

type HealthResp = {
  gemini: { configured: boolean };
  reddit: { configured: boolean; username: string | null };
  scrapingbee: { configured: boolean };
};

type CreditsResp = {
  configured: boolean;
  max?: number;
  used?: number;
  remaining?: number;
  resetsOn?: string;
  error?: string;
};

const SCRAPER_CARDS = [
  {
    id: "productScrape" as const,
    title: "AliExpress / Temu / Amazon",
    description: "Auto-fill product details from a URL on /scan.",
    credits: "1–2 credits per URL",
  },
  {
    id: "metaAds" as const,
    title: "Meta Ad Library",
    description: "Real competitor ad counts and copy samples for the competition pillar.",
    credits: "1 credit per scored product",
  },
  {
    id: "tiktok" as const,
    title: "TikTok trends",
    description: "Hashtag views + velocity boost the demand pillar.",
    credits: "1 credit per scored product",
  },
  {
    id: "googleTrends" as const,
    title: "Google Trends",
    description: "Free interest-over-time signal blended into the demand pillar.",
    credits: "Free — no ScrapingBee credit needed",
  },
];

export default function SettingsPage() {
  const redditEnabled = usePreferences((s) => s.redditVoiceEnabled);
  const setRedditEnabled = usePreferences((s) => s.setRedditVoiceEnabled);
  const compact = usePreferences((s) => s.compactMode);
  const setCompact = usePreferences((s) => s.setCompactMode);
  const preferPro = usePreferences((s) => s.preferProModel);
  const setPreferPro = usePreferences((s) => s.setPreferProModel);
  const premiumCursor = usePreferences((s) => s.premiumCursor);
  const setPremiumCursor = usePreferences((s) => s.setPremiumCursor);

  const products = useProductStore((s) => s.products);
  const hydrate = useProductStore((s) => s.hydrate);
  const scrapers = usePreferences((s) => s.scrapers);
  const setScraperEnabled = usePreferences((s) => s.setScraperEnabled);
  const profile = usePreferences((s) => s.profile);
  const setProfile = usePreferences((s) => s.setProfile);
  const notifications = usePreferences((s) => s.notifications);
  const setNotificationToggle = usePreferences((s) => s.setNotificationToggle);
  const defaultCountry = usePreferences((s) => s.defaultCountry);
  const setDefaultCountry = usePreferences((s) => s.setDefaultCountry);
  const debugMode = usePreferences((s) => s.debugMode);
  const setDebugMode = usePreferences((s) => s.setDebugMode);
  const startTour = usePreferences((s) => s.startTour);
  const setCompletedOnboarding = usePreferences(
    (s) => s.setCompletedOnboarding,
  );
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const refreshBackups = useCallback(() => setBackups(listBackups()), []);

  const [health, setHealth] = useState<HealthResp | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [credits, setCredits] = useState<CreditsResp | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    username?: string;
    error?: string;
  } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const refreshHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const resp = await fetch("/api/health", { cache: "no-store" });
      const data = (await resp.json()) as HealthResp;
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(refreshHealth, 0);
    return () => window.clearTimeout(t);
  }, [refreshHealth]);

  useEffect(() => {
    const t = window.setTimeout(refreshBackups, 0);
    return () => window.clearTimeout(t);
  }, [refreshBackups]);

  // Fetch ScrapingBee credit usage once health says it's configured.
  useEffect(() => {
    if (!health?.scrapingbee.configured) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/scrape/credits", { cache: "no-store" });
        const data = (await r.json()) as CreditsResp;
        if (!cancelled) setCredits(data);
      } catch {
        if (!cancelled) setCredits(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [health?.scrapingbee.configured]);

  // Default the toggle to ON the first time we detect Reddit is server-configured.
  useEffect(() => {
    if (!health?.reddit.configured) return;
    if (redditEnabled) return;
    const seen = window.localStorage.getItem("wynner.reddit.autoEnabled");
    if (seen) return;
    const t = window.setTimeout(() => {
      setRedditEnabled(true);
      window.localStorage.setItem("wynner.reddit.autoEnabled", "1");
    }, 0);
    return () => window.clearTimeout(t);
  }, [health?.reddit.configured, redditEnabled, setRedditEnabled]);

  async function testConnection() {
    setTesting(true);
    try {
      const resp = await fetch("/api/voice/test", { method: "POST" });
      const data = (await resp.json()) as {
        ok: boolean;
        username?: string;
        error?: string;
      };
      setTestResult(data);
      if (data.ok) {
        toast.success(
          data.username ? `Connected as u/${data.username}` : "Connected",
        );
      } else {
        toast.error("Connection failed", { description: data.error });
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : "Unknown error";
      setTestResult({ ok: false, error: err });
      toast.error("Connection failed", { description: err });
    } finally {
      setTesting(false);
    }
  }

  function exportData() {
    const json = JSON.stringify(
      { exportedAt: new Date().toISOString(), products },
      null,
      2,
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wynner-products-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${products.length} products`);
  }

  async function importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as { products?: unknown[] };
        if (!Array.isArray(data.products)) throw new Error("Missing 'products' array");
        useProductStore.getState().hydrate(data.products as never);
        toast.success(`Imported ${data.products.length} products`);
      } catch (e) {
        toast.error("Import failed", {
          description: e instanceof Error ? e.message : "Invalid JSON",
        });
      }
    };
    input.click();
  }

  function clearAllData() {
    window.localStorage.removeItem("wynner.products.v1");
    window.localStorage.removeItem("wynner.prefs.v1");
    window.localStorage.removeItem("wynner.reddit.autoEnabled");
    setConfirmClear(false);
    toast.success("Cleared. Reloading…");
    window.setTimeout(() => window.location.reload(), 600);
  }

  function exportCsv() {
    if (products.length === 0) {
      toast("Nothing to export");
      return;
    }
    downloadCsv(products, `wynner-products-${Date.now()}.csv`);
    toast.success(`Exported ${products.length} rows`);
  }

  function resetToSampleData() {
    // Clear products first
    window.localStorage.removeItem("wynner.products.v1");
    // Re-hydrate fresh
    hydrate(SEED_PRODUCTS);
    toast.success("Reset to sample data");
    window.setTimeout(() => window.location.reload(), 400);
  }

  function takeBackupNow() {
    const snap = takeBackup();
    if (!snap) {
      toast.error("Backup failed");
      return;
    }
    refreshBackups();
    toast.success("Snapshot saved", {
      description: `${snap.productCount} products at ${snap.takenAt.slice(0, 19)}`,
    });
  }

  function restoreFromBackup(key: string) {
    const result = restoreBackup(key);
    if (!result.ok) {
      toast.error("Restore failed", { description: result.error });
      return;
    }
    toast.success("Restored. Reloading…");
    window.setTimeout(() => window.location.reload(), 500);
  }

  function reRunTour() {
    setCompletedOnboarding(false);
    startTour();
    toast("Tour restarted — head to /dashboard");
    window.setTimeout(() => {
      window.location.href = "/dashboard";
    }, 400);
  }

  const initials =
    profile.displayName.trim().slice(0, 2).toUpperCase() || "LN";

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 md:py-12">
      <header className="mb-10 max-w-3xl">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
          Workspace
        </div>
        <h1 className="mt-3 font-serif text-4xl font-medium leading-[1.05] tracking-[-0.02em] md:text-5xl">
          Settings
        </h1>
        <p className="mt-3 text-sm text-text-muted md:text-base">
          Configure scanners, models, and your local data. Everything lives in this browser
          unless you tell it otherwise.
        </p>
      </header>

      {/* Profile */}
      <Section title="Profile" subtitle="How you show up in your own app">
        <div
          className="flex items-center gap-4 rounded-2xl border border-border-soft bg-surface-elevated/90 p-5 backdrop-blur-2xl"
          style={{ boxShadow: "0 24px 60px -24px rgba(0,0,0,0.45)" }}
        >
          <div
            className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-border-soft"
            style={{
              background:
                "linear-gradient(135deg, rgba(91,141,255,0.18), rgba(167,136,255,0.22), rgba(255,137,197,0.18))",
            }}
          >
            <span className="font-mono text-base text-text">{initials}</span>
          </div>
          <div className="flex-1">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
              Display name
            </label>
            <Input
              value={profile.displayName}
              onChange={(e) => setProfile({ displayName: e.target.value })}
              placeholder="Leon"
              className="mt-1.5"
            />
          </div>
        </div>
      </Section>

      <Separator className="my-8 bg-border-soft" />

      {/* Preferences */}
      <Section title="Preferences" subtitle="Smart defaults for new scans">
        <Row
          title="Default target country"
          description="Pre-selects this country on /scan step 2."
        >
          <Select
            value={defaultCountry}
            onValueChange={setDefaultCountry}
          >
            <SelectTrigger className="h-9 w-32 rounded-full border-border-soft bg-surface text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES_LIST.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row
          title="Re-run onboarding tour"
          description="Walk through the 4-step product tour again."
        >
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-border-soft bg-surface/60"
            onClick={reRunTour}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Re-run tour
          </Button>
        </Row>
      </Section>

      <Separator className="my-8 bg-border-soft" />

      {/* Reddit voice mining */}
      <Section title="Reddit voice mining" subtitle="Mine real buyer language for each scored product">
        <Row
          title="Enable Reddit insights"
          description={
            health?.reddit.configured
              ? "Adds a ~25s voice-mining phase to /scan and unlocks the Voice of Customer section on product pages."
              : "Reddit env vars not detected on the server. Add them to .env.local and restart."
          }
        >
          <Switch
            checked={redditEnabled && (health?.reddit.configured ?? false)}
            disabled={!health?.reddit.configured}
            onCheckedChange={setRedditEnabled}
          />
        </Row>
        <Status
          loading={healthLoading}
          ok={Boolean(health?.reddit.configured)}
          okLabel={
            health?.reddit.username
              ? `Connected as u/${health.reddit.username}`
              : "Configured"
          }
          warnLabel="Not configured — see REDDIT_SETUP.md"
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-border-soft bg-surface/60"
            disabled={!health?.reddit.configured || testing}
            onClick={testConnection}
          >
            {testing ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
            Test connection
          </Button>
          {testResult && !testing && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]",
                testResult.ok
                  ? "border-go/50 bg-go/10 text-go"
                  : "border-skip/50 bg-skip/10 text-skip",
              )}
            >
              {testResult.ok ? (
                <>
                  <Check className="h-3 w-3" />
                  {testResult.username ? `u/${testResult.username}` : "OK"}
                </>
              ) : (
                <>
                  <X className="h-3 w-3" />
                  {testResult.error}
                </>
              )}
            </span>
          )}
        </div>
        <p className="text-xs text-text-dim">
          Voice mining uses ~3 API calls per scan and may take 20–30 seconds.
        </p>
      </Section>

      <Separator className="my-8 bg-border-soft" />

      {/* Power-ups */}
      <Section
        title="Power-ups"
        subtitle="Live data scrapers — toggle individually to keep credits in check"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Status
            loading={healthLoading}
            ok={Boolean(health?.scrapingbee.configured)}
            okLabel="ScrapingBee configured"
            warnLabel="SCRAPINGBEE_API_KEY missing — see SCRAPER_SETUP.md"
          />
          {health?.scrapingbee.configured && credits && credits.remaining !== undefined && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-info/40 bg-info/10 px-2.5 py-1 font-mono text-[11px] tabular-nums text-info">
              {credits.remaining.toLocaleString()} / {(credits.max ?? 0).toLocaleString()} credits left
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {SCRAPER_CARDS.map((c) => {
            const needsScrapingBee = c.id !== "googleTrends";
            const canEnable =
              !needsScrapingBee || Boolean(health?.scrapingbee.configured);
            const enabled = Boolean(scrapers[c.id]) && canEnable;
            return (
              <div
                key={c.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-border-soft bg-surface/60 p-5"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-text">{c.title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">
                    {c.description}
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
                    {c.credits}
                  </p>
                </div>
                <Switch
                  checked={enabled}
                  disabled={!canEnable}
                  onCheckedChange={(v) => setScraperEnabled(c.id, v)}
                />
              </div>
            );
          })}
        </div>
        <p className="text-xs text-text-dim">
          A typical scan uses 3–5 credits when all toggles are on. Results cache
          for 24 hours.
        </p>
      </Section>

      <Separator className="my-8 bg-border-soft" />

      {/* AI models */}
      <Section title="AI models" subtitle="Gemini scoring and reasoning">
        <Status
          loading={healthLoading}
          ok={Boolean(health?.gemini.configured)}
          okLabel="Gemini API key detected"
          warnLabel="GEMINI_API_KEY missing — scoring falls back to heuristics"
        />
        <Row
          title="Prefer Pro model for reasoning"
          description="Pro gives sharper analyst summaries. Flash is faster and cheaper."
        >
          <Switch checked={preferPro} onCheckedChange={setPreferPro} />
        </Row>
      </Section>

      <Separator className="my-8 bg-border-soft" />

      {/* Appearance */}
      <Section title="Appearance" subtitle="Dark only for now — light theme later">
        <Row
          title="Compact mode"
          description="Denser cards across the dashboard."
        >
          <Switch checked={compact} onCheckedChange={setCompact} />
        </Row>
        <Row
          title="Premium cursor"
          description="Replaces the native cursor with an accent-colored dot + spring-tracked ring. Auto-disabled on touch devices and when prefers-reduced-motion is set."
        >
          <Switch
            checked={premiumCursor}
            onCheckedChange={setPremiumCursor}
          />
        </Row>
      </Section>

      <Separator className="my-8 bg-border-soft" />

      {/* Notifications */}
      <Section
        title="Notifications"
        subtitle="What's worth pinging you about"
      >
        <Row
          title="Inactivity reminders"
          description="A nudge after 7 quiet days with no scans."
        >
          <Switch
            checked={notifications.inactivityReminders}
            onCheckedChange={(v) =>
              setNotificationToggle("inactivityReminders", v)
            }
          />
        </Row>
        <Row
          title="Milestone celebrations"
          description="Cheers when you hit a new high score or 100 scans."
        >
          <Switch
            checked={notifications.milestoneCelebrations}
            onCheckedChange={(v) =>
              setNotificationToggle("milestoneCelebrations", v)
            }
          />
        </Row>
        <Row
          title="Scan completion"
          description="Quiet notification when a fresh scan lands."
        >
          <Switch
            checked={notifications.scanComplete}
            onCheckedChange={(v) => setNotificationToggle("scanComplete", v)}
          />
        </Row>
      </Section>

      <Separator className="my-8 bg-border-soft" />

      {/* Advanced */}
      <Section title="Advanced" subtitle="Developer-facing toggles">
        <Row
          title="Debug mode"
          description="Verbose console logging and store-state dumps."
        >
          <Switch checked={debugMode} onCheckedChange={setDebugMode} />
        </Row>
        <p className="text-xs text-text-dim">
          Tip: click the Wynner logo 5 times to open the raw Zustand store
          viewer.
        </p>
      </Section>

      <Separator className="my-8 bg-border-soft" />

      {/* Data */}
      <Section title="Data" subtitle="Everything is stored locally in this browser">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-border-soft bg-surface/60"
            onClick={exportData}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export JSON ({products.length})
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-border-soft bg-surface/60"
            onClick={exportCsv}
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-border-soft bg-surface/60"
            onClick={importData}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Import JSON
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-border-soft bg-surface/60"
            onClick={resetToSampleData}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset to sample data
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full text-skip hover:bg-skip/10 hover:text-skip"
            onClick={() => setConfirmClear(true)}
          >
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
            Clear all data
          </Button>
        </div>

        {/* Backups */}
        <div
          className="mt-5 rounded-2xl border border-border-soft bg-surface-elevated/90 p-5 backdrop-blur-2xl"
          style={{ boxShadow: "0 24px 60px -24px rgba(0,0,0,0.45)" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-text">
                Local backups
              </div>
              <p className="mt-1 text-xs text-text-muted">
                A snapshot is taken automatically every 24 hours. Last 7 are
                kept.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-border-soft bg-surface/60"
              onClick={takeBackupNow}
            >
              Take snapshot now
            </Button>
          </div>
          {backups.length === 0 ? (
            <p className="mt-4 text-xs text-text-dim">No snapshots yet.</p>
          ) : (
            <ul className="mt-4 space-y-1.5">
              {backups.map((b) => (
                <li
                  key={b.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border-soft bg-surface/60 px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-text">
                      {b.takenAt.slice(0, 19).replace("T", " ")}
                    </div>
                    <div className="font-mono text-[10px] text-text-dim">
                      {b.productCount} products ·{" "}
                      {b.takenAt
                        ? `${formatDistanceToNowStrict(new Date(b.takenAt))} ago`
                        : "unknown"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 rounded-full text-text-muted hover:text-text"
                      onClick={() => restoreFromBackup(b.key)}
                    >
                      Restore
                    </Button>
                    <button
                      type="button"
                      aria-label="Delete snapshot"
                      onClick={() => {
                        deleteBackup(b.key);
                        refreshBackups();
                      }}
                      className="text-text-dim hover:text-skip"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all local data?</DialogTitle>
            <DialogDescription>
              This removes every scored product and preference from this
              browser. The seed dataset will repopulate on next reload.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={clearAllData}>
              Clear everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="font-serif text-2xl font-medium tracking-[-0.01em] md:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  );
}

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border-soft bg-surface/60 p-5">
      <div>
        <div className="text-sm font-medium text-text">{title}</div>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-text-muted">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Status({
  loading,
  ok,
  okLabel,
  warnLabel,
}: {
  loading: boolean;
  ok: boolean;
  okLabel: string;
  warnLabel: string;
}) {
  if (loading)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface px-2.5 py-1 text-[11px] text-text-muted">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking…
      </span>
    );
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]",
        ok
          ? "border-go/50 bg-go/10 text-go"
          : "border-test/50 bg-test/10 text-test",
      )}
    >
      {ok ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {ok ? okLabel : warnLabel}
    </span>
  );
}
