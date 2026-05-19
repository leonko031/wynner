"use client";

import { motion } from "framer-motion";

type Check = { label: string; ok: boolean };

export function evaluatePassword(pw: string): { score: number; checks: Check[]; hint: string | null } {
  const checks: Check[] = [
    { label: "8+ characters", ok: pw.length >= 8 },
    { label: "a number", ok: /\d/.test(pw) },
    { label: "an uppercase letter", ok: /[A-Z]/.test(pw) },
    { label: "a symbol", ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter((c) => c.ok).length * 25;
  const missing = checks.filter((c) => !c.ok);
  const hint = missing.length === 0 ? null : `Add ${missing[0].label} to strengthen this`;
  return { score, checks, hint };
}

type Props = { password: string };

/**
 * Aurora-filled strength meter shown beneath the password input on signup.
 * Bar fills proportionally, sub-line gently nudges the user toward the next
 * missing rule.
 */
export function PasswordStrength({ password }: Props) {
  if (!password) return null;
  const { score, hint } = evaluatePassword(password);
  const strong = score === 100;
  return (
    <div className="mt-2">
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-elevated">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background:
              "linear-gradient(90deg, #5B8DFF, #A788FF, #FF89C5)",
            boxShadow: strong ? "0 0 12px rgba(167,136,255,0.55)" : undefined,
          }}
        />
      </div>
      <div className="mt-1.5 text-[11px] text-text-dim">
        {strong ? (
          <span className="text-go">Strong password ✨</span>
        ) : (
          hint ?? "Keep going…"
        )}
      </div>
    </div>
  );
}
