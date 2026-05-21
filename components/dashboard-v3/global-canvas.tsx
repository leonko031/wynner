"use client";

/**
 * Page-level background for /dashboard.
 *
 * v1 of this file animated three blurred aurora gradients on a 90s drift
 * loop, layered an SVG turbulence noise texture, parallaxed on scroll, and
 * faded a black load curtain on mount. It looked great but the constant
 * repaints + scroll-tied transforms cost real frame budget — clicks felt
 * janky, especially on tabs that had been backgrounded.
 *
 * This version is fully static: three plain CSS radial gradients + a soft
 * vignette. Same visual mood, ~0 ongoing CPU. The LoadCurtain export is
 * gone — startup is instantaneous now.
 */
export function GlobalCanvas() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ contain: "strict" }}
    >
      {/* Base */}
      <div className="absolute inset-0 bg-[#FCFCFD] dark:bg-[#0A0B1F]" />

      {/* Three static aurora glows — same composition as before but no
          motion. Filter blur is GPU-cheap when nothing animates. */}
      <div
        className="absolute opacity-[0.08] dark:opacity-[0.18]"
        style={{
          left: "8%",
          top: "12%",
          width: "60%",
          height: "60%",
          background:
            "radial-gradient(closest-side, #5B8DFF, transparent 65%)",
          filter: "blur(90px)",
        }}
      />
      <div
        className="absolute opacity-[0.08] dark:opacity-[0.18]"
        style={{
          right: "10%",
          top: "30%",
          width: "55%",
          height: "55%",
          background:
            "radial-gradient(closest-side, #A788FF, transparent 65%)",
          filter: "blur(90px)",
        }}
      />
      <div
        className="absolute opacity-[0.08] dark:opacity-[0.18]"
        style={{
          left: "30%",
          bottom: "10%",
          width: "50%",
          height: "50%",
          background:
            "radial-gradient(closest-side, #FFB088, transparent 65%)",
          filter: "blur(90px)",
        }}
      />

      {/* Soft corner vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 60%, rgba(26,27,58,0.05) 100%)",
        }}
      />
    </div>
  );
}
