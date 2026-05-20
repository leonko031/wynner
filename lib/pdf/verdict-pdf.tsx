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
  PdfCallout,
  PdfCard,
  PdfFooter,
  pdfText,
} from "./components/primitives";
import type { JudgeVerdict } from "@/types/compare";
import type { Product, Verdict } from "@/types";

const VERDICT_META: Record<Verdict, { label: string; color: string }> = {
  go: { label: "GO LIVE", color: PDF_COLORS.go },
  test: { label: "TEST IT", color: PDF_COLORS.test },
  risky: { label: "PROCEED WITH CARE", color: PDF_COLORS.risky },
  skip: { label: "SKIP", color: PDF_COLORS.skip },
};

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
  declaration: {
    fontSize: 22,
    fontFamily: PDF_FONTS.serifBold,
    color: PDF_COLORS.inkPrimary,
    lineHeight: 1.25,
  },
  sectionLabel: {
    fontSize: 8,
    color: PDF_COLORS.inkWhisper,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: PDF_FONTS.sansBold,
    marginBottom: 4,
  },
  bullet: {
    fontSize: 10,
    lineHeight: 1.5,
    color: PDF_COLORS.inkPrimary,
    marginTop: 4,
  },
});

export type VerdictPdfProps = {
  verdict: JudgeVerdict;
  products: Product[];
  generatedAt: string;
};

/**
 * Single-page A4 PDF capturing the judge's verdict. Designed to print
 * cleanly + survive a Slack screenshot.
 */
export function VerdictPdfDocument({
  verdict,
  products,
  generatedAt,
}: VerdictPdfProps) {
  const winner = products.find((p) => p.id === verdict.winnerProductId);
  const winnerVerdict = winner ? VERDICT_META[winner.verdict] : null;
  const date = new Date(generatedAt).toLocaleDateString();

  return (
    <Document title="Wynner — Comparison verdict">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.wordmarkDot} />
            <Text style={styles.wordmark}>WYNNER</Text>
          </View>
          <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>
            The judge&apos;s verdict
          </Text>
        </View>

        {/* Declaration */}
        <View style={{ marginBottom: 18 }}>
          <Text style={styles.declaration}>{verdict.declaration}</Text>
        </View>

        {/* Participants */}
        <PdfCard soft style={{ marginBottom: 14 }}>
          <Text style={styles.sectionLabel}>Participants ({products.length})</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {products.map((p) => {
              const isWinner = p.id === verdict.winnerProductId;
              const v = VERDICT_META[p.verdict];
              return (
                <View
                  key={p.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: isWinner
                      ? PDF_COLORS.go
                      : PDF_COLORS.borderSoft,
                    backgroundColor: isWinner
                      ? `${PDF_COLORS.go}15`
                      : PDF_COLORS.surfaceFill,
                  }}
                >
                  {isWinner && (
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: PDF_FONTS.sansBold,
                        color: PDF_COLORS.go,
                      }}
                    >
                      ★
                    </Text>
                  )}
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: isWinner ? PDF_FONTS.sansBold : PDF_FONTS.sans,
                      color: PDF_COLORS.inkPrimary,
                    }}
                  >
                    {p.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 9,
                      fontFamily: PDF_FONTS.mono,
                      color: v.color,
                    }}
                  >
                    {p.sellScore}
                  </Text>
                </View>
              );
            })}
          </View>
        </PdfCard>

        {/* Why */}
        <View style={{ marginBottom: 14 }}>
          <Text style={[styles.sectionLabel, { color: PDF_COLORS.go }]}>
            Why
          </Text>
          {verdict.whyBullets.map((b, i) => (
            <View
              key={i}
              style={{ flexDirection: "row", gap: 8, marginTop: 4 }}
            >
              <Text style={{ fontSize: 10, color: PDF_COLORS.go }}>•</Text>
              <Text style={[pdfText.body, { flex: 1 }]}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Tradeoffs */}
        <View style={{ marginBottom: 14 }}>
          <Text style={[styles.sectionLabel, { color: PDF_COLORS.risky }]}>
            The tradeoffs
          </Text>
          {verdict.tradeoffBullets.map((b, i) => (
            <View
              key={i}
              style={{ flexDirection: "row", gap: 8, marginTop: 4 }}
            >
              <Text style={{ fontSize: 10, color: PDF_COLORS.risky }}>•</Text>
              <Text style={[pdfText.body, { flex: 1 }]}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Recommendation */}
        <PdfCallout title="What an operator should do" accent={PDF_COLORS.auroraPurple}>
          {verdict.recommendation}
        </PdfCallout>

        {/* Footer summary */}
        <View
          style={{
            position: "absolute",
            bottom: 56,
            left: 32,
            right: 32,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <View>
            <Text style={styles.sectionLabel}>Winner</Text>
            <Text style={[pdfText.body, { fontFamily: PDF_FONTS.sansBold, fontSize: 12 }]}>
              {winner?.name ?? "(unknown)"}
            </Text>
            {winnerVerdict && (
              <View style={{ marginTop: 6, alignSelf: "flex-start" }}>
                <PdfBadge color={winnerVerdict.color}>{winnerVerdict.label}</PdfBadge>
              </View>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.sectionLabel}>Confidence</Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: PDF_FONTS.sansBold,
                color:
                  verdict.confidenceLevel === "high"
                    ? PDF_COLORS.go
                    : verdict.confidenceLevel === "medium"
                      ? PDF_COLORS.test
                      : PDF_COLORS.inkWhisper,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {verdict.confidenceLevel}
            </Text>
          </View>
        </View>

        <PdfFooter pageNumber={1} totalPages={1} date={date} />
      </Page>
    </Document>
  );
}
