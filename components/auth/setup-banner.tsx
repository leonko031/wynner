import { AlertCircle } from "lucide-react";

/**
 * Shown at the top of /auth when Supabase env vars aren't set. Friendly,
 * not alarming — the app still works, but real sign-in requires setup.
 */
export function SetupBanner() {
  return (
    <div
      className="mb-5 flex items-start gap-3 rounded-2xl border border-aurora-peach/40 bg-aurora-peach/10 px-4 py-3 text-xs"
      role="status"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-aurora-peach" />
      <div className="text-text">
        <div className="font-medium">Supabase isn&apos;t connected yet.</div>
        <p className="mt-1 leading-relaxed text-text-muted">
          Sign-in won&apos;t work until you set <code className="font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_URL</code> +{" "}
          <code className="font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
          <code className="font-mono text-[11px]">.env.local</code> and run the SQL in{" "}
          <code className="font-mono text-[11px]">supabase/migrations/001_auth_profiles.sql</code>. See <a className="underline" href="/docs/SETUP_GOOGLE_AUTH.md">SETUP_GOOGLE_AUTH.md</a>.
        </p>
      </div>
    </div>
  );
}
