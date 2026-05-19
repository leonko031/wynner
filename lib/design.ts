export const colors = {
  ink: "#0A0A0B",
  surface: "#111113",
  surfaceElevated: "#16161A",
  border: "#1F1F23",
  borderStrong: "#2A2A2F",
  text: "#FAFAFA",
  textMuted: "#9CA3AF",
  textDim: "#6B7280",

  go: "#00D26A",
  test: "#F5A623",
  risky: "#F97316",
  skip: "#EF4444",
  info: "#3B82F6",
} as const;

export const verdictGlow = {
  go: "rgba(0, 210, 106, 0.15)",
  test: "rgba(245, 166, 35, 0.15)",
  risky: "rgba(249, 115, 22, 0.15)",
  skip: "rgba(239, 68, 68, 0.15)",
  info: "rgba(59, 130, 246, 0.15)",
} as const;

export const verdictPair = {
  go: { color: colors.go, glow: verdictGlow.go },
  test: { color: colors.test, glow: verdictGlow.test },
  risky: { color: colors.risky, glow: verdictGlow.risky },
  skip: { color: colors.skip, glow: verdictGlow.skip },
  info: { color: colors.info, glow: verdictGlow.info },
} as const;

export const springs = {
  gentle: { type: "spring" as const, stiffness: 200, damping: 25 },
  snappy: { type: "spring" as const, stiffness: 400, damping: 30 },
  bouncy: { type: "spring" as const, stiffness: 300, damping: 20, mass: 0.8 },
} as const;

export const durations = {
  fast: 0.2,
  base: 0.4,
  slow: 0.7,
  hero: 1.2,
} as const;

export const easings = {
  standard: [0.22, 1, 0.36, 1] as const,
  smooth: [0.4, 0, 0.2, 1] as const,
} as const;

export type Verdict = keyof typeof verdictPair;

export const design = {
  colors,
  verdictGlow,
  verdictPair,
  springs,
  durations,
  easings,
} as const;

export default design;
