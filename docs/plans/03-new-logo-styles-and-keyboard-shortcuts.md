# New Logo Styles + Keyboard Shortcuts

## Context
Expanding the generative logo system from 17 styles (0-16) to 24 (0-23), and adding keyboard shortcuts with a collapsible hotkey legend. Existing seeds will produce different auto-selected styles — accepted tradeoff.

---

## Part A: 7 New Logo Styles (indices 17-23)

### New styles

| Idx | Name | Description |
|-----|------|-------------|
| 17 | Fractal Tree | Recursive branching from center (depth 3-5, 2-3 splits) |
| 18 | Voronoi Cells | Random seed points with perpendicular bisector edges clipped to circle |
| 19 | Truchet Tiles | Grid of randomly-oriented quarter-circle arcs, maze-like curves |
| 20 | Celtic Knot | Parametric trefoil/figure-eight with over-under gaps at crossings |
| 21 | Cross Hatch | 2-4 sets of parallel lines at different angles with shading gradient |
| 22 | Icons | Curated set of ~10 hardcoded simple shapes (shield, star, hexagon, etc.), seed-picks one |
| 23 | ASCII Art | Grid of monospace text characters (digits/letters/symbols) within circle |

### Files to modify

1. **`modules/symbols.js`** — Add 7 `draw*` functions, extend `variants` array
2. **`modules/card.js:148-149`** — `stylePRNG.int(0, 16)` → `int(0, 23)`, `logoStyle <= 16` → `<= 23`
3. **`modules/ui-sync.js:60`** — `makePRNG(seed ^ 0x9E3779B9).int(0, 16)` → `int(0, 23)`
4. **`modules/constants.js:10-16`** — Append 7 names to `LOGO_NAMES`
5. **`index.html:107-124`** — Add 7 `<option>` elements to `#logo-style` dropdown
6. **`modules/svg-ctx.js`** — Add `'middle'` textBaseline mapping → `'central'` (needed by ASCII Art)
7. **`CLAUDE.md`** — Update logo styles table and stylePRNG range

### SvgContext constraints
- No `bezierCurveTo`/`quadraticCurveTo` — approximate curves with polyline segments (existing pattern used by Spiral, Lissajous, etc.)
- No transforms — all coordinates must be absolute (use trig for rotation)
- No `setLineDash` — Celtic Knot over/under uses segment gaps, not dashes
- `fillText` supported — ASCII Art works, but needs `'middle'` baseline fix

### Key design notes per style

**Fractal Tree:** Iterative with stack (not recursive). Pre-consume all RNG in deterministic order. Branch thickness decays with depth. Leaf dots at tips.

**Voronoi Cells:** Generate 6-12 points in polar coords. For each nearby pair, draw perpendicular bisector clipped to circle. Optional seed-point dots.

**Truchet Tiles:** 3-7 grid. Each cell: `rng.next() > 0.5` picks orientation. Quarter-arcs via `ctx.arc()` at cell corners. Clip to circle.

**Celtic Knot:** Trefoil parameterization `x = sin(t) + 2sin(2t)`, `y = cos(t) - 2cos(2t)`. RNG picks lobe count (2-4), rotation, scale. Draw under-segments first (stopping before crossings), then over-segments on top.

**Cross Hatch:** 2-4 line sets, each at a different angle. Per-line alpha varies by position along a gradient axis (one side darker). Clip to circle.

**Icons:** 10 icons defined as arrays of `moveTo`/`lineTo`/`arc` commands in unit coords. Helper `rotatePoint(ux, uy, angle)` transforms to absolute coords. RNG picks icon, rotation, scale, filled vs stroke-only.

**ASCII Art:** RNG picks charset (digits, uppercase, hex, symbols). Font size derived from column count (8-18). Per-cell: pick char, skip if outside circle radius. `fillText` with monospace font.

---

## Part B: Keyboard Shortcuts

### Shortcut map

| Key | Action |
|-----|--------|
| Space | Shuffle (new random seed) |
| E | Export |
| R | Re-render |
| C | Copy link |
| Backspace | Reset all |
| F | Flip card |
| ← / → | Nudge seed ±1 |
| ↑ / ↓ | Nudge seed ±10 |
| 1 / 2 / 3 | Card size: ID / Square / Credit |
| S | SVG mode |
| V | Canvas mode |
| D | Toggle dark/light |
| ? | Toggle hotkey legend |

### Implementation

- Add a `keydown` listener on `document` in `index.html`
- Guard: skip when focus is on an `<input>`, `<select>`, or `<textarea>` (so typing in name/seed fields isn't intercepted)
- Import `setFlipped` from `card-3d.js` for the F key
- For seed nudge: parse current seed, add/subtract, set value, clear overrides, render

### Hotkey legend UI

- Positioned `position: fixed; top: 1rem; right: 1rem` over the main area
- Collapsible: small `?` button always visible; clicking toggles a compact key reference panel
- Panel: dark semi-transparent background, monospace text, two-column layout (key + action)
- `?` key also toggles it
- CSS in `styles.css`, HTML added at end of `<body>` (before `<script>`), JS toggle in the keyboard handler

### Files to modify

1. **`index.html`** — Add keyboard event listener, add legend HTML markup, import `setFlipped`
2. **`styles.css`** — Add legend panel styles
3. **`modules/card-3d.js`** — Already exports `setFlipped` (no changes needed)

---

## Implementation Order

1. `modules/svg-ctx.js` — `'middle'` baseline fix (1 line)
2. `modules/symbols.js` — Add 7 drawing functions + update variants array
3. `modules/constants.js` — Append 7 names
4. `modules/card.js` — Update style range 0-23
5. `modules/ui-sync.js` — Update style range 0-23
6. `index.html` — Add 7 `<option>` elements
7. `styles.css` — Add hotkey legend styles
8. `index.html` — Add hotkey legend HTML + keyboard event listener
9. `CLAUDE.md` — Update docs

## Verification

- Cycle through all 24 logo styles via the dropdown — each should render without errors in both SVG and Canvas modes
- Shuffle repeatedly to verify new styles appear in auto mode
- Test all keyboard shortcuts (with and without input focused)
- Toggle hotkey legend with `?` key and click
- Test card sizes, render modes, flip via keyboard
- Verify existing seeds still render correctly for styles 0-16 (same visual output)
