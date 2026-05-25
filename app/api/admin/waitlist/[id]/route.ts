import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  action: z.enum(["confirm", "bump", "set_position", "set_source"]).optional(),
  bumpBy: z.number().int().optional(),
  newPosition: z.number().int().min(1).optional(),
  source: z.string().max(64).optional(),
});

/**
 * PATCH /api/admin/waitlist/[id]
 *
 * Admin actions per row:
 *   action=confirm       → mark email_confirmed=true + stamp confirmed_at
 *   action=bump          → bumpBy=10 → subtract 10 from position (min 1)
 *   action=set_position  → set absolute position (admin override)
 *   action=set_source    → patch source string
 *
 * DELETE /api/admin/waitlist/[id]
 *
 * Hard-delete a row. (Soft-delete would be cleaner but we don't have a
 * deleted_at column — keep it simple for the v1 dashboard.)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: { code: "no_admin_client", message: "Service role key missing" } },
      { status: 503 },
    );
  }
  const { id } = await params;

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Bad payload" } },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: row } = await admin
    .from("waitlist")
    .select("position")
    .eq("id", id)
    .maybeSingle();
  if (!row) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Row not found" } },
      { status: 404 },
    );
  }
  const current = row as { position: number };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = {};
  if (body.action === "confirm") {
    update.email_confirmed = true;
    update.email_confirmed_at = new Date().toISOString();
  } else if (body.action === "bump") {
    const delta = body.bumpBy ?? 10;
    update.position = Math.max(1, current.position - delta);
  } else if (body.action === "set_position" && body.newPosition !== undefined) {
    update.position = body.newPosition;
  } else if (body.action === "set_source" && body.source !== undefined) {
    update.source = body.source;
  } else {
    return NextResponse.json(
      { error: { code: "no_action", message: "No actionable field provided" } },
      { status: 400 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from("waitlist") as any).update(update).eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: { code: "db_error", message: error.message } },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true, update });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: { code: "no_admin_client", message: "Service role key missing" } },
      { status: 503 },
    );
  }
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("waitlist").delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: { code: "db_error", message: error.message } },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true });
}
