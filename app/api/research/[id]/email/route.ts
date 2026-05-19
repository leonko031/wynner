import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { Resend } from "resend";
import { ResearchPdfDocument } from "@/lib/pdf/research-report";
import { buildResearchReadyEmail } from "@/lib/email/research-ready";
import type { DeepResearchReport } from "@/types/research";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/research/[id]/email
 *
 * Renders the report PDF on the server and emails it to the recipient via
 * Resend. When RESEND_API_KEY is missing, returns { devMode: true } so the
 * client surfaces a friendly "captured" message without crashing.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { report?: DeepResearchReport; to?: string; watermark?: string };
  try {
    body = (await req.json()) as { report?: DeepResearchReport; to?: string; watermark?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body.report || body.report.id !== id) {
    return NextResponse.json({ error: "report missing or id mismatch" }, { status: 400 });
  }
  if (!body.to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.to)) {
    return NextResponse.json({ error: "valid recipient email required" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    // Dev mode — just acknowledge so the UX flow is testable.
    return NextResponse.json({ ok: true, devMode: true });
  }

  const from = process.env.RESEND_FROM ?? "Wynner <onboarding@resend.dev>";
  const { subject, html, text } = buildResearchReadyEmail(body.report);

  try {
    // Render PDF
    const pdfBuf = await renderToBuffer(
      ResearchPdfDocument({ report: body.report, watermark: body.watermark }),
    );

    const filename = `wynner-${slugify(body.report.productSnapshot.name)}-deep-research.pdf`;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const send = await resend.emails.send({
      from,
      to: body.to,
      subject,
      html,
      text,
      attachments: [
        {
          filename,
          content: pdfBuf.toString("base64"),
        },
      ],
    });
    if (send.error) {
      return NextResponse.json({ error: send.error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: send.data?.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Email send failed" },
      { status: 500 },
    );
  }
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 60) || "product";
}
