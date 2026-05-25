import { requireAdmin } from "@/lib/auth/require-admin";
import { WaitlistAdminClient } from "./waitlist-admin-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /admin/waitlist — admin-only waitlist dashboard.
 *
 * Server component is a thin shell: it gates on requireAdmin() (which
 * redirects non-admins) and renders the client component. All data is
 * fetched client-side via /api/admin/waitlist/list so we can poll +
 * filter + sort without round-tripping the page.
 */
export default async function WaitlistAdminPage() {
  await requireAdmin();
  return <WaitlistAdminClient />;
}
