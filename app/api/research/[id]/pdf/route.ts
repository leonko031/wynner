import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResearchPdfDocument } from "@/lib/pdf/research-report";
import type { DeepResearchReport } from "@/types/research";

// PDF rendering must happen in Node — uses native streams + buffers.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/research/[id]/pdf
 *
 * The report payload is sent in the request body because all our research
 * lives in the client's local Zustand store (no auth / no DB). The server
 * accepts the report, renders the PDF, and streams it back.
 *
 * GET requests are rejected — without a DB we have no way to look up by id.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { report?: DeepResearchReport; watermark?: string };
  try {
    body = (await req.json()) as { report?: DeepResearchReport; watermark?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body.report || body.report.id !== id) {
    return NextResponse.json({ error: "report payload missing or id mismatch" }, { status: 400 });
  }

  try {
    const buffer = await renderToBuffer(
      ResearchPdfDocument({ report: body.report, watermark: body.watermark }),
    );
    const slug = slugify(body.report.productSnapshot.name);
    const filename = `wynner-${slug}-deep-research-${dateSlug(body.report.generatedAt)}.pdf`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed" },
      { status: 500 },
    );
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "product";
}

function dateSlug(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
