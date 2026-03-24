// ── Card size presets ───────────────────────────────────────────────────
// Not seed-derived, purely a UI control.
// aspect = width/height ratio.  scale = multiplier on the fitted dimension.
export const CARD_SIZES = {
  id:     { aspect: 54 / 85.6, scale: 1 },           // standard ID card (85.6 × 54 mm)
  square: { aspect: 1,         scale: 54 / 85.6 * 0.64 }, // side = 4/5 of ID card width, then 80% of that
  moo:    { aspect: 84 / 55,   scale: 1 },           // MOO business card (84 × 55 mm)
};

export const LOGO_NAMES = [
  'Venn', 'Segmented Ring', 'Radial Spokes', 'Layered Arcs',
  'Orbital', 'Parallel Lines', 'Polygon Nodes', 'Polygon Free Nodes',
  'Dot Matrix', 'Dot Mask',
  'Spiral', 'Wave Field', 'Starburst', 'Lissajous', 'Rose Curve',
  'Variable Dot Mask', 'Inlaid Rings',
  'Fractal Tree', 'Voronoi Cells', 'Truchet Tiles', 'Celtic Knot',
  'Cross Hatch', 'Icons', 'ASCII Art',
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
