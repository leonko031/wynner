# Branded email templates

Paste these into **Supabase Dashboard → Authentication → Email Templates**
to replace the defaults with Wynner-branded HTML.

Supabase substitutes the `{{ .ConfirmationURL }}` and `{{ .Token }}` tokens
when sending — leave those exactly as written.

---

## 1. Confirm signup

```html
<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#FAFBFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1A1B3A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFBFF;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:24px;border:1px solid rgba(167,136,255,0.25);overflow:hidden;box-shadow:0 24px 48px -16px rgba(91,141,255,0.15);">
        <tr><td style="background:linear-gradient(135deg,#5B8DFF,#A788FF,#FF89C5);padding:24px 28px;color:#FFFFFF;">
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.9;">WYNNER</div>
          <div style="margin-top:6px;font-size:22px;font-weight:600;">Confirm your email ✨</div>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="font-size:16px;line-height:1.55;color:#1A1B3A;margin:0 0 16px;">Welcome to Wynner — the dropshipping intelligence dashboard that knows before you launch.</p>
          <p style="font-size:14px;line-height:1.55;color:#5B5E8C;margin:0 0 24px;">Tap the button below to confirm your email and unlock your dashboard.</p>
          <p style="text-align:center;margin:24px 0;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#5B8DFF,#A788FF,#FF89C5);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:999px;box-shadow:0 12px 28px -8px rgba(91,141,255,0.55);">Confirm your email</a>
          </p>
          <p style="font-size:12px;line-height:1.55;color:#9DA0BF;margin:16px 0 0;">Or paste this link into your browser:<br/><a href="{{ .ConfirmationURL }}" style="color:#5B8DFF;word-break:break-all;">{{ .ConfirmationURL }}</a></p>
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #E6E6F0;font-size:11px;color:#9DA0BF;text-align:center;">
          Didn't sign up? Ignore this email and we'll forget about it.
        </td></tr>
      </table>
      <div style="margin-top:14px;font-size:11px;color:#9DA0BF;">© 2026 Wynner · <a href="https://wynnerlabs.com" style="color:#5B8DFF;text-decoration:none;">wynnerlabs.com</a></div>
    </td></tr>
  </table>
</body>
</html>
```

**Subject**: `Confirm your Wynner email`

---

## 2. Magic link

```html
<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#FAFBFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1A1B3A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFBFF;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:24px;border:1px solid rgba(167,136,255,0.25);overflow:hidden;box-shadow:0 24px 48px -16px rgba(91,141,255,0.15);">
        <tr><td style="background:linear-gradient(135deg,#5B8DFF,#A788FF,#FF89C5);padding:24px 28px;color:#FFFFFF;">
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.9;">WYNNER</div>
          <div style="margin-top:6px;font-size:22px;font-weight:600;">Sign in to Wynner</div>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="font-size:16px;line-height:1.55;color:#1A1B3A;margin:0 0 16px;">Tap below to sign in. No password needed.</p>
          <p style="font-size:14px;line-height:1.55;color:#5B5E8C;margin:0 0 24px;">The link expires in 60 minutes. If you didn't ask for it, you can safely ignore this email.</p>
          <p style="text-align:center;margin:24px 0;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#5B8DFF,#A788FF,#FF89C5);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:999px;box-shadow:0 12px 28px -8px rgba(91,141,255,0.55);">Sign in</a>
          </p>
          <p style="font-size:12px;line-height:1.55;color:#9DA0BF;margin:16px 0 0;">Or paste this link into your browser:<br/><a href="{{ .ConfirmationURL }}" style="color:#5B8DFF;word-break:break-all;">{{ .ConfirmationURL }}</a></p>
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #E6E6F0;font-size:11px;color:#9DA0BF;text-align:center;">
          © 2026 Wynner · <a href="https://wynnerlabs.com" style="color:#5B8DFF;text-decoration:none;">wynnerlabs.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

**Subject**: `Your Wynner sign-in link`

---

## 3. Reset password

```html
<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#FAFBFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1A1B3A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFBFF;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:24px;border:1px solid rgba(167,136,255,0.25);overflow:hidden;box-shadow:0 24px 48px -16px rgba(91,141,255,0.15);">
        <tr><td style="background:linear-gradient(135deg,#5B8DFF,#A788FF,#FF89C5);padding:24px 28px;color:#FFFFFF;">
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.9;">WYNNER</div>
          <div style="margin-top:6px;font-size:22px;font-weight:600;">Reset your password</div>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="font-size:16px;line-height:1.55;color:#1A1B3A;margin:0 0 16px;">Tap below to set a new password.</p>
          <p style="font-size:14px;line-height:1.55;color:#5B5E8C;margin:0 0 24px;">If you didn't request this, you can safely ignore this email. Your password won't change unless you complete the flow.</p>
          <p style="text-align:center;margin:24px 0;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#5B8DFF,#A788FF,#FF89C5);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:999px;box-shadow:0 12px 28px -8px rgba(91,141,255,0.55);">Reset password</a>
          </p>
          <p style="font-size:12px;line-height:1.55;color:#9DA0BF;margin:16px 0 0;">Or paste this link into your browser:<br/><a href="{{ .ConfirmationURL }}" style="color:#5B8DFF;word-break:break-all;">{{ .ConfirmationURL }}</a></p>
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #E6E6F0;font-size:11px;color:#9DA0BF;text-align:center;">
          For your security, this link expires in 1 hour.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

**Subject**: `Reset your Wynner password`

---

## 4. Email change confirmation

```html
<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#FAFBFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1A1B3A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFBFF;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:24px;border:1px solid rgba(167,136,255,0.25);overflow:hidden;box-shadow:0 24px 48px -16px rgba(91,141,255,0.15);">
        <tr><td style="background:linear-gradient(135deg,#5B8DFF,#A788FF,#FF89C5);padding:24px 28px;color:#FFFFFF;">
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.9;">WYNNER</div>
          <div style="margin-top:6px;font-size:22px;font-weight:600;">Confirm your new email</div>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="font-size:16px;line-height:1.55;color:#1A1B3A;margin:0 0 16px;">Confirm your new email address to keep your account secure.</p>
          <p style="text-align:center;margin:24px 0;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#5B8DFF,#A788FF,#FF89C5);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:999px;box-shadow:0 12px 28px -8px rgba(91,141,255,0.55);">Confirm new email</a>
          </p>
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #E6E6F0;font-size:11px;color:#9DA0BF;text-align:center;">
          Didn't request this change? Reply to this email and we'll lock the account.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

**Subject**: `Confirm your new Wynner email`

---

## How to apply

For each template:

1. Open **Supabase Dashboard → Authentication → Email Templates**
2. Pick the template (e.g. "Confirm signup")
3. Replace the **Subject** line with the one above
4. Replace the **Body (HTML)** with the HTML above
5. **Save**

Test by triggering the corresponding flow:
- **Confirm signup**: create a new account
- **Magic link**: click "Send me a magic link" on `/auth`
- **Reset password**: visit `/auth/reset`
- **Email change**: change your email in `/settings`

> The default Supabase sender is `noreply@mail.app.supabase.io`. To use your
> own from-address, configure SMTP under **Settings → Auth → SMTP Settings**.
