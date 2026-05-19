import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERDICT = {
  go: { label: "GO LIVE", color: "#00D26A" },
  test: { label: "TEST IT", color: "#F5A623" },
  risky: { label: "PROCEED WITH CARE", color: "#F97316" },
  skip: { label: "SKIP", color: "#EF4444" },
} as const;

type VerdictKey = keyof typeof VERDICT;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = (searchParams.get("name") ?? "Untitled product").slice(0, 90);
    const score = Math.max(0, Math.min(100, Number(searchParams.get("score")) || 0));
    const verdictKey = (searchParams.get("verdict") ?? "test") as VerdictKey;
    const verdict = VERDICT[verdictKey] ?? VERDICT.test;
    const niche = (searchParams.get("niche") ?? "").toString();
    const country = (searchParams.get("country") ?? "").toString();

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#0A0A0B",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 80,
            fontFamily: "system-ui, sans-serif",
            color: "#FAFAFA",
            position: "relative",
          }}
        >
          {/* Horizon glow */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 320,
              background:
                "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(0,210,106,0.20), transparent 70%)",
            }}
          />

          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#9CA3AF",
              fontSize: 20,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 10,
                background: "#00D26A",
                boxShadow: "0 0 14px #00D26A",
              }}
            />
            Wynner
          </div>

          {/* Score + verdict */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              marginTop: 24,
            }}
          >
            <div style={{ fontSize: 180, lineHeight: 1, letterSpacing: -6 }}>
              {score}
            </div>
            <div style={{ fontSize: 36, color: "#6B7280" }}>/ 100</div>
          </div>

          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              marginTop: 20,
              padding: "12px 22px",
              borderRadius: 999,
              background: `${verdict.color}26`,
              color: verdict.color,
              border: `2px solid ${verdict.color}66`,
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: 3,
            }}
          >
            {verdict.label}
          </div>

          {/* Name */}
          <div
            style={{
              display: "flex",
              marginTop: 32,
              fontSize: 56,
              lineHeight: 1.1,
              maxWidth: 1000,
              letterSpacing: -1,
            }}
          >
            {name}
          </div>

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              gap: 14,
              marginTop: 32,
              fontSize: 22,
              color: "#9CA3AF",
            }}
          >
            {niche ? (
              <div
                style={{
                  display: "flex",
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: "1px solid #2A2A2F",
                  background: "#16161A",
                }}
              >
                {niche}
              </div>
            ) : null}
            {country ? (
              <div
                style={{
                  display: "flex",
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: "1px solid #2A2A2F",
                  background: "#16161A",
                }}
              >
                {country}
              </div>
            ) : null}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "og failed" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}
