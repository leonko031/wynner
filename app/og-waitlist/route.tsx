import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dynamic Open Graph image for the waitlist page.
 *
 * 1200×630. Designed to match the aurora glass aesthetic. Renders at request
 * time via next/og so we don't need to ship a static PNG — drop in a real
 * design later by replacing this route with a static file in /public.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FCFCFD",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 100,
          fontFamily: "system-ui, sans-serif",
          color: "#1A1B3A",
          position: "relative",
        }}
      >
        {/* Aurora blobs */}
        <div
          style={{
            position: "absolute",
            left: -100,
            top: -100,
            width: 700,
            height: 700,
            background:
              "radial-gradient(closest-side, rgba(91,141,255,0.25), transparent 65%)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -100,
            top: 100,
            width: 600,
            height: 600,
            background:
              "radial-gradient(closest-side, rgba(167,136,255,0.30), transparent 65%)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 200,
            bottom: -100,
            width: 600,
            height: 600,
            background:
              "radial-gradient(closest-side, rgba(255,176,136,0.25), transparent 65%)",
            filter: "blur(80px)",
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            position: "relative",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 12,
              background:
                "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
              boxShadow: "0 0 16px rgba(167,136,255,0.7)",
            }}
          />
          <span style={{ fontSize: 24, letterSpacing: 1 }}>WYNNER</span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            marginTop: 60,
            fontSize: 110,
            lineHeight: 1.0,
            letterSpacing: -3,
            position: "relative",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          Something is coming.
        </div>

        {/* Italic sub */}
        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 38,
            color: "#5B5E8C",
            fontStyle: "italic",
            position: "relative",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          An unfair advantage, quietly arriving.
        </div>

        {/* Bottom pill */}
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            marginTop: 60,
            padding: "16px 32px",
            borderRadius: 999,
            background:
              "linear-gradient(135deg, #5B8DFF, #A788FF, #FF89C5)",
            color: "#FFFFFF",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: 0.5,
            position: "relative",
            boxShadow: "0 20px 50px -10px rgba(167,136,255,0.55)",
          }}
        >
          Join the waitlist
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
