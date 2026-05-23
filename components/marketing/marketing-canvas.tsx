"use client";

/**
 * Marketing-page background — the layered aurora environment.
 *
 * Three large drifting blobs (blue / purple / peach), an SVG noise overlay,
 * and a soft corner vignette. Visibility is intentionally higher than the
 * dashboard canvas (12% light / 22% dark vs 8/18) — landing pages need
 * more chromatic presence.
 *
 * Pure CSS animations on `transform` so the GPU does the work and the
 * canvas costs ~0 frame budget once rendered. No motion library here —
 * the framer-motion budget is reserved for above-the-fold reveal flows.
 */
export function MarketingCanvas() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ contain: "strict" }}
    >
      {/* Base color */}
      <div className="absolute inset-0 bg-[#FCFCFD] dark:bg-[#0A0B1F]" />

      {/* Aurora blobs — slow CSS drift on transform, GPU-cheap */}
      <div
        className="absolute opacity-[0.12] dark:opacity-[0.22] [animation:wynner-drift-a_64s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          left: "6%",
          top: "8%",
          width: "55vw",
          height: "55vw",
          maxWidth: "900px",
          maxHeight: "900px",
          background:
            "radial-gradient(closest-side, #5B8DFF 0%, transparent 65%)",
          filter: "blur(120px)",
          willChange: "transform",
        }}
      />
      <div
        className="absolute opacity-[0.12] dark:opacity-[0.22] [animation:wynner-drift-b_78s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          right: "8%",
          top: "28%",
          width: "50vw",
          height: "50vw",
          maxWidth: "850px",
          maxHeight: "850px",
          background:
            "radial-gradient(closest-side, #A788FF 0%, transparent 65%)",
          filter: "blur(120px)",
          willChange: "transform",
        }}
      />
      <div
        className="absolute opacity-[0.12] dark:opacity-[0.22] [animation:wynner-drift-c_92s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          left: "28%",
          bottom: "4%",
          width: "48vw",
          height: "48vw",
          maxWidth: "820px",
          maxHeight: "820px",
          background:
            "radial-gradient(closest-side, #FFB088 0%, transparent 65%)",
          filter: "blur(120px)",
          willChange: "transform",
        }}
      />

      {/* SVG noise — adds tactile grain, kills the flat web-app look */}
      <div
        className="absolute inset-0 mix-blend-overlay opacity-[0.025] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
            `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0"/></filter><rect width="240" height="240" filter="url(#n)"/></svg>`,
          )}")`,
          backgroundSize: "240px 240px",
        }}
      />

      {/* Corner vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 60%, rgba(26,27,58,0.05) 100%)",
        }}
      />

      <style jsx>{`
        @keyframes wynner-drift-a {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(60px, -30px); }
          50% { transform: translate(-40px, 40px); }
          75% { transform: translate(-30px, -20px); }
        }
        @keyframes wynner-drift-b {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-50px, 40px); }
          66% { transform: translate(30px, -30px); }
        }
        @keyframes wynner-drift-c {
          0%, 100% { transform: translate(0, 0); }
          40% { transform: translate(40px, -50px); }
          70% { transform: translate(-50px, 20px); }
        }
      `}</style>
    </div>
  );
}
