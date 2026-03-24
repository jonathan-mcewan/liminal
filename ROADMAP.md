# Roadmap

A living document tracking where the Access Card Generator has been and where it's headed.

---

## Phase 0 — Foundation ✅

The core engine: a single seed produces a unique, deterministic card every time.

- Seed-driven procedural generation (mulberry32 PRNG)
- Dark / light theme with seed-derived colour palette
- Hue, saturation, and lightness sliders with per-parameter override and reset
- URL persistence — every card is a shareable link
- Canvas rendering with PNG export
- 3 card size presets (ID Card, Square, MOO)
- Lanyard hole toggle
- Keyboard shortcuts (17 bindings) with toggleable hotkey legend

---

## Phase 1 — Visual Identity ✅

Giving each card a distinctive mark.

- 25 logo styles — geometric, procedural, icon-based, and ASCII
- Logo seed (nonce) for independent variation without changing the card
- Logo scale control (25–200%)
- Auto / None / manual logo selection via visual grid picker
- 5 artifact types (streak, line bundle, corner wedge, arc slice, grid fragment)
- Artifact seed, count, scale, and opacity controls
- Name and job title text fields

---

## Phase 2 — Layered Textures ✅

Backgrounds and patterns that stack to create depth.

- 16 background texture styles (noise, marble, caustics, plasma, topographic, and more)
- Background zoom, brightness, contrast, and blur controls
- 16 pattern overlay styles (halftone, guilloche, moiré, chevron, and more)
- Pattern seed, scale, opacity, and two-tone toggle
- Visual grid pickers for both backgrounds and patterns

---

## Phase 3 — Polish & Interaction ✅

Making the card feel like a real object.

- SVG render mode with vector export
- 3D tilt-on-hover and click-to-flip animation
- Card back face — magnetic stripe, hatched pattern, brand mark, procedural barcode
- Responsive layout for mobile and desktop viewports
- Phosphor Duotone icon set for the Icons logo style

---

## Phase 4 — Customisation Depth

Finer control over every visual layer.

- [ ] **Symbol hue drift override** — shift the logo colour independently from the card hue
- [ ] **Symbol lightness override** — control logo brightness separately from card lightness
- [ ] **Artifact type lock** — pin all artifacts to a single type (e.g. all arc slices)
- [x] **Background blend mode** — choose how textures composite (multiply, screen, overlay, etc.)
- [x] **Pattern rotation** — angle the pattern layer independently
- [ ] **Custom card dimensions** — free-form width × height input beyond the 3 presets
- [x] **Card border radius control** — adjust corner rounding from sharp to pill

---

## Phase 5 — Templates & Theming

One-click starting points and collections.

- [x] **Curated theme presets** — 20 named presets in a collapsible panel (Corporate, Midnight, Neon, Pastel, Brutalist, etc.)
- [ ] **Colour harmony modes** — complementary, analogous, and triadic palette generation
- [ ] **Lucky dip gallery** — grid of random seeds to browse and pick from
- [ ] **Favourites** — star seeds to a local collection, browse and recall later
- [ ] **Import / export settings** — JSON blob of all overrides for sharing full configs

---

## Phase 6 — Export & Sharing

Getting cards out into the world.

- [ ] **Batch export** — generate and download N cards as a ZIP
- [x] **High-DPI PNG** — 1×, 2×, 3× resolution selector for print-quality raster export
- [ ] **PDF export** — single or multi-card PDF with crop marks for print
- [x] **Copy as image** — clipboard copy (PNG) for quick paste into docs or chat (keyboard shortcut: I)
- [ ] **QR code on back** — encode the card URL into a QR code on the back face
- [ ] **OG image meta tag** — dynamic preview image when sharing card URLs on social

---

## Phase 7 — Quality of Life

Small things that make a big difference.

- [ ] **Undo / redo** — step through parameter changes (Ctrl+Z / Ctrl+Shift+Z)
- [ ] **Seed history** — remember recently visited seeds with browser back/forward
- [ ] **Comparison mode** — side-by-side view of two seeds or override states
- [ ] **Randomise single layer** — re-roll just the logo, pattern, or background
- [ ] **Slider fine-tune** — hold Shift while dragging for precise control
- [ ] **WCAG contrast info** — show contrast ratio for text against card background
- [ ] **Colour-blind preview** — simulate deuteranopia / protanopia / tritanopia
- [ ] **Touch gestures** — swipe to shuffle, pinch to scale on mobile
- [ ] **UI theme toggle** — light / dark UI independent of card theme
- [ ] **Performance budget** — lazy-render thumbnail grids, debounce rapid slider input

---

## Phase 8 — Advanced Generation

Pushing the generative system further.

- [ ] **Text style controls** — font weight, size, letter-spacing, position
- [ ] **Multi-logo composition** — place 2–3 smaller logos in a layout
- [ ] **Photo overlay** — import a headshot with circular or rounded mask
- [ ] **Holographic foil effect** — animated iridescent shimmer on hover
- [ ] **Emboss / deboss simulation** — inner shadow + highlight for a stamped-in look
- [ ] **Generative card back** — procedural back designs beyond the current magnetic stripe

---

## Phase 9 — Enshitification

The inevitable final form.

- [ ] **Mandatory account creation** to view your own card
- [ ] **AI-powered seed suggestions** that are always worse than random
- [ ] **Premium tier** to unlock the colour slider past 180°
- [ ] **Blockchain-verified card authenticity** for a card that doesn't exist
- [ ] **NFT export** — mint your procedural rectangle on-chain (gas fees extra)
- [ ] **Subscription model** for the shuffle button (3 free shuffles/day)
- [ ] **Interstitial ads** between the front and back face flip animation
- [ ] **"Upgrade to Pro" modal** every time you press Export
- [ ] **Telemetry on slider movements** — we need to know how you feel about saturation
- [ ] **Remove keyboard shortcuts** — re-sell them as a browser extension
