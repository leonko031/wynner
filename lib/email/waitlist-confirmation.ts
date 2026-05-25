/**
 * Waitlist confirmation email. Inline HTML (no @react-email dependency) so
 * it's portable and tiny. Mirrors the aurora-glass look of the app within
 * the limits of email rendering.
 *
 * Returns { subject, html, text } so the route can serve either format.
 */

export function buildWaitlistConfirmationEmail(opts: {
  email: string;
  position: number;
  referralCode: string;
  origin?: string;
}): { subject: string; html: string; text: string } {
  const origin = opts.origin ?? "https://wynnerlabs.com";
  const referralUrl = `${origin}/?ref=${opts.referralCode}`;
  const subject = `You're in — Wynner waitlist position #${opts.position}`;

  const text = [
    `You're in.`,
    ``,
    `You're #${opts.position} on the Wynner waitlist.`,
    ``,
    `We're building Wynner quietly in Zagreb. Early access opens in waves —`,
    `small groups at a time, so we can listen and improve. We'll email you`,
    `when your wave is ready.`,
    ``,
    `Want to move up?`,
    `Share your link with operators who'd love this. Each signup from your`,
    `link bumps you up 5 spots.`,
    ``,
    `Your link: ${referralUrl}`,
    ``,
    `— Wynner`,
  ].join("\n");

  // Inline HTML — single-column 600px max, light cream background, aurora
  // accents. Email clients are picky about CSS, so we use inline styles
  // and tables for max compatibility.
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F4F4FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1A1B3A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F4FB;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 30px 60px -20px rgba(91,141,255,0.20);">
          <!-- Top aurora band -->
          <tr>
            <td style="height:6px;background:linear-gradient(90deg,#5B8DFF,#A788FF,#FF89C5);"></td>
          </tr>
          <tr>
            <td style="padding:36px 40px 8px 40px;">
              <!-- Wordmark -->
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:8px;background:linear-gradient(135deg,#5B8DFF,#A788FF,#FF89C5);box-shadow:0 0 12px rgba(167,136,255,0.7);"></span>
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#1A1B3A;letter-spacing:0.02em;">Wynner</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 8px 40px;">
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:42px;line-height:1.05;color:#1A1B3A;letter-spacing:-0.02em;">You're in.</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px 40px;">
              <div style="margin-top:16px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,'Liberation Mono','Courier New',monospace;font-size:13px;color:#5B5E8C;text-transform:uppercase;letter-spacing:0.14em;">
                Your position
              </div>
              <div style="margin-top:6px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:64px;line-height:1;background:linear-gradient(135deg,#5B8DFF,#A788FF,#FF89C5);-webkit-background-clip:text;background-clip:text;color:transparent;">
                #${opts.position}
              </div>
              <div style="margin-top:6px;font-size:13px;color:#5B5E8C;">on the waitlist</div>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 40px 24px 40px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#1A1B3A;">
                We're building Wynner quietly in Zagreb. Early access opens in waves &mdash; small groups at a time, so we can listen and improve. We'll email you when your wave is ready.
              </p>
            </td>
          </tr>

          <!-- Referral block -->
          <tr>
            <td style="padding:0 40px 8px 40px;">
              <div style="background:#F4F4FB;border:1px solid #E6E6F0;border-radius:16px;padding:20px;">
                <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,'Liberation Mono','Courier New',monospace;font-size:11px;color:#5B5E8C;text-transform:uppercase;letter-spacing:0.14em;">
                  Want to move up?
                </div>
                <div style="margin-top:8px;font-size:14px;line-height:1.5;color:#1A1B3A;">
                  Share your link with operators who'd love this. Each signup from your link bumps you up 5 spots.
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#5B8DFF,#A788FF,#FF89C5);border-radius:999px;">
                      <a href="${escapeAttr(referralUrl)}" style="display:inline-block;padding:11px 22px;color:#FFFFFF;font-size:14px;font-weight:500;text-decoration:none;border-radius:999px;">
                        Copy your link &nbsp;&rarr;
                      </a>
                    </td>
                  </tr>
                </table>
                <div style="margin-top:10px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,'Liberation Mono','Courier New',monospace;font-size:11px;color:#9DA0BF;word-break:break-all;">
                  ${escapeHtml(referralUrl)}
                </div>
              </div>
            </td>
          </tr>

          <!-- Bottom aurora band -->
          <tr>
            <td style="padding-top:16px;height:4px;background:linear-gradient(90deg,#FF89C5,#A788FF,#5B8DFF);"></td>
          </tr>
          <tr>
            <td style="padding:18px 40px 28px 40px;text-align:center;font-size:11px;color:#9DA0BF;line-height:1.5;">
              You're receiving this because you joined the Wynner waitlist.<br/>
              <a href="${escapeAttr(origin)}" style="color:#9DA0BF;text-decoration:underline;">wynnerlabs.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}
