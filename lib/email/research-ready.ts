import type { DeepResearchReport, Verdict } from "@/types/research";

const VERDICT_LABEL: Record<Verdict, string> = {
  go: "GO LIVE",
  test: "TEST IT",
  risky: "PROCEED WITH CARE",
  skip: "SKIP",
};
const VERDICT_COLOR: Record<Verdict, string> = {
  go: "#3DD68C",
  test: "#FFAB40",
  risky: "#FF7E5F",
  skip: "#FF5C7C",
};

/**
 * Inline HTML email for "Your Deep Research is ready". Styled to mirror the
 * app's aurora glass look as closely as a transactional email can — soft
 * background, gradient header band, glass-ish card.
 *
 * Returns { subject, html, text } so the route can choose either format.
 */
export function buildResearchReadyEmail(report: DeepResearchReport): {
  subject: string;
  html: string;
  text: string;
} {
  const v = report.finalVerdict;
  const snap = report.productSnapshot;
  const color = VERDICT_COLOR[v.verdict];

  const subject = `Your Wynner Deep Research is ready ✨`;
  const text = `Your Deep Research for "${snap.name}" is ready.

Verdict: ${VERDICT_LABEL[v.verdict]}
Sell score: ${v.sellScore}/100
Country: ${snap.countryName}

Summary:
${v.summary}

Top angle: ${v.topAngle}

Full PDF attached.

— Wynner
https://wynnerlabs.com`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escape(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#FAFBFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1A1B3A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFBFF;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:24px;border:1px solid rgba(167,136,255,0.25);overflow:hidden;box-shadow:0 24px 48px -16px rgba(91,141,255,0.15);">
          <!-- Header band -->
          <tr>
            <td style="background:linear-gradient(135deg,#5B8DFF,#A788FF,#FF89C5);padding:24px 28px;color:#FFFFFF;">
              <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.9;">WYNNER · Deep Research</div>
              <div style="margin-top:6px;font-size:22px;font-weight:600;">Your research is ready ✨</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${snap.image ? `<td valign="top" style="width:120px;padding-right:16px;"><img src="${escape(snap.image)}" alt="" width="120" height="120" style="display:block;border-radius:12px;object-fit:cover;border:1px solid rgba(167,136,255,0.30);"/></td>` : ""}
                  <td valign="top">
                    <div style="font-size:18px;font-weight:600;color:#1A1B3A;line-height:1.2;">${escape(snap.name)}</div>
                    <div style="margin-top:4px;font-size:12px;color:#5B5E8C;">${snap.countryFlag} ${escape(snap.countryName)}</div>
                    <div style="margin-top:14px;display:inline-block;padding:6px 12px;border-radius:999px;background:${color}22;color:${color};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${VERDICT_LABEL[v.verdict]} · ${v.sellScore}/100</div>
                  </td>
                </tr>
              </table>
              <div style="margin-top:20px;padding:16px;background:#F4F4FB;border-radius:12px;font-size:14px;line-height:1.55;color:#1A1B3A;">
                ${escape(v.summary)}
              </div>
              <div style="margin-top:18px;padding:14px;border-left:3px solid #A788FF;background:#F8F4FF;border-radius:8px;">
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#A788FF;">Top angle</div>
                <div style="margin-top:4px;font-size:14px;line-height:1.5;color:#1A1B3A;">${escape(v.topAngle)}</div>
              </div>
              <div style="margin-top:22px;font-size:13px;color:#5B5E8C;line-height:1.55;">
                Your full ${report.mode === "deep" ? "Deep Research" : "Standard Scan"} report is attached as a PDF — open it for personas, market detail, pricing strategy, ad angles, and the 14-day playbook.
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #E6E6F0;font-size:11px;color:#9DA0BF;text-align:center;">
              Generated ${escape(new Date(report.generatedAt).toLocaleString())} ·
              <a href="https://wynnerlabs.com/dashboard" style="color:#5B8DFF;text-decoration:none;">Open dashboard</a>
            </td>
          </tr>
        </table>
        <div style="margin-top:14px;font-size:11px;color:#9DA0BF;">© ${new Date().getFullYear()} Wynner</div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

function escape(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
