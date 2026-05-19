/**
 * Approximate (x, y) positions for the 15 supported countries on a stylized
 * world canvas (0..100 coordinate space).
 *
 * Designed to look like a familiar world map at a glance — not geographically
 * accurate enough to navigate by. Adjust by hand if a country drifts off.
 */
export const COUNTRY_POSITIONS: Record<string, { x: number; y: number }> = {
  US: { x: 22, y: 38 },
  CA: { x: 22, y: 26 },
  MX: { x: 21, y: 47 },
  BR: { x: 35, y: 64 },
  UK: { x: 48, y: 30 },
  IE: { x: 46, y: 30 },
  FR: { x: 49, y: 36 },
  DE: { x: 51, y: 33 },
  ES: { x: 47, y: 40 },
  IT: { x: 51, y: 38 },
  NL: { x: 50, y: 32 },
  AE: { x: 62, y: 47 },
  IN: { x: 70, y: 47 },
  JP: { x: 84, y: 39 },
  AU: { x: 84, y: 70 },
  NZ: { x: 90, y: 76 },
  SG: { x: 76, y: 56 },
  ZA: { x: 54, y: 70 },
  AR: { x: 32, y: 76 },
};
