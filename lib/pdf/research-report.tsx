import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  PdfBadge,
  PdfCallout,
  PdfCard,
  PdfFooter,
  PdfPillarBar,
  pdfText,
} from "./components/primitives";
import { PDF_COLORS, PDF_FONTS, PDF_SPACING } from "./tokens";
import type {
  DeepResearchReport,
  Persona,
  Verdict,
} from "@/types/research";

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
    marginBottom: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: PDF_FONTS.serifBold,
    color: PDF_COLORS.inkPrimary,
    marginBottom: 10,
  },
  miniLabel: {
    fontSize: 8,
    color: PDF_COLORS.inkWhisper,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: PDF_FONTS.sansBold,
    marginBottom: 4,
  },
});

/**
 * Reusable header strip at the top of every content page.
 */
function PageHeader({ title }: { title: string }) {
  return (
    <View style={styles.headerRow}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={styles.wordmarkDot} />
        <Text style={styles.wordmark}>WYNNER</Text>
      </View>
      <Text style={[styles.miniLabel, { marginBottom: 0 }]}>{title}</Text>
    </View>
  );
}

/* --------------------------------------------------------------------------
 * COVER
 * -------------------------------------------------------------------------- */
function CoverPage({ report }: { report: DeepResearchReport }) {
  const v = report.finalVerdict;
  const verdict = VERDICT_META[v.verdict];
  const snap = report.productSnapshot;
  const generatedDate = new Date(report.generatedAt).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <Page size="A4" style={styles.page}>
      {/* Top wordmark + report subtitle */}
      <View style={[styles.headerRow, { marginBottom: 40 }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={styles.wordmarkDot} />
          <Text style={styles.wordmark}>WYNNER</Text>
        </View>
        <Text style={[styles.miniLabel, { marginBottom: 0 }]}>Deep Research Report</Text>
      </View>

      {/* Center — product image */}
      <View style={{ alignItems: "center", marginBottom: 28 }}>
        {snap.image ? (
          <View
            style={{
              width: 280,
              height: 280,
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: `${verdict.color}55`,
            }}
          >
            <PdfImage src={snap.image} style={{ width: 280, height: 280, objectFit: "cover" }} />
          </View>
        ) : (
          <View
            style={{
              width: 280, height: 280, borderRadius: 16,
              backgroundColor: PDF_COLORS.surfaceSoft,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Text style={[pdfText.body, { color: PDF_COLORS.inkWhisper }]}>(no image)</Text>
          </View>
        )}
      </View>

      {/* Product name */}
      <Text
        style={{
          fontSize: 28,
          fontFamily: PDF_FONTS.serifBold,
          color: PDF_COLORS.inkPrimary,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {snap.name}
      </Text>

      {/* Country */}
      <Text
        style={{
          fontSize: 12,
          color: PDF_COLORS.inkSoft,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        {snap.countryFlag}  {snap.countryName}
      </Text>

      {/* Big score */}
      <Text
        style={{
          fontSize: 84,
          fontFamily: PDF_FONTS.serifBold,
          color: verdict.color,
          textAlign: "center",
          letterSpacing: -2,
          marginBottom: 4,
        }}
      >
        {v.sellScore}
      </Text>

      {/* Verdict badge */}
      <View style={{ alignItems: "center", marginBottom: 8 }}>
        <PdfBadge color={verdict.color}>{verdict.label}</PdfBadge>
      </View>

      {/* Cover footer */}
      <View
        style={{
          position: "absolute",
          bottom: 32,
          left: 0, right: 0,
          alignItems: "center",
        }}
      >
        <Text style={[styles.miniLabel, { color: PDF_COLORS.inkWhisper }]}>
          Prepared on {generatedDate}
        </Text>
        <Text style={[styles.miniLabel, { color: PDF_COLORS.inkWhisper, marginTop: 4 }]}>
          wynner.app · Deep Research
        </Text>
      </View>
    </Page>
  );
}

/* --------------------------------------------------------------------------
 * Executive summary page
 * -------------------------------------------------------------------------- */
function SummaryPage({ report, pageNumber, totalPages, date }: { report: DeepResearchReport; pageNumber: number; totalPages: number; date: string }) {
  const v = report.finalVerdict;
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Executive Summary" />
      <Text style={styles.sectionTitle}>The TL;DR</Text>
      <PdfCard>
        <Text style={[pdfText.body, { marginBottom: 10 }]}>{v.summary}</Text>
        <Text style={styles.miniLabel}>Five-pillar score</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {(["margin", "marketFit", "demand", "competition", "creative"] as const).map((k) => {
            const value = v.pillars[k];
            const color =
              value >= 75 ? PDF_COLORS.go : value >= 50 ? PDF_COLORS.test : PDF_COLORS.risky;
            return (
              <PdfPillarBar
                key={k}
                label={k === "marketFit" ? "Market fit" : k[0].toUpperCase() + k.slice(1)}
                value={value}
                color={color}
                width={230}
              />
            );
          })}
        </View>
      </PdfCard>

      <View style={{ height: 10 }} />
      <PdfCallout title="Top creative angle">{v.topAngle}</PdfCallout>

      <View style={{ height: 10 }} />
      <PdfCard soft>
        <Text style={styles.miniLabel}>Wynner says…</Text>
        <Text style={pdfText.body}>
          {v.verdict === "go"
            ? "Strong signals across the board. Move to test budget without overthinking it."
            : v.verdict === "test"
              ? "Worth a tight 14-day test — watch margin and CPA closely before scaling."
              : v.verdict === "risky"
                ? "Multiple yellow flags. Fix the highest-severity red flag before spending."
                : "Better candidates exist this month. Skip unless you've found a unique angle."}
        </Text>
      </PdfCard>

      <PdfFooter pageNumber={pageNumber} totalPages={totalPages} date={date} />
    </Page>
  );
}

/* --------------------------------------------------------------------------
 * Product page
 * -------------------------------------------------------------------------- */
function ProductPage({ report, pageNumber, totalPages, date }: { report: DeepResearchReport; pageNumber: number; totalPages: number; date: string }) {
  const snap = report.productSnapshot;
  const pi = report.productIntelligence;
  const margin = snap.suggestedPriceUSD - snap.costUSD;
  const markup = snap.suggestedPriceUSD / Math.max(0.01, snap.costUSD);
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="The Product" />
      <Text style={styles.sectionTitle}>{snap.name}</Text>

      <View style={{ flexDirection: "row", gap: 14 }}>
        {snap.image && (
          <View style={{ width: 160, height: 160, borderRadius: 10, overflow: "hidden", borderWidth: 0.5, borderColor: PDF_COLORS.borderSoft }}>
            <PdfImage src={snap.image} style={{ width: 160, height: 160, objectFit: "cover" }} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={pdfText.body}>{snap.description}</Text>
          {pi && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.miniLabel}>What it is</Text>
              <Text style={pdfText.body}>{pi.primaryUseCase}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ height: 12 }} />
      <PdfCard>
        <Text style={styles.miniLabel}>Pricing math</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
          <Stat label="Cost" value={`$${snap.costUSD.toFixed(2)}`} />
          <Stat label="Selling price" value={`$${snap.suggestedPriceUSD.toFixed(2)}`} />
          <Stat label="Gross margin" value={`$${margin.toFixed(2)}`} />
          <Stat label="Markup" value={`${markup.toFixed(1)}×`} />
        </View>
      </PdfCard>

      {pi && (
        <View style={{ marginTop: 12, flexDirection: "row", gap: 10 }}>
          <PdfCard style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>Novelty</Text>
            <Text style={{ fontSize: 22, fontFamily: PDF_FONTS.serifBold, color: PDF_COLORS.auroraBlue }}>
              {pi.noveltyScore}/100
            </Text>
          </PdfCard>
          <PdfCard style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>Viral potential</Text>
            <Text style={{ fontSize: 22, fontFamily: PDF_FONTS.serifBold, color: PDF_COLORS.auroraPink }}>
              {pi.viralPotential}/100
            </Text>
          </PdfCard>
        </View>
      )}

      {pi?.problemSolved && (
        <View style={{ marginTop: 12 }}>
          <PdfCallout title="The problem it solves" accent={PDF_COLORS.auroraBlue}>
            {pi.problemSolved}
          </PdfCallout>
        </View>
      )}

      <PdfFooter pageNumber={pageNumber} totalPages={totalPages} date={date} />
    </Page>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: 100 }}>
      <Text style={[pdfText.tableHeader, { fontSize: 8 }]}>{label}</Text>
      <Text style={{ fontSize: 12, fontFamily: PDF_FONTS.sansBold, color: PDF_COLORS.inkPrimary, marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

/* --------------------------------------------------------------------------
 * Market page
 * -------------------------------------------------------------------------- */
function MarketPage({ report, pageNumber, totalPages, date }: { report: DeepResearchReport; pageNumber: number; totalPages: number; date: string }) {
  const m = report.marketAnalysis;
  if (!m) return null;
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Market" />
      <Text style={styles.sectionTitle}>Market snapshot</Text>
      <PdfCard>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>Demand</Text>
            <Text style={pdfText.body}>{m.demandLevel}</Text>
            <View style={{ height: 6 }} />
            <Text style={styles.miniLabel}>Growth trend</Text>
            <Text style={pdfText.body}>{m.growthTrend}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>Peak months</Text>
            <Text style={pdfText.body}>{m.seasonality.peakMonths.join(", ")}</Text>
            <View style={{ height: 6 }} />
            <Text style={styles.miniLabel}>Low months</Text>
            <Text style={pdfText.body}>{m.seasonality.lowMonths.join(", ")}</Text>
          </View>
        </View>
      </PdfCard>

      <View style={{ height: 12 }} />
      <PdfCallout title="Market size" accent={PDF_COLORS.auroraMint}>
        {m.marketSizeEstimate}
      </PdfCallout>

      {m.regulatoryNotes.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <PdfCard>
            <Text style={styles.miniLabel}>Regulatory notes</Text>
            {m.regulatoryNotes.map((n, i) => (
              <Text key={i} style={[pdfText.body, { marginTop: 4 }]}>• {n}</Text>
            ))}
          </PdfCard>
        </View>
      )}

      <PdfFooter pageNumber={pageNumber} totalPages={totalPages} date={date} />
    </Page>
  );
}

/* --------------------------------------------------------------------------
 * Persona pages (one per persona, up to 3)
 * -------------------------------------------------------------------------- */
function PersonaPage({ persona, report, pageNumber, totalPages, date }: { persona: Persona; report: DeepResearchReport; pageNumber: number; totalPages: number; date: string }) {
  const accent = PDF_COLORS.auroraPurple;
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title={`Customer avatar — ${persona.name}`} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <View
          style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: accent,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontFamily: PDF_FONTS.serifBold, fontSize: 22 }}>
            {persona.name.trim()[0]?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 22, fontFamily: PDF_FONTS.serifBold, color: PDF_COLORS.inkPrimary }}>
            {persona.name}
          </Text>
          <Text style={pdfText.bodyMuted}>{persona.age} · {persona.occupation} · {persona.location}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <PdfCard style={{ flex: 1 }}>
          <Text style={styles.miniLabel}>Lifestyle</Text>
          <Text style={[pdfText.body, { marginBottom: 8 }]}>{persona.lifestyle}</Text>
          <Text style={styles.miniLabel}>Personality</Text>
          <Text style={pdfText.body}>{persona.personalityTraits.join(" · ")}</Text>
          <View style={{ height: 8 }} />
          <Text style={styles.miniLabel}>Income</Text>
          <Text style={pdfText.body}>{persona.income}</Text>
        </PdfCard>
        <PdfCard style={{ flex: 1 }}>
          <Text style={styles.miniLabel}>Pain points</Text>
          {persona.painPoints.slice(0, 5).map((p, i) => (
            <Text key={i} style={[pdfText.body, { marginTop: 3 }]}>• {p}</Text>
          ))}
          <View style={{ height: 8 }} />
          <Text style={styles.miniLabel}>Desired outcomes</Text>
          {persona.desiredOutcomes.slice(0, 4).map((p, i) => (
            <Text key={i} style={[pdfText.body, { marginTop: 3 }]}>• {p}</Text>
          ))}
        </PdfCard>
      </View>

      <View style={{ height: 12 }} />
      <PdfCard soft>
        <Text style={styles.miniLabel}>A day in their life</Text>
        <Text style={pdfText.body}>{persona.dayInTheLife}</Text>
      </PdfCard>

      <View style={{ height: 12 }} />
      <PdfCard>
        <Text style={styles.miniLabel}>How they actually talk</Text>
        {persona.languagePatterns.slice(0, 4).map((q, i) => (
          <Text key={i} style={[pdfText.bodyMuted, { fontStyle: "italic", marginTop: 4 }]}>
            “{q}”
          </Text>
        ))}
      </PdfCard>

      <PdfFooter pageNumber={pageNumber} totalPages={totalPages} date={date} />
      <Text style={{ display: "none" }}>{report.id}</Text>
    </Page>
  );
}

/* --------------------------------------------------------------------------
 * Competitive page
 * -------------------------------------------------------------------------- */
function CompetitivePage({ report, pageNumber, totalPages, date }: { report: DeepResearchReport; pageNumber: number; totalPages: number; date: string }) {
  const c = report.competitorLandscape;
  if (!c) return null;
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Competitive Landscape" />
      <Text style={styles.sectionTitle}>Who else is selling this</Text>

      <PdfCard>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <View>
            <Text style={styles.miniLabel}>Saturation</Text>
            <Text style={{ fontSize: 28, fontFamily: PDF_FONTS.serifBold, color: PDF_COLORS.inkPrimary }}>
              {c.saturationScore}
              <Text style={{ fontSize: 12, color: PDF_COLORS.inkWhisper }}> /100</Text>
            </Text>
          </View>
          <PdfBadge color={
            c.saturationLevel === "saturated"
              ? PDF_COLORS.skip
              : c.saturationLevel === "competitive"
                ? PDF_COLORS.test
                : c.saturationLevel === "emerging"
                  ? PDF_COLORS.auroraBlue
                  : PDF_COLORS.go
          }>
            {c.saturationLevel}
          </PdfBadge>
        </View>
        <View style={{ marginTop: 12, height: 6, backgroundColor: PDF_COLORS.surfaceSoft, borderRadius: 3, overflow: "hidden" }}>
          <View style={{ height: 6, width: `${c.saturationScore}%`, backgroundColor: PDF_COLORS.auroraPurple }} />
        </View>
      </PdfCard>

      <View style={{ height: 12 }} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {c.topAdvertiserArchetypes.map((a, i) => (
          <PdfCard key={i} style={{ width: "48%" }}>
            <Text style={{ fontFamily: PDF_FONTS.sansBold, fontSize: 11, color: PDF_COLORS.inkPrimary }}>{a.name}</Text>
            <Text style={[pdfText.bodyMuted, { marginTop: 3 }]}>{a.approach}</Text>
            <View style={{ height: 8 }} />
            <Text style={[styles.miniLabel, { color: PDF_COLORS.go }]}>Strengths</Text>
            {a.strengths.map((s, j) => (
              <Text key={j} style={[pdfText.body, { marginTop: 2 }]}>• {s}</Text>
            ))}
            <View style={{ height: 6 }} />
            <Text style={[styles.miniLabel, { color: PDF_COLORS.skip }]}>Weaknesses</Text>
            {a.weaknesses.map((s, j) => (
              <Text key={j} style={[pdfText.body, { marginTop: 2 }]}>• {s}</Text>
            ))}
          </PdfCard>
        ))}
      </View>

      <View style={{ height: 12 }} />
      <PdfCallout title="Market gaps" accent={PDF_COLORS.auroraPurple}>
        <View>
          {c.marketGaps.map((g, i) => (
            <Text key={i} style={[pdfText.body, { marginTop: 3 }]}>• {g}</Text>
          ))}
        </View>
      </PdfCallout>

      <PdfFooter pageNumber={pageNumber} totalPages={totalPages} date={date} />
    </Page>
  );
}

/* --------------------------------------------------------------------------
 * Pricing page
 * -------------------------------------------------------------------------- */
function PricingPdfPage({ report, pageNumber, totalPages, date }: { report: DeepResearchReport; pageNumber: number; totalPages: number; date: string }) {
  const p = report.pricingStrategy;
  if (!p) return null;
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Pricing Strategy" />
      <Text style={styles.sectionTitle}>How to price this</Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        {p.priceTiers.map((tier) => {
          const color =
            tier.label === "entry" ? PDF_COLORS.auroraBlue : tier.label === "popular" ? PDF_COLORS.auroraPurple : PDF_COLORS.auroraPink;
          return (
            <PdfCard key={tier.label} style={{ flex: 1, borderColor: `${color}66` }}>
              <Text style={[styles.miniLabel, { color }]}>{tier.label}</Text>
              <Text style={{ fontSize: 24, fontFamily: PDF_FONTS.serifBold, color: PDF_COLORS.inkPrimary, marginTop: 4 }}>
                ${tier.price}
              </Text>
              <View style={{ height: 6 }} />
              {tier.includes.map((inc, j) => (
                <Text key={j} style={[pdfText.body, { marginTop: 2 }]}>• {inc}</Text>
              ))}
              <View style={{ height: 6 }} />
              <Text style={[pdfText.bodyMuted, { fontStyle: "italic" }]}>{tier.who}</Text>
            </PdfCard>
          );
        })}
      </View>

      <View style={{ height: 12 }} />
      <PdfCard>
        <Text style={styles.miniLabel}>Anchor pricing</Text>
        <Text style={pdfText.body}>
          Show ${p.anchorPrice} struck through next to ${p.recommendedPrice}.
        </Text>
      </PdfCard>

      <View style={{ height: 12 }} />
      <PdfCard soft>
        <Text style={styles.miniLabel}>Bundles</Text>
        {p.bundleSuggestions.map((b, i) => (
          <Text key={i} style={[pdfText.body, { marginTop: 2 }]}>• {b}</Text>
        ))}
      </PdfCard>

      <View style={{ height: 12 }} />
      <PdfCallout title="Why this price" accent={PDF_COLORS.auroraBlue}>
        {p.priceJustification}
      </PdfCallout>

      <PdfFooter pageNumber={pageNumber} totalPages={totalPages} date={date} />
    </Page>
  );
}

/* --------------------------------------------------------------------------
 * Angles page (up to 3 per page)
 * -------------------------------------------------------------------------- */
function AnglesPdfPage({ report, pageNumber, totalPages, date }: { report: DeepResearchReport; pageNumber: number; totalPages: number; date: string }) {
  if (report.adAngles.length === 0) return null;
  const angles = report.adAngles.slice(0, 6);
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Ad Angles" />
      <Text style={styles.sectionTitle}>Six ways to sell this</Text>
      <View style={{ flexDirection: "column", gap: 8 }}>
        {angles.map((a) => {
          const aColor =
            a.awarenessLevel === "unaware" ? PDF_COLORS.auroraBlue
              : a.awarenessLevel === "problem-aware" ? PDF_COLORS.auroraPurple
              : a.awarenessLevel === "solution-aware" ? PDF_COLORS.auroraPink
              : a.awarenessLevel === "product-aware" ? PDF_COLORS.test
              : PDF_COLORS.go;
          return (
            <PdfCard key={a.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                <Text style={{ fontFamily: PDF_FONTS.serifBold, fontSize: 13, color: PDF_COLORS.inkPrimary }}>
                  {a.angle}
                </Text>
                <PdfBadge color={aColor}>{a.awarenessLevel}</PdfBadge>
              </View>
              <Text style={[pdfText.bodyMuted, { fontStyle: "italic", marginTop: 4 }]}>
                “{a.hook}”
              </Text>
              <View style={{ marginTop: 6 }}>
                <Text style={[pdfText.body, { marginTop: 2 }]}>
                  <Text style={[pdfText.tableHeader]}>OPEN  </Text>{a.scriptStructure.opening}
                </Text>
                <Text style={[pdfText.body, { marginTop: 2 }]}>
                  <Text style={[pdfText.tableHeader]}>MID   </Text>{a.scriptStructure.middle}
                </Text>
                <Text style={[pdfText.body, { marginTop: 2 }]}>
                  <Text style={[pdfText.tableHeader]}>CLOSE </Text>{a.scriptStructure.close}
                </Text>
              </View>
            </PdfCard>
          );
        })}
      </View>
      <PdfFooter pageNumber={pageNumber} totalPages={totalPages} date={date} />
    </Page>
  );
}

/* --------------------------------------------------------------------------
 * Hook Angles pages (NEW grounded engine output) — chunked 4 per page
 * -------------------------------------------------------------------------- */
function HookAnglesPdfPage({
  report,
  angles,
  pageNumber,
  totalPages,
  date,
  pageIndex,
}: {
  report: DeepResearchReport;
  angles: NonNullable<DeepResearchReport["hookAngles"]>;
  pageNumber: number;
  totalPages: number;
  date: string;
  pageIndex: number;
}) {
  void report;
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title={pageIndex === 0 ? "The angles" : `The angles (cont.)`} />
      <Text style={styles.sectionTitle}>
        {pageIndex === 0 ? `${angles.length} hooks ranked by predicted impact` : ""}
      </Text>
      <View style={{ flexDirection: "column", gap: 8 }}>
        {angles.map((a) => {
          const aColor =
            a.awarenessLevel === "unaware" ? PDF_COLORS.auroraBlue
              : a.awarenessLevel === "problem-aware" ? PDF_COLORS.auroraPurple
              : a.awarenessLevel === "solution-aware" ? PDF_COLORS.auroraPink
              : a.awarenessLevel === "product-aware" ? PDF_COLORS.test
              : PDF_COLORS.go;
          return (
            <PdfCard key={a.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                <Text style={{ fontFamily: PDF_FONTS.serifBold, fontSize: 12, color: PDF_COLORS.inkPrimary }}>
                  #{a.rank} · {a.emotionalDriver}
                </Text>
                <PdfBadge color={aColor}>{a.awarenessLevel}</PdfBadge>
              </View>
              <Text style={[pdfText.body, { fontStyle: "italic", fontSize: 11, marginTop: 4, fontFamily: PDF_FONTS.serif }]}>
                “{a.primaryHook}”
              </Text>
              <View style={{ marginTop: 5 }}>
                <Text style={[pdfText.body, { marginTop: 2, fontSize: 9 }]}>
                  <Text style={[pdfText.tableHeader, { fontSize: 8 }]}>OPEN     </Text>{a.scriptStructure.opening}
                </Text>
                <Text style={[pdfText.body, { marginTop: 2, fontSize: 9 }]}>
                  <Text style={[pdfText.tableHeader, { fontSize: 8 }]}>PROBLEM  </Text>{a.scriptStructure.problem}
                </Text>
                <Text style={[pdfText.body, { marginTop: 2, fontSize: 9 }]}>
                  <Text style={[pdfText.tableHeader, { fontSize: 8 }]}>SOLUTION </Text>{a.scriptStructure.solution}
                </Text>
                <Text style={[pdfText.body, { marginTop: 2, fontSize: 9 }]}>
                  <Text style={[pdfText.tableHeader, { fontSize: 8 }]}>CTA      </Text>{a.scriptStructure.cta}
                </Text>
              </View>
              {a.whyThisWorks && (
                <Text style={[pdfText.bodyMuted, { fontSize: 8, marginTop: 5 }]}>
                  Why: {a.whyThisWorks}
                </Text>
              )}
            </PdfCard>
          );
        })}
      </View>
      <PdfFooter pageNumber={pageNumber} totalPages={totalPages} date={date} />
    </Page>
  );
}

/* --------------------------------------------------------------------------
 * Sources page — full citation list at the back of the report
 * -------------------------------------------------------------------------- */
function SourcesPdfPage({ report, pageNumber, totalPages, date }: { report: DeepResearchReport; pageNumber: number; totalPages: number; date: string }) {
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Sources" />
      <Text style={styles.sectionTitle}>
        {report.sources.length} web source{report.sources.length === 1 ? "" : "s"} consulted
      </Text>
      <View style={{ flexDirection: "column", gap: 4 }}>
        {report.sources.map((src) => (
          <View key={src.index} style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text style={{ fontFamily: PDF_FONTS.mono, fontSize: 8, color: PDF_COLORS.inkWhisper, width: 24 }}>
              [{src.index + 1}]
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: PDF_FONTS.sansBold, fontSize: 9, color: PDF_COLORS.inkPrimary }}>
                {src.domain}
              </Text>
              <Text style={{ fontFamily: PDF_FONTS.sans, fontSize: 8, color: PDF_COLORS.inkSoft }}>
                {src.title}
              </Text>
              <Text style={{ fontFamily: PDF_FONTS.mono, fontSize: 7, color: PDF_COLORS.auroraBlue, marginTop: 1 }}>
                {src.uri}
              </Text>
            </View>
          </View>
        ))}
        {report.sources.length === 0 && (
          <Text style={[pdfText.bodyMuted, { fontStyle: "italic" }]}>
            This scan ran without web grounding (GEMINI_GROUNDING_ENABLED=false or all
            grounded calls failed). No sources to cite.
          </Text>
        )}
      </View>
      {report.searchQueriesRun.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={[pdfText.tableHeader, { fontSize: 9, marginBottom: 4 }]}>
            SEARCH QUERIES RUN ({report.searchQueriesRun.length})
          </Text>
          {report.searchQueriesRun.map((q, i) => (
            <Text key={i} style={[pdfText.bodyMuted, { fontFamily: PDF_FONTS.mono, fontSize: 8 }]}>
              · {q}
            </Text>
          ))}
        </View>
      )}
      <PdfFooter pageNumber={pageNumber} totalPages={totalPages} date={date} />
    </Page>
  );
}

/* --------------------------------------------------------------------------
 * Angle cheat sheet — 1-page tear-out summary
 * -------------------------------------------------------------------------- */
function AngleCheatSheetPdfPage({ report, pageNumber, totalPages, date }: { report: DeepResearchReport; pageNumber: number; totalPages: number; date: string }) {
  const angles = report.hookAngles;
  if (!angles || angles.length === 0) return null;
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Angle cheat sheet" />
      <Text style={styles.sectionTitle}>Tear-out: every angle at a glance</Text>
      <View style={{ flexDirection: "column", gap: 4 }}>
        {angles.map((a) => {
          const topPlatform = (["meta", "tiktok", "youtube", "googleAds"] as const)
            .map((p) => ({ p, score: a.platformFit[p].score }))
            .sort((x, y) => y.score - x.score)[0];
          return (
            <View
              key={a.id}
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                paddingVertical: 4,
                borderBottomWidth: 0.5,
                borderColor: PDF_COLORS.borderSoft,
              }}
            >
              <Text style={{ fontFamily: PDF_FONTS.serifBold, fontSize: 12, width: 22, color: PDF_COLORS.inkPrimary }}>
                #{a.rank}
              </Text>
              <View style={{ flex: 1, paddingLeft: 6 }}>
                <Text style={{ fontFamily: PDF_FONTS.serif, fontStyle: "italic", fontSize: 10, color: PDF_COLORS.inkPrimary }}>
                  “{a.primaryHook}”
                </Text>
                <Text style={{ fontFamily: PDF_FONTS.mono, fontSize: 7, color: PDF_COLORS.inkSoft, marginTop: 1 }}>
                  {a.awarenessLevel.toUpperCase()} · {a.emotionalDriver.toUpperCase()} · {topPlatform.p.toUpperCase()} ({topPlatform.score}/100)
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      <PdfFooter pageNumber={pageNumber} totalPages={totalPages} date={date} />
    </Page>
  );
}

/* --------------------------------------------------------------------------
 * Playbook page
 * -------------------------------------------------------------------------- */
function PlaybookPdfPage({ report, pageNumber, totalPages, date }: { report: DeepResearchReport; pageNumber: number; totalPages: number; date: string }) {
  const pb = report.launchPlaybook;
  if (!pb) return null;
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="14-Day Launch Playbook" />
      <Text style={styles.sectionTitle}>Your 14-day playbook</Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {pb.dailyActions.map((day) => (
          <View
            key={day.day}
            style={{
              width: "13.4%",
              padding: 6,
              backgroundColor: PDF_COLORS.surfaceSoft,
              borderRadius: 6,
              borderWidth: 0.5,
              borderColor: PDF_COLORS.borderSoft,
            }}
          >
            <Text style={[styles.miniLabel, { fontSize: 7 }]}>Day {day.day}</Text>
            <Text style={[pdfText.body, { fontSize: 8, marginTop: 2 }]}>{day.focus}</Text>
            <Text style={[pdfText.tableHeader, { fontSize: 7, marginTop: 3, color: PDF_COLORS.inkWhisper }]}>
              {day.creativeCount} creatives
            </Text>
          </View>
        ))}
      </View>

      <View style={{ height: 12, flexDirection: "row", gap: 10 }} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <PdfCard style={{ flex: 1 }}>
          <Text style={styles.miniLabel}>Total budget</Text>
          <Text style={{ fontSize: 24, fontFamily: PDF_FONTS.serifBold, color: PDF_COLORS.auroraBlue }}>
            ${pb.totalBudget.toLocaleString()}
          </Text>
        </PdfCard>
        <PdfCard style={{ flex: 1 }}>
          <Text style={styles.miniLabel}>Expected ROAS</Text>
          <Text style={{ fontSize: 24, fontFamily: PDF_FONTS.serifBold, color: PDF_COLORS.auroraPurple }}>
            {pb.expectedROAS}×
          </Text>
        </PdfCard>
      </View>

      <View style={{ height: 12 }} />
      <Text style={[styles.miniLabel, { marginBottom: 6 }]}>Day-by-day detail</Text>
      <View style={{ gap: 4 }}>
        {pb.dailyActions.map((d) => (
          <View
            key={d.day}
            style={{
              flexDirection: "row",
              gap: 8,
              paddingVertical: 4,
              borderBottomWidth: 0.5,
              borderBottomColor: PDF_COLORS.borderSoft,
            }}
          >
            <Text style={{ width: 30, fontFamily: PDF_FONTS.sansBold, fontSize: 9 }}>D{d.day}</Text>
            <Text style={{ width: 80, fontSize: 9 }}>{d.focus}</Text>
            <Text style={{ flex: 1, fontSize: 9, color: PDF_COLORS.inkSoft }}>
              {d.actions.join(" · ")}
            </Text>
            <Text style={{ width: 100, fontSize: 9, color: PDF_COLORS.inkSoft }}>{d.budgetSplit}</Text>
          </View>
        ))}
      </View>

      <PdfFooter pageNumber={pageNumber} totalPages={totalPages} date={date} />
    </Page>
  );
}

/* --------------------------------------------------------------------------
 * Risk + verdict page
 * -------------------------------------------------------------------------- */
function RiskVerdictPage({ report, pageNumber, totalPages, date, watermark }: { report: DeepResearchReport; pageNumber: number; totalPages: number; date: string; watermark?: string }) {
  const r = report.riskAnalysis;
  const v = report.finalVerdict;
  const verdict = VERDICT_META[v.verdict];

  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Risk & Verdict" />

      {r && (
        <View>
          <Text style={styles.sectionTitle}>What could go wrong</Text>
          <View style={{ gap: 8 }}>
            {r.redFlags.map((flag, i) => {
              const color =
                flag.severity === "critical" ? PDF_COLORS.skip
                  : flag.severity === "high" ? PDF_COLORS.risky
                  : flag.severity === "medium" ? PDF_COLORS.test : PDF_COLORS.auroraBlue;
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    padding: 10,
                    backgroundColor: PDF_COLORS.surfaceFill,
                    borderRadius: 8,
                    borderWidth: 0.5,
                    borderColor: PDF_COLORS.borderSoft,
                  }}
                >
                  <View style={{ width: 3, backgroundColor: color, borderRadius: 2 }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.miniLabel, { color }]}>{flag.severity}</Text>
                    </View>
                    <Text style={[pdfText.body, { marginTop: 3 }]}>{flag.description}</Text>
                    <Text style={[pdfText.bodyMuted, { marginTop: 4 }]}>↳ {flag.mitigation}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={{ height: 16 }} />
      <PdfCard style={{ borderColor: `${verdict.color}66` }}>
        <Text style={[styles.miniLabel, { color: verdict.color }]}>Final verdict</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 4 }}>
          <Text style={{ fontSize: 32, fontFamily: PDF_FONTS.serifBold, color: verdict.color }}>{v.sellScore}</Text>
          <Text style={{ fontSize: 10, color: PDF_COLORS.inkWhisper }}>/ 100</Text>
          <View style={{ marginLeft: 8 }}>
            <PdfBadge color={verdict.color}>{verdict.label}</PdfBadge>
          </View>
        </View>
        <Text style={[pdfText.body, { marginTop: 10 }]}>{v.summary}</Text>
      </PdfCard>

      {v.comparableProducts.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <PdfCard soft>
            <Text style={styles.miniLabel}>Comparable past winners</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              {v.comparableProducts.map((c, i) => (
                <View key={i} style={{ flex: 1, padding: 8, backgroundColor: PDF_COLORS.surfaceFill, borderRadius: 6, borderWidth: 0.5, borderColor: PDF_COLORS.borderSoft }}>
                  <Text style={{ fontSize: 10, fontFamily: PDF_FONTS.sansBold, color: PDF_COLORS.inkPrimary }}>{c.name}</Text>
                  <Text style={[pdfText.bodyMuted, { marginTop: 3, fontSize: 9 }]}>{c.why}</Text>
                </View>
              ))}
            </View>
          </PdfCard>
        </View>
      )}

      <View style={{ height: 16 }} />
      <PdfCard soft>
        <Text style={styles.miniLabel}>Methodology</Text>
        <Text style={pdfText.bodyMuted}>
          Models: {report.methodology.modelsUsed.join(", ")} · Stages: {report.methodology.stagesRun.length} · Duration: {(report.methodology.durationMs / 1000).toFixed(1)}s
        </Text>
        {report.methodology.fallbacksTriggered.length > 0 && (
          <Text style={[pdfText.bodyMuted, { marginTop: 4 }]}>
            Fallbacks: {report.methodology.fallbacksTriggered.join(", ")}
          </Text>
        )}
        <Text style={[pdfText.bodyMuted, { marginTop: 6, fontSize: 8 }]}>
          AI outputs are directional — verify with your own ad data before scaling.
        </Text>
      </PdfCard>

      {/* Watermark for Starter plan */}
      {watermark && (
        <Text
          style={{
            position: "absolute",
            bottom: 36,
            left: 32, right: 32,
            textAlign: "center",
            fontSize: 8,
            color: PDF_COLORS.inkWhisper,
            fontFamily: PDF_FONTS.sansBold,
            letterSpacing: 0.5,
          }}
          fixed
        >
          {watermark}
        </Text>
      )}

      <PdfFooter pageNumber={pageNumber} totalPages={totalPages} date={date} />
    </Page>
  );
}

/* --------------------------------------------------------------------------
 * Assemble the full document
 * -------------------------------------------------------------------------- */
export type ResearchPdfProps = {
  report: DeepResearchReport;
  watermark?: string;
};

export function ResearchPdfDocument({ report, watermark }: ResearchPdfProps) {
  const date = new Date(report.generatedAt).toLocaleDateString();

  // Compose page list dynamically based on what data exists
  const pages: React.ReactNode[] = [];
  pages.push(<CoverPage key="cover" report={report} />);

  // We pre-count total pages so the footers can show "X of Y"
  // Build a tentative list, then re-render with counts.
  type PageBuilder = (pn: number, tp: number) => React.ReactNode;
  const builders: PageBuilder[] = [];

  builders.push((pn, tp) => <SummaryPage key="summary" report={report} pageNumber={pn} totalPages={tp} date={date} />);
  builders.push((pn, tp) => <ProductPage key="product" report={report} pageNumber={pn} totalPages={tp} date={date} />);
  if (report.marketAnalysis) {
    builders.push((pn, tp) => <MarketPage key="market" report={report} pageNumber={pn} totalPages={tp} date={date} />);
  }
  report.personas.forEach((p, i) => {
    builders.push((pn, tp) => <PersonaPage key={`persona-${i}`} persona={p} report={report} pageNumber={pn} totalPages={tp} date={date} />);
  });
  if (report.competitorLandscape) {
    builders.push((pn, tp) => <CompetitivePage key="competitive" report={report} pageNumber={pn} totalPages={tp} date={date} />);
  }
  if (report.pricingStrategy) {
    builders.push((pn, tp) => <PricingPdfPage key="pricing" report={report} pageNumber={pn} totalPages={tp} date={date} />);
  }
  // Prefer the new hookAngles (grounded engine output). Falls back to the
  // legacy adAngles render for older reports.
  if (report.hookAngles && report.hookAngles.length > 0) {
    const PER_PAGE = 4;
    const chunks: typeof report.hookAngles[] = [];
    for (let i = 0; i < report.hookAngles.length; i += PER_PAGE) {
      chunks.push(report.hookAngles.slice(i, i + PER_PAGE));
    }
    chunks.forEach((chunk, idx) => {
      builders.push((pn, tp) => (
        <HookAnglesPdfPage
          key={`hookangles-${idx}`}
          report={report}
          angles={chunk}
          pageNumber={pn}
          totalPages={tp}
          date={date}
          pageIndex={idx}
        />
      ));
    });
  } else if (report.adAngles.length > 0) {
    builders.push((pn, tp) => <AnglesPdfPage key="angles" report={report} pageNumber={pn} totalPages={tp} date={date} />);
  }
  if (report.launchPlaybook) {
    builders.push((pn, tp) => <PlaybookPdfPage key="playbook" report={report} pageNumber={pn} totalPages={tp} date={date} />);
  }
  builders.push((pn, tp) => <RiskVerdictPage key="verdict" report={report} pageNumber={pn} totalPages={tp} date={date} watermark={watermark} />);
  // Cheat sheet (tear-out) — only for new reports with hookAngles
  if (report.hookAngles && report.hookAngles.length > 0) {
    builders.push((pn, tp) => <AngleCheatSheetPdfPage key="cheatsheet" report={report} pageNumber={pn} totalPages={tp} date={date} />);
  }
  // Sources page — last page if any sources exist
  if (report.sources && report.sources.length > 0) {
    builders.push((pn, tp) => <SourcesPdfPage key="sources" report={report} pageNumber={pn} totalPages={tp} date={date} />);
  }

  const totalPages = 1 + builders.length; // +1 for cover
  builders.forEach((b, i) => {
    pages.push(b(i + 2, totalPages));
  });

  return <Document title={`Wynner — ${report.productSnapshot.name}`}>{pages}</Document>;
}
