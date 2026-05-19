/**
 * PDF design tokens — mirrors the app's aurora glass system inside the
 * constraints of @react-pdf/renderer (no CSS variables, no backdrop-filter).
 *
 * Everything is expressed as plain RGB hex / numeric points.
 */

export const PDF_COLORS = {
  // Surfaces — flat, since we can't blur in PDF
  pageBg: "#FAFBFF",
  surfaceFill: "#FFFFFF",
  surfaceSoft: "#F4F4FB",
  borderSoft: "#E6E6F0",
  borderStrong: "#C9CADC",

  // Ink
  inkPrimary: "#1A1B3A",
  inkSoft: "#5B5E8C",
  inkWhisper: "#9DA0BF",

  // Aurora accents
  auroraBlue: "#5B8DFF",
  auroraPurple: "#A788FF",
  auroraPink: "#FF89C5",
  auroraPeach: "#FFB088",
  auroraMint: "#88E5C8",

  // Verdict
  go: "#3DD68C",
  test: "#FFAB40",
  risky: "#FF7E5F",
  skip: "#FF5C7C",
} as const;

export const PDF_FONTS = {
  sans: "Helvetica",
  sansBold: "Helvetica-Bold",
  serif: "Times-Roman",
  serifBold: "Times-Bold",
  mono: "Courier",
} as const;

export const PDF_SPACING = {
  page: 32,
  card: 12,
  cardPadding: 14,
} as const;
