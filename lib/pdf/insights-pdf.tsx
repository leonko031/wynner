import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { PDF_COLORS, PDF_FONTS, PDF_SPACING } from "./tokens";
import {
  PdfBadge,
  PdfCard,
  PdfCallout,
  PdfFooter,
  pdfText,
} from "./components/primitives";
import { NICHES } from "@/lib/data/niches";
import { COUNTRIES } from "@/lib/data/countries";
import {
  LEVEL_TIER_META,
  type ProfileTag,
  type StrategicBrief,
  type Strength,
  type Blindspot,
  type OperatorLevelBreakdown,
} from "@/types/insights";

const styles = StyleSheet.create({
  page: {
    paddingTop: PDF_SPACING.page,
    paddingBottom: PDF_SPACING.page + 16,
    paddingHorizontal: PDF_SPACING.page,
    backgroundColor: PDF_COLORS.pageBg,
    fontFamily: PDF_FONTS.sans,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  wordmarkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PDF_COLORS.auroraPurple,
    marginRight: 6,
  },
  wordmark: {
    fontSize: 9,
    fontFamily: PDF_FONTS.sansBold,
    color: PDF_COLORS.inkPrimary,
    letterSpacing: 0.5,
  },
  h1: {
    fontSize: 26,
    fontFamily: PDF_FONTS.serifBold,
    color: PDF_COLORS.inkPrimary,
  },
  h2: {
    fontSize: 14,
    fontFamily: PDF_FONTS.serifBold,
    color: PDF_COLORS.inkPrimary,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 8,
    color: PDF_COLORS.inkWhisper,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: PDF_FONTS.sansBold,
    marginBottom: 4,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.5,
    color: PDF_COLORS.inkPrimary,
    fontFamily: PDF_FONTS.sans,
  },
  bodyMuted: {
    fontSize: 9,
    lineHeight: 1.5,
    color: PDF_COLORS.inkSoft,
  },
});

export type InsightsPdfProps = {
  firstName: string;
  generatedAt: string;
  periodLabel: string;
  operatorLevel: OperatorLevelBreakdown;
  profileTags: ProfileTag[];
  brief: StrategicBrief | null;
  strengths: Strength[];
  blindspots: Blindspot[];
  metrics: {
    totalScans: number;
    avgScore: number;
    winRate: number;
    actionRate: number;
    highestScore: number;
    creditsSpent: number;
    topNiche: string;
    topCountry: string;
  };
  topNicheRows: Array<{ label: string; count: number; avgScore: number }>;
  topCountryRows: Array<{ label: string; count: number; avgScore: number }>;
};

/**
 * Multi-page personal analytics PDF. Renders cover + strengths/blindspots +
 * metric grid + niche/country tables + the strategic brief (if present).
 *
 * Designed to be a monthly snapshot the user can save and look back on.
 */
export function InsightsPdfDocument({
  firstName,
  generatedAt,
  periodLabel,
  operatorLevel,
  profileTags,
  brief,
  strengths,
  blindspots,
  metrics,
  topNicheRows,
  topCountryRows,
}: InsightsPdfProps) {
  const date = new Date(generatedAt).toLocaleDateString();
  const tierMeta = LEVEL_TIER_META[operatorLevel.tier];

  return (
    <Document title="Wynner — Insights report">
      {/* PAGE 1 — Cover */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.wordmarkDot} />
            <Text style={styles.wordmark}>WYNNER</Text>
          </View>
          <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>
            Insights · {periodLabel}
          </Text>
        </View>

        <View style={{ marginTop: 32, marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 10,
              color: PDF_COLORS.inkSoft,
              fontFamily: PDF_FONTS.sansBold,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Operator report
          </Text>
          <Text style={[styles.h1, { marginTop: 8 }]}>
            {firstName}&apos;s scanning patterns
          </Text>
          <Text style={[styles.bodyMuted, { marginTop: 8 }]}>{date}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 16, marginTop: 12 }}>
          <PdfCard style={{ flex: 1 }}>
            <Text style={styles.sectionLabel}>Operator level</Text>
            <Text
              style={{
                fontSize: 64,
                fontFamily: PDF_FONTS.serifBold,
                color: tierMeta.color,
                lineHeight: 1.05,
              }}
            >
              {operatorLevel.level}
            </Text>
            <View style={{ marginTop: 8, alignSelf: "flex-start" }}>
              <PdfBadge color={tierMeta.color}>{tierMeta.label}</PdfBadge>
            </View>
            <Text style={[styles.bodyMuted, { marginTop: 8 }]}>
              {tierMeta.description}
            </Text>
          </PdfCard>

          <PdfCard style={{ flex: 1 }} soft>
            <Text style={styles.sectionLabel}>Self-portrait</Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 6,
              }}
            >
              {profileTags.map((t, i) => (
                <View
                  key={i}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 999,
                    borderWidth: 0.5,
                    borderColor: PDF_COLORS.borderSoft,
                    backgroundColor: PDF_COLORS.surfaceFill,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      color: PDF_COLORS.inkPrimary,
                      fontFamily: PDF_FONTS.sansBold,
                    }}
                  >
                    {t.emoji ? `${t.emoji} ` : ""}
                    {t.label}
                  </Text>
                </View>
              ))}
            </View>
          </PdfCard>
        </View>

        {/* Quick metric overview */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginTop: 16,
            flexWrap: "wrap",
          }}
        >
          <MetricBlock label="Total scans" value={metrics.totalScans.toString()} />
          <MetricBlock label="Avg score" value={metrics.avgScore.toString()} />
          <MetricBlock
            label="Win rate"
            value={`${Math.round(metrics.winRate * 100)}%`}
          />
          <MetricBlock
            label="Action rate"
            value={`${Math.round(metrics.actionRate * 100)}%`}
          />
          <MetricBlock label="Highest" value={metrics.highestScore.toString()} />
          <MetricBlock label="Credits" value={metrics.creditsSpent.toString()} />
          <MetricBlock label="Top niche" value={metrics.topNiche} wide />
          <MetricBlock label="Top country" value={metrics.topCountry} wide />
        </View>

        <PdfFooter pageNumber={1} totalPages={brief ? 4 : 3} date={date} />
      </Page>

      {/* PAGE 2 — Strengths & blindspots */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.wordmarkDot} />
            <Text style={styles.wordmark}>WYNNER</Text>
          </View>
          <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>
            Strengths & blindspots
          </Text>
        </View>

        <Text style={[styles.h2, { marginTop: 6, color: PDF_COLORS.go }]}>
          Where you shine
        </Text>
        {strengths.length === 0 ? (
          <Text style={styles.bodyMuted}>
            Not enough data yet — keep scanning to unlock detailed strengths.
          </Text>
        ) : (
          strengths.map((s, i) => (
            <PdfCard
              key={i}
              style={{ marginBottom: 10 }}
              soft
            >
              <View
                style={{
                  alignSelf: "flex-start",
                }}
              >
                <PdfBadge color={PDF_COLORS.go}>{s.category}</PdfBadge>
              </View>
              <Text
                style={[styles.body, { marginTop: 4, fontFamily: PDF_FONTS.sansBold }]}
              >
                {s.stat}
              </Text>
              <Text style={[styles.bodyMuted, { marginTop: 2 }]}>{s.insight}</Text>
            </PdfCard>
          ))
        )}

        <Text
          style={[styles.h2, { marginTop: 18, color: PDF_COLORS.risky }]}
        >
          Where you&apos;re flying blind
        </Text>
        {blindspots.length === 0 ? (
          <Text style={styles.bodyMuted}>
            Not enough data yet — keep scanning to unlock blindspot detection.
          </Text>
        ) : (
          blindspots.map((b, i) => (
            <PdfCard
              key={i}
              style={{ marginBottom: 10 }}
              soft
            >
              <View style={{ alignSelf: "flex-start" }}>
                <PdfBadge color={PDF_COLORS.risky}>{b.category}</PdfBadge>
              </View>
              <Text
                style={[styles.body, { marginTop: 4, fontFamily: PDF_FONTS.sansBold }]}
              >
                {b.gap}
              </Text>
              <Text style={[styles.bodyMuted, { marginTop: 2 }]}>{b.insight}</Text>
            </PdfCard>
          ))
        )}

        <PdfFooter pageNumber={2} totalPages={brief ? 4 : 3} date={date} />
      </Page>

      {/* PAGE 3 — Per-category tables */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.wordmarkDot} />
            <Text style={styles.wordmark}>WYNNER</Text>
          </View>
          <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>
            Per-category performance
          </Text>
        </View>

        <Text style={[styles.h2, { marginTop: 6 }]}>By niche</Text>
        <CategoryTable rows={topNicheRows} />

        <Text style={[styles.h2, { marginTop: 18 }]}>By country</Text>
        <CategoryTable rows={topCountryRows} />

        <PdfFooter pageNumber={3} totalPages={brief ? 4 : 3} date={date} />
      </Page>

      {/* PAGE 4 — Strategic brief (only if present) */}
      {brief && (
        <Page size="A4" style={styles.page}>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.wordmarkDot} />
              <Text style={styles.wordmark}>WYNNER</Text>
            </View>
            <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>
              The strategic brief
            </Text>
          </View>

          <Text style={[styles.h2, { marginTop: 6 }]}>The portrait</Text>
          <Text style={[styles.body, { marginBottom: 14 }]}>{brief.portrait}</Text>

          <Text
            style={[styles.sectionLabel, { color: PDF_COLORS.go }]}
          >
            What&apos;s working
          </Text>
          <Text style={styles.body}>{brief.whatsWorking.intro}</Text>
          {brief.whatsWorking.bullets.map((b, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
              <Text style={{ fontSize: 10, color: PDF_COLORS.go }}>•</Text>
              <Text style={[styles.body, { flex: 1 }]}>{b}</Text>
            </View>
          ))}

          <Text
            style={[
              styles.sectionLabel,
              { color: PDF_COLORS.risky, marginTop: 12 },
            ]}
          >
            What needs attention
          </Text>
          <Text style={styles.body}>{brief.needsAttention.intro}</Text>
          {brief.needsAttention.bullets.map((b, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
              <Text style={{ fontSize: 10, color: PDF_COLORS.risky }}>•</Text>
              <Text style={[styles.body, { flex: 1 }]}>{b}</Text>
            </View>
          ))}

          <View style={{ marginTop: 14 }}>
            <PdfCallout title="Hypothesis" accent={PDF_COLORS.auroraPurple}>
              {brief.hypothesis}
            </PdfCallout>
          </View>

          <Text
            style={[
              styles.sectionLabel,
              { color: PDF_COLORS.auroraBlue, marginTop: 14 },
            ]}
          >
            Plan for next month
          </Text>
          <Text style={styles.body}>{brief.planForNextMonth.intro}</Text>
          {brief.planForNextMonth.actions.map((a, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                gap: 8,
                marginTop: 6,
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  backgroundColor: `${PDF_COLORS.auroraBlue}25`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    color: PDF_COLORS.auroraBlue,
                    fontFamily: PDF_FONTS.sansBold,
                  }}
                >
                  {i + 1}
                </Text>
              </View>
              <Text style={[styles.body, { flex: 1 }]}>{a}</Text>
            </View>
          ))}

          <PdfFooter pageNumber={4} totalPages={4} date={date} />
        </Page>
      )}
    </Document>
  );
}

/* -------------------------------------------------------------------------- */

function MetricBlock({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <View
      style={{
        width: wide ? 168 : 80,
        padding: 10,
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: PDF_COLORS.borderSoft,
        backgroundColor: PDF_COLORS.surfaceFill,
      }}
    >
      <Text
        style={{
          fontSize: 7.5,
          color: PDF_COLORS.inkWhisper,
          fontFamily: PDF_FONTS.sansBold,
          textTransform: "uppercase",
          letterSpacing: 0.8,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: wide ? 12 : 16,
          marginTop: 4,
          fontFamily: PDF_FONTS.sansBold,
          color: PDF_COLORS.inkPrimary,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function CategoryTable({
  rows,
}: {
  rows: Array<{ label: string; count: number; avgScore: number }>;
}) {
  if (rows.length === 0) {
    return (
      <Text style={pdfText.bodyMuted}>No data in the selected period yet.</Text>
    );
  }
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          paddingVertical: 4,
          borderBottomWidth: 0.5,
          borderColor: PDF_COLORS.borderSoft,
        }}
      >
        <Text style={[pdfText.tableHeader, { flex: 2 }]}>Label</Text>
        <Text style={[pdfText.tableHeader, { flex: 1, textAlign: "right" }]}>
          Scans
        </Text>
        <Text style={[pdfText.tableHeader, { flex: 1, textAlign: "right" }]}>
          Avg
        </Text>
      </View>
      {rows.slice(0, 10).map((r, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            paddingVertical: 5,
            borderBottomWidth: 0.25,
            borderColor: PDF_COLORS.borderSoft,
          }}
        >
          <Text style={[pdfText.body, { flex: 2 }]}>{r.label}</Text>
          <Text
            style={[
              pdfText.body,
              { flex: 1, textAlign: "right", fontFamily: PDF_FONTS.mono },
            ]}
          >
            {r.count}
          </Text>
          <Text
            style={[
              pdfText.body,
              {
                flex: 1,
                textAlign: "right",
                fontFamily: PDF_FONTS.sansBold,
                color:
                  r.avgScore >= 80
                    ? PDF_COLORS.go
                    : r.avgScore >= 60
                      ? PDF_COLORS.test
                      : PDF_COLORS.inkSoft,
              },
            ]}
          >
            {r.avgScore}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* Re-exported helpers used by the page on the client side. */
export function nicheLabel(key: string): string {
  return NICHES[key as keyof typeof NICHES]?.label ?? key;
}
export function countryLabel(key: string): string {
  const c = COUNTRIES[key];
  return c ? `${c.flag} ${c.name}` : key;
}
