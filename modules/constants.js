// ── Card size presets ───────────────────────────────────────────────────
// Not seed-derived, purely a UI control.
// aspect = width/height ratio.  scale = multiplier on the fitted dimension.
export const CARD_SIZES = {
  id:     { aspect: 54 / 85.6, scale: 1 },           // standard ID card (85.6 × 54 mm)
  square: { aspect: 1,         scale: 54 / 85.6 * 0.64 }, // side = 4/5 of ID card width, then 80% of that
  credit: { aspect: 84 / 55,   scale: 1 },           // Credit card (85.6 × 53.98 mm)
};

export const BG_NAMES = [
  'Noise', 'Solid', 'Linear Gradient', 'Radial Glow', 'Film Grain',
  'Cloudy', 'Brushed', 'Speckle', 'Mesh Gradient', 'Dappled',
  'Plasma', 'Ripple', 'Weave', 'Marble', 'Topographic', 'Caustics',
];

export const PATTERN_NAMES = [
  'Halftone Dots', 'Guilloche', 'Concentric Rings', 'Scanlines',
  'Topographic', 'Moiré', 'Chevron', 'Hexagonal Grid',
  'Radial Burst', 'Diamond Lattice', 'Wave Interference', 'Stipple',
  'Crosshatch', 'Zigzag', 'Spiral Field', 'Liquid Gradient',
  'Milky Way', 'Black Hole', 'Sound Wave',
];

export const LOGO_NAMES = [
  'Venn', 'Segmented Ring', 'Radial Spokes', 'Layered Arcs',
  'Orbital', 'Parallel Lines', 'Polygon Nodes', 'Polygon Free Nodes',
  'Dot Matrix', 'Dot Mask',
  'Spiral', 'Wave Field', 'Starburst', 'Lissajous', 'Rose Curve',
  'Variable Dot Mask', 'Inlaid Rings',
  'Fractal Tree', 'Voronoi Cells', 'Truchet Tiles', 'Celtic Knot',
  'Cross Hatch', 'Icons', 'ASCII Art', 'Organic Tree',
  'Diagonal Stripes', 'Gear', 'Penrose',
];

export const ARTIFACT_NAMES = [
  'Streak', 'Lines', 'Wedge', 'Arc', 'Dot Grid', 'Rings', 'Cross',
  'Chevron', 'Diamond', 'Dashes', 'Bracket',
];

// ── Theme presets ──────────────────────────────────────────────────────
// Each preset sets colorOverrides values. Not seed-derived — a meta-control.
export const THEME_PRESETS = [
  { name: 'Corporate',   hue: 215, saturation: 45, isDark: true,  cardLightness: 16, noiseBrightness: 0.05, noiseContrast: 0.03 },
  { name: 'Midnight',    hue: 240, saturation: 50, isDark: true,  cardLightness: 8,  noiseBrightness: 0.06, noiseContrast: 0.05 },
  { name: 'Warm',        hue: 20,  saturation: 60, isDark: true,  cardLightness: 18, noiseBrightness: 0.08, noiseContrast: 0.04 },
  { name: 'Forest',      hue: 140, saturation: 40, isDark: true,  cardLightness: 14, noiseBrightness: 0.07, noiseContrast: 0.05 },
  { name: 'Deep Sea',    hue: 195, saturation: 55, isDark: true,  cardLightness: 10, noiseBrightness: 0.06, noiseContrast: 0.04 },
  { name: 'Charcoal',    hue: 0,   saturation: 3,  isDark: true,  cardLightness: 12, noiseBrightness: 0.03, noiseContrast: 0.02 },
  { name: 'Noir',        hue: 260, saturation: 15, isDark: true,  cardLightness: 6,  noiseBrightness: 0.04, noiseContrast: 0.03 },
  { name: 'Neon',        hue: 290, saturation: 85, isDark: true,  cardLightness: 12, noiseBrightness: 0.08, noiseContrast: 0.07 },
  { name: 'Ember',       hue: 5,   saturation: 70, isDark: true,  cardLightness: 15, noiseBrightness: 0.09, noiseContrast: 0.05 },
  { name: 'Plum',        hue: 310, saturation: 45, isDark: true,  cardLightness: 14, noiseBrightness: 0.06, noiseContrast: 0.04 },
  { name: 'Retro',       hue: 35,  saturation: 55, isDark: false, cardLightness: 78, noiseBrightness: 0.10, noiseContrast: 0.06 },
  { name: 'Pastel',      hue: 180, saturation: 30, isDark: false, cardLightness: 82, noiseBrightness: 0.04, noiseContrast: 0.02 },
  { name: 'Brutalist',   hue: 0,   saturation: 5,  isDark: false, cardLightness: 90, noiseBrightness: 0.02, noiseContrast: 0.01 },
  { name: 'Cream',       hue: 45,  saturation: 25, isDark: false, cardLightness: 88, noiseBrightness: 0.05, noiseContrast: 0.02 },
  { name: 'Blush',       hue: 345, saturation: 35, isDark: false, cardLightness: 80, noiseBrightness: 0.05, noiseContrast: 0.03 },
  { name: 'Sky',         hue: 200, saturation: 40, isDark: false, cardLightness: 84, noiseBrightness: 0.04, noiseContrast: 0.03 },
  { name: 'Mint',        hue: 155, saturation: 35, isDark: false, cardLightness: 83, noiseBrightness: 0.04, noiseContrast: 0.02 },
  { name: 'Lavender',    hue: 270, saturation: 30, isDark: false, cardLightness: 82, noiseBrightness: 0.04, noiseContrast: 0.03 },
  { name: 'Sunset',      hue: 15,  saturation: 65, isDark: false, cardLightness: 75, noiseBrightness: 0.08, noiseContrast: 0.05 },
  { name: 'Slate',       hue: 210, saturation: 15, isDark: false, cardLightness: 76, noiseBrightness: 0.03, noiseContrast: 0.02 },
];

// ── Pure helpers ────────────────────────────────────────────────────────

/** Knuth-style hash — converts arbitrary text to a 32-bit unsigned int. */
export function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/** Map a hue value (0–359) to a human-readable colour name. */
export function hueToColorName(hue) {
  const stops = [
    [15, 'Red'], [30, 'Orange'], [55, 'Amber'], [75, 'Yellow'],
    [150, 'Green'], [175, 'Teal'], [195, 'Cyan'], [225, 'Sky'],
    [255, 'Blue'], [285, 'Violet'], [315, 'Purple'], [345, 'Rose'],
  ];
  for (const [max, name] of stops) if (hue < max) return name;
  return 'Red';
}

/** Format artifact count for display — 0 means "auto". */
export function artCountLabel(v) {
  return parseInt(v) === 0 ? 'auto' : v;
}
