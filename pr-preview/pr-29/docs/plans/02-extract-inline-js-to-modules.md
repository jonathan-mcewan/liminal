# Plan: Extract inline JS into ES modules

## Context

`index.html` contains ~644 lines of inline JavaScript handling all UI orchestration, state management, URL sync, and event wiring. The rendering/drawing modules (`card.js`, `background.js`, `symbols.js`, etc.) are already clean ES modules. The goal is to extract the inline JS into well-organized modules, reducing `index.html` to a thin shell of DOM wiring and initialization.

---

## New modules to create

### 1. `modules/constants.js` — Pure values and helpers (no deps)

**Extract from index.html:**
- `CARD_SIZES` object (line 273)
- `LOGO_NAMES` array (line 313)
- `hashString(str)` (line 292)
- `hueToColorName(hue)` (line 512)
- `artCountLabel(v)` (line 731)

**Exports:** All five as named exports. **Imports:** None.

---

### 2. `modules/state.js` — Override state + seed/color derivation

**Extract from index.html:**
- `colorOverrides` object (line 310)
- `seedOverrides` object (line 311)
- `clearAllOverrides()` (line 589)
- `deriveSeedParams(seed)` (line 320)
- `getEffectiveColor(seed)` (line 329) — **change:** accept `seed` param instead of calling `getSeed()` internally
- `getEffectiveSeeds(seed)` (line 348) — **change:** accept `seed` param

**Exports:** All six as named exports. The override objects are exported as `const` references — mutations from any importer are shared (same object).

**Imports:** `makePRNG` from `prng.js`, `deriveColorParams` from `card.js`.

---

### 3. `modules/ui-sync.js` — Slider/display/button sync + param building

**Extract from index.html:**
- `getSeed(seedInput)` (line 300) — **change:** accept `seedInput` element as param
- `updateThemeSeg(isDark, lightBtn, darkBtn)` (line 358)
- `updateColorSliders(dom)` (line 363)
- `updateSeedInputs(dom)` (line 378)
- `updateResetButtons(dom)` (line 384)
- `updateLogoName(dom)` (line 396)
- `getCardDescriptor(dom)` (line 522)
- `updateDescriptor(dom)` (line 537)
- `getFrameDims(cardSizeSelect)` (line 546)
- `buildParams(dom, transparent)` (line 408) — renamed from `params`

**DOM access pattern:** All functions accept a `dom` object containing the cached element references. Created once in `index.html` and passed through.

**Imports:** `makePRNG` from `prng.js`, `CARD_SIZES`, `LOGO_NAMES`, `hashString`, `hueToColorName` from `constants.js`, `colorOverrides`, `seedOverrides`, `getEffectiveColor`, `getEffectiveSeeds` from `state.js`.

---

### 4. `modules/url-sync.js` — URL read/write

**Extract from index.html:**
- `applyQueryString(dom)` (line 444)
- `syncURL(dom, push)` (line 482)

**Imports:** `colorOverrides`, `seedOverrides`, `clearAllOverrides` from `state.js`, `artCountLabel` from `constants.js`.

---

## What remains in `index.html` (~100 lines)

```
imports (6 lines)
DOM cache as `dom` object (~30 lines)
renderMode variable + setRenderMode() (~12 lines)
render() function (~20 lines)
event listeners (~30 lines — thin one-liners wiring to state mutations + render)
popstate handler (5 lines)
init block (8 lines)
```

The `render()` function stays inline because it's the top-level orchestration point that ties together `generateCard`, `SvgContext`, `syncURL`, `updateLogoName`, and `updateDescriptor`. Event handlers stay because they're thin glue between DOM events and module calls.

---

## Changes to existing modules

**None required.** The existing modules (`card.js`, `background.js`, `symbols.js`, `text.js`, `prng.js`, `utils.js`, `svg-ctx.js`) have clean interfaces and don't need modification.

### Optional: Split `symbols.js` (36 KB)

Each of the 17 `drawFoo` functions is independent. Could split into `modules/symbols/index.js` (dispatcher) + one file per symbol. **Recommendation:** Skip unless frequently editing individual symbols — the single file with section markers works fine for a no-build-step app, and 17 extra HTTP requests add latency.

---

## Implementation order

1. Create `modules/constants.js` — extract pure values/helpers
2. Create `modules/state.js` — extract override state + derivation functions
3. Create `modules/ui-sync.js` — extract UI sync functions, introduce `dom` param pattern
4. Create `modules/url-sync.js` — extract URL read/write
5. Refactor `index.html` — replace 644 lines with imports + dom object + render + events + init
6. Test end-to-end: seed changes, slider overrides, URL sharing, export, browser back/forward

## Files to modify

- `index.html` — major reduction (644 → ~100 lines of JS)

## Files to create

- `modules/constants.js`
- `modules/state.js`
- `modules/ui-sync.js`
- `modules/url-sync.js`

## Verification

1. Open the app via HTTP server — card renders correctly
2. Change seed — all overrides clear, new card appears
3. Override hue/saturation/theme — reset buttons appear, URL updates with override params only
4. Reset individual overrides — reverts to seed-derived values
5. Copy link → paste in new tab — identical card
6. Browser back/forward — state restores correctly
7. Export SVG and PNG — both download correctly
8. Shuffle — new random seed, overrides survive
9. Reset All — returns to defaults
