import { Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { PDF_COLORS, PDF_FONTS } from "../tokens";

const styles = StyleSheet.create({
  card: {
    backgroundColor: PDF_COLORS.surfaceFill,
    borderWidth: 0.5,
    borderColor: PDF_COLORS.borderSoft,
    borderRadius: 10,
    padding: 14,
  },
  cardSoft: {
    backgroundColor: PDF_COLORS.surfaceSoft,
    borderWidth: 0.5,
    borderColor: PDF_COLORS.borderSoft,
    borderRadius: 10,
    padding: 14,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
    fontSize: 8,
    fontFamily: PDF_FONTS.sansBold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  eyebrow: {
    fontSize: 8,
    color: PDF_COLORS.inkWhisper,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontFamily: PDF_FONTS.sansBold,
  },
  h1: {
    fontSize: 22,
    fontFamily: PDF_FONTS.serifBold,
    color: PDF_COLORS.inkPrimary,
  },
  h2: {
    fontSize: 16,
    fontFamily: PDF_FONTS.serifBold,
    color: PDF_COLORS.inkPrimary,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.45,
    color: PDF_COLORS.inkPrimary,
    fontFamily: PDF_FONTS.sans,
  },
  bodyMuted: {
    fontSize: 10,
    lineHeight: 1.45,
    color: PDF_COLORS.inkSoft,
    fontFamily: PDF_FONTS.sans,
  },
  tableHeader: {
    fontSize: 8,
    color: PDF_COLORS.inkWhisper,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: PDF_FONTS.sansBold,
  },
});

/** Glass-ish card with soft border + radius. No real blur in PDF. */
export function PdfCard({
  children,
  style,
  soft,
}: {
  children: React.ReactNode;
  style?: Style;
  soft?: boolean;
}) {
  const base = soft ? styles.cardSoft : styles.card;
  return <View style={style ? [base, style] : base}>{children}</View>;
}

/** Small pill badge — color variants for verdicts/accents. */
export function PdfBadge({
  children,
  color,
  background,
  borderColor,
  style,
}: {
  children: React.ReactNode;
  color: string;
  background?: string;
  borderColor?: string;
  style?: Style;
}) {
  const extra: Style = {
    color,
    backgroundColor: background ?? `${color}1A`,
    borderColor: borderColor ?? `${color}55`,
    borderWidth: 0.5,
  };
  return (
    <Text style={style ? [styles.badge, extra, style] : [styles.badge, extra]}>
      {children}
    </Text>
  );
}

/** Horizontal pillar bar — label, fill, value. */
export function PdfPillarBar({
  label,
  value,
  color,
  width = 220,
}: {
  label: string;
  value: number;
  color: string;
  width?: number;
}) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <View style={{ marginBottom: 6, width }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 3,
        }}
      >
        <Text style={[styles.bodyMuted, { fontSize: 9 }]}>{label}</Text>
        <Text style={[{ fontSize: 9, color, fontFamily: PDF_FONTS.sansBold }]}>
          {safe}
        </Text>
      </View>
      <View
        style={{
          height: 4,
          backgroundColor: PDF_COLORS.surfaceSoft,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 4,
            width: `${safe}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

/** Highlighted "Wynner says…" callout. */
export function PdfCallout({
  title,
  children,
  accent = PDF_COLORS.auroraPurple,
}: {
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <View
      style={{
        borderLeftWidth: 3,
        borderLeftColor: accent,
        backgroundColor: `${accent}10`,
        borderRadius: 6,
        padding: 12,
      }}
    >
      <Text
        style={[
          styles.eyebrow,
          { color: accent, marginBottom: 4 },
        ]}
      >
        {title}
      </Text>
      {typeof children === "string" ? <Text style={styles.body}>{children}</Text> : children}
    </View>
  );
}

/** Donut-ish score ring rendered as SVG. */
export function PdfScoreRing({
  value,
  color,
  size = 80,
}: {
  value: number;
  color: string;
  size?: number;
}) {
  const safe = Math.max(0, Math.min(100, value));
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const dash = (safe / 100) * c;
  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Path
          d={`M ${size / 2} ${size / 2 - r} a ${r} ${r} 0 1 0 0.01 0`}
          stroke={PDF_COLORS.borderSoft}
          strokeWidth={5}
          fill="none"
        />
        <Path
          d={`M ${size / 2} ${size / 2 - r} a ${r} ${r} 0 1 0 0.01 0`}
          stroke={color}
          strokeWidth={5}
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
        />
      </Svg>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: size * 0.32, fontFamily: PDF_FONTS.serifBold, color: PDF_COLORS.inkPrimary }}>
          {safe}
        </Text>
      </View>
    </View>
  );
}

/** Page footer — wordmark + page number + date. */
export function PdfFooter({ pageNumber, totalPages, date }: { pageNumber: number; totalPages: number; date: string }) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 20,
        left: 32,
        right: 32,
        flexDirection: "row",
        justifyContent: "space-between",
      }}
      fixed
    >
      <Text style={[styles.tableHeader, { color: PDF_COLORS.inkWhisper }]}>wynnerlabs.com</Text>
      <Text style={[styles.tableHeader, { color: PDF_COLORS.inkWhisper }]}>{date}</Text>
      <Text style={[styles.tableHeader, { color: PDF_COLORS.inkWhisper }]}>
        {pageNumber} / {totalPages}
      </Text>
    </View>
  );
}

export const pdfText = styles;
