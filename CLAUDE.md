# Access Card Generator — Development Patterns

## Architecture Overview

Vanilla ES modules, Canvas 2D + SVG, no build step. Served via local HTTP (ES modules need a server).

**Module layout:**
- `modules/prng.js`       — mulberry32 PRNG + seed mixer
- `modules/card.js`       — orchestrator; four PRNGs; exports `generateCard` + `deriveColorParams`
- `modules/background.js` — canvas bg, shadow, noise blobs, artifacts, gloss, edge
- `modules/symbols.js`    — 16 logo variants (0–15)
- `modules/text.js`       — name + job title layout
- `modules/utils.js`      — `hsla()`, `roundedRectPath()`
- `modules/svg-ctx.js`    — `SvgContext` — Canvas 2D API shim that emits SVG markup

---

## Render Modes

Two render modes: **Canvas** (raster) and **SVG** (vector). SVG is the default.

- `renderMode` variable in `index.html` — `'svg'` or `'canvas'`
- `setRenderMode(mode)` toggles display of `#canvas` / `#svg-output`, updates the export button label, and re-renders
- SVG mode creates a `SvgContext` from `svg-ctx.js`, passes it as `ctx` to `generateCard`, then sets `svgOutputEl.innerHTML`
- Canvas mode uses the standard `<canvas>` element's 2D context

**SVG limitations (POC):** No shadow, no `globalCompositeOperation` (lanyard hole punch-through absent), filter only honoured in `drawImage` (blur).

---

## PRNG Architecture

Four independent PRNGs, all mulberry32:

| PRNG | Seed | Controls |
|------|------|----------|
| `cardPRNG` | `seed` | isDark, saturation, symbolHueDrift, cardLightness, symbolLightness, noise blobs |
| `stylePRNG` | `seed ^ 0x9E3779B9` | logo style auto-pick |
| `logoPRNG` | `logoNonce` | all internal logo variation |
| `artifactPRNG` | `artifactSeed` | artifact count, placement, shape |

**Key rule:** The `cardPRNG` sequence must never be reordered or skipped. Any new seed-derived value must be appended at the end of the sequence, not inserted.

When adding a new seed-derived color/theme param, use `deriveColorParams()` with a separate PRNG constant (`seed ^ SOME_CONSTANT`) rather than extending the `cardPRNG` sequence, to avoid breaking existing card appearances.

---

## Seed-Derived Override Pattern

**Concept:** Every visual parameter has a seed-derived default. Users can override individual params via sliders/inputs. Overrides are preserved in the URL. Resetting an override reverts to the seed-derived value.

### Override Slot

An **override slot** is the full bundle needed to make a single parameter user-overridable:

1. **State variable** — a key in `colorOverrides` or `seedOverrides` (only present when the user has explicitly set a value)
2. **UI control** — a slider/input + ↺ reset button (`.field-hdr` + `.btn-reset`) that sets/clears the override
3. **URL query param** — written to the URL only when overridden, read back in `applyQueryString`

When adding a new overridable param, you wire up all three parts of the slot (see "Adding a New Overridable Param" below).

**Implementation (index.html):**

```js
const colorOverrides = {};  // keys present only when user has explicitly set that value
const seedOverrides  = {};  // same for logoNonce, artifactSeed

function getEffectiveColor() {
  const derived = deriveColorParams(parseInt(seedInput.value, 10) | 0);
  return {
    hue:             colorOverrides.hue             ?? derived.hue,
    saturation:      colorOverrides.saturation      ?? derived.saturation,
    noiseBrightness: colorOverrides.noiseBrightness ?? derived.noiseBrightness,
    noiseContrast:   colorOverrides.noiseContrast   ?? derived.noiseContrast,
  };
}
```

**UI rules:**
- ↺ reset button per overridable control — only visible (`.btn-reset.visible`) when an override is active
- Seed change clears ALL overrides (color + seed params)
- Shuffle picks a new random seed and clears all overrides
- URL only includes overridden colour params (not seed-derived defaults)

**URL param strategy:**
- Standard params always in URL: `seed`, `lstyle`, `zoom`, `name`, `title`, `artifacts`, `shadow`
- Colour overrides only if set: `hue`, `sat`, `nbright`, `ncontrast`
- Seed overrides only if set: `nonce`, `aseed`

**card.js rule for PRNG-sequence params (e.g. saturation):**
```js
// Always consume from PRNG to preserve the sequence for downstream draws.
// Then apply user override if present.
const saturationFromSeed = cardPRNG.int(38, 60);
const saturation = saturationOverride ?? saturationFromSeed;
```

**card.js rule for params not in cardPRNG (e.g. hue):**
- Derive in `deriveColorParams()` using a separate PRNG keyed with a unique constant
- Pass the effective value into `generateCard()` as a normal param
- No change needed inside `generateCard()` for these

**`deriveColorParams(seed)` mirrors the cardPRNG sequence:**
```js
const cardPRNG = makePRNG(seed);
const isDark        = cardPRNG.next() > 0.35;
const saturation    = cardPRNG.int(38, 60);
cardPRNG.float(-9, 9);              // symbolHueDrift — consume to reach cardLightness
const cardLightness = isDark ? cardPRNG.int(11, 22) : cardPRNG.int(72, 86);
// Separate PRNG for values not in cardPRNG:
const colorPRNG = makePRNG(seed ^ 0xC0FFEE42);
const hue = colorPRNG.int(0, 359);
// ...
// Lightness for the opposite mode — used by UI when isDark is toggled without a lightness override:
const altCardLightness = isDark ? colorPRNG.int(72, 86) : colorPRNG.int(11, 22);
return { isDark, cardLightness, altCardLightness, hue, saturation, noiseBrightness, noiseContrast };
```

**isDark + cardLightness override interaction:**
When the user toggles isDark, the lightness override is automatically cleared so that `altCardLightness` (the derived lightness for the new mode) shows in the slider. Resetting isDark also clears the lightness override for the same reason.

---

## Adding a New Overridable Param (Override Slot)

1. **If param is in `cardPRNG` sequence** (like saturation):
   - Add `fooOverride = null` to `generateCard` signature
   - Consume PRNG value, then `const foo = fooOverride ?? fooFromSeed`
   - Add `foo` to `deriveColorParams` by consuming a fresh `makePRNG(seed)` to the same position

2. **If param is NOT in `cardPRNG`** (like hue, noiseBrightness):
   - Add it to `deriveColorParams` using `colorPRNG` (keyed `seed ^ 0xC0FFEE42`)
   - It's passed into `generateCard` as a plain param — no override null-check needed there

3. **In index.html** (the three parts of the override slot):
   - **State:** Add key to `colorOverrides` (or `seedOverrides`)
   - **UI:** Add slider + ↺ reset button using `.field-hdr` structure
   - **URL:** Add read in `applyQueryString` and write in `syncURL`
   - Also: add to `getEffectiveColor()` (or `getEffectiveSeeds()`), `updateColorSliders()`, and `updateResetButtons()`

---

## Blob Noise

`drawNoise()` in `background.js`: N×N overlapping radial gradient blobs on an offscreen canvas, composited with `ctx.filter = 'blur(28px)'`. This avoids bilinear-interpolation grid artifacts that appear with traditional noise upscaling.

- `noiseZoom`: number of blobs per axis (2–16). Lower = coarser/smoother.
- `noiseBrightness`: base opacity of each blob.
- `noiseContrast`: per-blob random opacity spread.

---

## Artifact Types

`drawArtifacts()` in `background.js`, seeded by `artifactPRNG`:

| Type | Shape |
|------|-------|
| 0 | Streak band — wide filled parallelogram |
| 1 | Line bundle — 3–5 parallel lines, butt caps |
| 2 | Corner wedge — filled triangle from a card corner |
| 3 | Arc slice — thick partial arc, butt caps |
| 4 | Grid fragment — dot grid clipped to a rectangle |

Global opacity multiplier: `const opacity = 0.2`.

---

## Logo Styles

| Index | Name |
|-------|------|
| 0 | Venn |
| 1 | Segmented Ring |
| 2 | Radial Spokes |
| 3 | Layered Arcs |
| 4 | Orbital |
| 5 | Parallel Lines |
| 6 | Polygon Nodes |
| 7 | Polygon Free Nodes |
| 8 | Dot Matrix |
| 9 | Dot Mask |
| 10 | Spiral |
| 11 | Wave Field |
| 12 | Starburst |
| 13 | Lissajous |
| 14 | Rose Curve |
| 15 | Variable Dot Mask |

Style is selected by `stylePRNG.int(0, 15)` in auto mode, or forced via `logoStyle` param (0–15).
Logo name display in the UI uses `makePRNG(seed ^ 0x9E3779B9).int(0, 15)` — must match `stylePRNG` seed exactly.

**Dot Mask vs Variable Dot Mask:** Dot Mask (9) uses a single dot size across the grid. Variable Dot Mask (15) seed-derives 2–7 discrete size steps lerped between a min and max radius; each dot randomly picks a step, producing varied dot sizes within the same harmonic blob boundary.

**`logoScale` override slot:** Controls the scale multiplier for the symbol radius. Default is 1 (100%). Not seed-derived — purely a UI control. URL param: `lscale`. The reset-all button resets it to 100%.

---

## Export

- **SVG mode (default):** Export renders a fresh `SvgContext`, serializes via `toSVG()`, downloads as `.svg` Blob.
- **Canvas mode:** Export re-renders with `transparent: true` (skips `drawCanvasBackground`), downloads as `.png` via `canvas.toDataURL()`, then re-renders normally.
- `showShadow: false` skips `drawCardShadow` for a shadow-free export (or preview).
- The export button label dynamically updates to "Export SVG" or "Export PNG" based on the active render mode.
