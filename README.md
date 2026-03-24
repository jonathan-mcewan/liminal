# LIMINAL

Procedural access card generator. One seed, one unique card.

![Status: Active Development](https://img.shields.io/badge/status-active%20development-brightgreen)
![License: Custom](https://img.shields.io/badge/license-custom%20(no%20AI%20training)-blue)
![No Backend](https://img.shields.io/badge/backend-none-lightgrey)
![Build: Zero](https://img.shields.io/badge/build%20step-none-lightgrey)

---

## What it does

Generates deterministic, shareable identity cards from a numeric seed. Every visual parameter — colour, logo, background texture, pattern overlay, artifacts — derives from the seed with full user override. The entire card state lives in the URL.

## Stack

| Layer | Tech |
|-------|------|
| Rendering | Canvas 2D + SVG (dual mode) |
| Language | Vanilla ES modules |
| Build | None — served directly via HTTP |
| State | URL query params + localStorage |
| Backend | None |
| Dependencies | Lucide icons (CDN) |

## Quick start

```bash
npx serve .
```

Open `http://localhost:3000`. ES modules require a server — `file://` won't work.

## Features

**Generation** — 25 logo styles, 16 background textures, 19 pattern overlays, 11 artifact types, 20 colour presets. Every combination is seed-deterministic.

**Controls** — Hue, saturation, lightness, brightness, contrast, blur, blend mode, pattern rotation, logo scale, emboss/deboss, border radius. Each parameter has a seed-derived default with per-control override and reset.

**Export** — SVG vector, PNG raster (1×/2×/3×), clipboard copy, JSON settings import/export. Shareable URLs encode complete card state.

**Interaction** — 3D tilt on hover, click to flip, card back with magnetic stripe and barcode. Favourites saved to localStorage.

**Sizes** — ID Card (standard), Square, MOO (business card).

## Keyboard shortcuts

<kbd>Space</kbd> Shuffle · <kbd>E</kbd> Export · <kbd>R</kbd> Re-render · <kbd>C</kbd> Copy link · <kbd>Backspace</kbd> Reset · <kbd>F</kbd> Flip · <kbd>←→</kbd> Seed ±1 · <kbd>↑↓</kbd> Seed ±10 · <kbd>D</kbd> Dark/light · <kbd>I</kbd> Copy image · <kbd>J</kbd> Export JSON · <kbd>B</kbd> Favourites · <kbd>?</kbd> Help

## Project structure

```
index.html          — app shell + UI wiring
styles.css          — layout + component styles
modules/
  card.js           — render orchestrator, PRNG setup
  background.js     — noise blobs, artifacts, gloss
  bg-styles.js      — 16 background texture renderers
  patterns.js       — 19 pattern overlay renderers
  symbols.js        — 25 logo style renderers
  text.js           — name + title layout
  prng.js           — mulberry32 PRNG
  svg-ctx.js        — Canvas 2D → SVG shim
  constants.js      — names, presets, sizes
  card-3d.js        — tilt + flip interaction
  card-back.js      — back face renderer
  favourites.js     — localStorage CRUD
  settings-io.js    — JSON import/export
  url-sync.js       — URL ↔ state sync
  ui-sync.js        — descriptor + slider sync
  state.js          — shared state
  utils.js          — colour + geometry helpers
  icon-paths.js     — Phosphor icon SVG paths
  svg-path.js       — SVG path utilities
icons/phosphor/     — duotone icon SVGs
```

## License

Custom license — free for human use, modification, and redistribution. **AI training, scraping, and dataset collection are prohibited.** See [LICENSE](LICENSE).
