# Plan: SVG Default, Export PNG/SVG, Variable Dot Mask

## Context
Three changes requested:
1. Make SVG the default renderer (currently Canvas is default)
2. Export button should export PNG or SVG depending on active render mode
3. New logo style "Variable Dot Mask" — like Dot Mask but with seed-derived size steps

---

## 1. Make SVG the default selection

**Files:** [index.html](index.html)

- Change `let renderMode = 'canvas'` → `let renderMode = 'svg'` (line 479)
- Swap the initial `active` class: remove from `btn-mode-canvas`, add to `btn-mode-svg` (lines 204-205)
- Set initial display: `canvas` hidden, `svg-output` shown (line 194-195) — or handle in `setRenderMode` on init
- Actually simplest: just call `setRenderMode('svg')` at init, which toggles display and classes. But the HTML default classes should also match to avoid a flash. So update both the HTML classes AND the JS default.

---

## 2. Export PNG or SVG based on render mode

**Files:** [index.html](index.html)

- Change export button text from "Export PNG" to just "Export" (line 200), or dynamically update it
- Better: dynamically set button text to "Export PNG" or "Export SVG" when render mode changes
- In `setRenderMode()`, update the export button label
- In the export click handler (lines 682-691):
  - If `renderMode === 'canvas'`: existing PNG export logic (unchanged)
  - If `renderMode === 'svg'`: serialize SVG from `svgOutputEl.innerHTML`, create a Blob, download as `.svg`

**SVG export logic:**
```js
const svgMarkup = svgOutputEl.innerHTML;
const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.download = `card-s${seedInput.value}-h${c.hue}-l${s.logoNonce}.svg`;
link.href = url;
link.click();
URL.revokeObjectURL(url);
```

---

## 3. New logo style: "Variable Dot Mask" (style 15)

**Files:** [modules/symbols.js](modules/symbols.js), [index.html](index.html)

Based on existing Dot Mask (style 9), but with variable dot sizes:

### Algorithm
1. Generate harmonics and blob shape identically to Dot Mask
2. Seed-derive `sizeSteps` = `rng.int(2, 7)` — number of discrete size levels
3. Seed-derive `minDotR` and `maxDotR` (bigger than current Dot Mask — e.g., `cell * 0.30` to `cell * 0.52`)
4. Precompute size steps: `sizes[i] = lerp(minDotR, maxDotR, i / (sizeSteps - 1))`
5. For each dot in the grid, pick a random step: `sizes[rng.int(0, sizeSteps - 1)]`
6. Ghost dots outside blob use smallest size step at low opacity

### Implementation in symbols.js
- Add `drawVariableDotMask` function after `drawDotMask` (~line 509)
- Add to `variants` array at index 15 (line 36)

### UI updates in index.html
- Add `<option value="15">Variable Dot Mask</option>` to `#logo-style` select (after line 122)
- Add `'Variable Dot Mask'` to `LOGO_NAMES` array (line 266-269)
- Update `stylePRNG.int(0, 14)` → `stylePRNG.int(0, 15)` in `updateLogoName()` (line 353)

### card.js update
- Update `stylePRNG.int(0, 14)` → `stylePRNG.int(0, 15)` in auto-pick logic

**Note:** This changes auto-pick range, meaning existing seeds will get different auto-picked styles. This is unavoidable when adding a new style.

---

## Verification

1. Open the page — SVG should be selected by default, card renders as SVG
2. Toggle to Canvas — should work as before
3. In SVG mode, click Export — should download an `.svg` file; button should say "Export SVG"
4. In Canvas mode, click Export — should download a `.png` file; button should say "Export PNG"
5. Select "Variable Dot Mask" from logo style dropdown — should show dots with varying sizes
6. Change seed several times — dot size step count should vary (2-7 steps visible)
7. In Auto mode, style 15 should occasionally be picked

## Files to modify
- [index.html](index.html) — render mode default, export logic, dropdown, LOGO_NAMES
- [modules/symbols.js](modules/symbols.js) — new `drawVariableDotMask` function, add to variants array
- [modules/card.js](modules/card.js) — update auto-pick range from 14 to 15
