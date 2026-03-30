# Roadmap

A living document tracking where LIMINAL has been and where it's headed.

---

## Phase 0 — Foundation ✅

The core engine: a single seed produces a unique, deterministic card every time.

- Seed-driven procedural generation (mulberry32 PRNG)
- Dark / light theme with seed-derived colour palette
- Hue, saturation, and lightness sliders with per-parameter override and reset
- URL persistence — every card is a shareable link
- Canvas rendering with PNG export
- 3 card size presets (ID Card, Square, Credit)
- Lanyard hole toggle
- Keyboard shortcuts (17 bindings) with toggleable hotkey legend

---

## Phase 1 — Visual Identity ✅

Giving each card a distinctive mark.

- 25 logo styles — geometric, procedural, icon-based, and ASCII
- Logo seed (nonce) for independent variation without changing the card
- Logo scale control (25–200%)
- Auto / None / manual logo selection via visual grid picker
- 11 artifact types (streak, line bundle, corner wedge, arc slice, dot grid, rings, cross, chevron, diamond, dashes, bracket)
- Artifact seed, count, scale, and opacity controls
- Name and job title text fields

---

## Phase 2 — Layered Textures ✅

Backgrounds and patterns that stack to create depth.

- 16 background texture styles (noise, marble, caustics, plasma, topographic, and more)
- Background zoom, brightness, contrast, and blur controls
- 19 pattern overlay styles (halftone, guilloche, moiré, chevron, spiral field, liquid gradient, milky way, and more)
- Pattern seed, scale, opacity, and two-tone toggle
- Visual grid pickers for both backgrounds and patterns

---

## Phase 3 — Polish & Interaction ✅

Making the card feel like a real object.

- SVG render mode with vector export
- 3D tilt-on-hover and click-to-flip animation
- Card back face — magnetic stripe, hatched pattern, brand mark, procedural barcode, easter eggs (fine print, seal of adequacy, hologram, customer disservice)
- Hologram sheen overlay — iridescent conic-gradient that follows cursor tilt
- Responsive layout for mobile and desktop viewports
- Phosphor Duotone icon set for the Icons logo style

---

## Phase 4 — Customisation Depth 🔶

Finer control over every visual layer.

- [x] **Artifact type lock** — multi-select grid to pin artifacts to chosen types
- [x] **Background blend mode** — choose how textures composite (multiply, screen, overlay, etc.)
- [x] **Pattern rotation** — angle the pattern layer independently (0–360°)
- [x] **Card border radius control** — adjust corner rounding from sharp to pill
- [x] **Emboss / deboss** — stamped-in/raised look for the logo
- [ ] **Symbol hue drift override** — shift the logo colour independently from the card hue
- [ ] **Symbol lightness override** — control logo brightness separately from card lightness
- [ ] **Custom card dimensions** — free-form width × height input beyond the 3 presets

---

## Phase 5 — World-Building & Theming 🔶

One-click starting points, collections, and a fictional universe.

- [x] **Curated theme presets** — 20 named presets in a collapsible panel (Corporate, Midnight, Neon, Pastel, Brutalist, etc.)
- [x] **Favourites** — star seeds to a local collection, browse and recall later
- [x] **Import / export settings** — JSON blob of all overrides for sharing full configs
- [ ] **Procedural personas** — generate a full identity: name, title, department ("Bureau of Missing Staplers"), employee number (EMP-00000-WHY), access level ("LEVEL 4: MAY ADJUST THERMOSTAT"). One button fills the card.
- [ ] **Company name generator** — procedural org names ("Synergex", "Paradigm Dynamics", "OmniCorp Solutions") as a subtle card watermark or header
- [ ] **Serial number** — formatted badge number on the card back that encodes the seed in a bureaucratic format
- [ ] **Lucky dip gallery** — grid of random seeds to browse and pick from

---

## Phase 6 — Export & Sharing 🔶

Getting cards out into the world.

- [x] **High-DPI PNG** — 1×, 2×, 3× resolution selector for print-quality raster export
- [x] **Copy as image** — clipboard copy (PNG) for quick paste into docs or chat (keyboard shortcut: I)
- [ ] **Batch export** — generate and download N cards as a ZIP
- [ ] **QR code on back** — encode the card URL into a QR code on the back face
- [ ] **Ambient mode** — full-screen screensaver: card slowly rotates, lighting shifts, optionally cycles favourites. `A` key to toggle.

---

## Phase 7 — Physicality & Presence

The card feels like a real object you've been carrying for years.

- [ ] **Patina & wear** — seed-derived scuffs, scratches, fingerprints, coffee ring stains, bent corners. A "wear" slider from mint to well-loved.
- [ ] **Parallax tilt** — on hover, layers move at different depths. Background shifts slowly, logo floats, text sits on top.
- [ ] **Edge lighting** — metallic foil edge catch on the card border as you tilt. Like real laminated badges under fluorescents.
- [ ] **Animated hologram** — the back-face rosette rotates and shimmers in real-time with rAF, not just a static hover effect.
- [ ] **Seed history** — remember recently visited seeds with browser back/forward
- [ ] **Touch gestures** — swipe to shuffle, pinch to scale on mobile

---

## Phase 8 — Visual Experiments & Discovery

New render aesthetics and reasons to keep exploring.

- [x] **Holographic foil effect** — iridescent shimmer overlay on hover
- [x] **Generative card back** — procedural easter eggs (fine print, seal, hologram, customer disservice)
- [x] **Logo & text position controls** — 9-position grid (left/center/right × top/middle/bottom) for independent placement of logo and text block
- [x] **Text style controls** — font weight, size, letter-spacing
- [ ] **Multi-logo composition** — place 2–3 smaller logos in a layout
- [ ] **Glow / neon mode** — logo and text emit light with bloom bleed into the card. Dark cards only.
- [ ] **Duotone / risograph** — post-process filter reducing to 2–3 ink colours with halftone dots and slight misregistration. Print aesthetic.
- [ ] **Thermal print mode** — render as if from a receipt printer. Monochrome, slightly warped, fading at edges.
- [ ] **Card scanner** — RFID reader interaction: click to scan, approve/deny animation with absurd reason ("ACCESS GRANTED: You brought donuts" / "ACCESS DENIED: Mercury is in retrograde")
- [ ] **Card rarity score** — analyse the seed's feature combo rarity. Display as a subtle badge or in the descriptor. Turns seed browsing into a collection game.
- [ ] **Achievement toasts** — discover rare combos, get a subtle notification ("First hologram!", "Found the pigeon helpdesk")
- [ ] **Magnetic stripe encoding** — the decorative barcode visually encodes the seed, so different seeds produce visibly different stripe patterns
- [ ] **Seed story** — tiny prose blurb generated from the card's parameters ("A dark teal card bearing the Celtic Knot sigil, issued during the great stapler shortage of Q3")

---

## Phase 9 — Soft Monetization (No backend required)

Build audience, establish value, introduce the concept of paying.

- [ ] **Analytics** — privacy-respecting usage data (Plausible or Umami)
- [ ] **Gallery** — public "share your card" page — social proof, SEO, virality
- [ ] **Watermark on free PNG export** — small "made with liminal" mark; SVG stays clean
- [ ] **Tip jar** — Ko-fi / Buy Me a Coffee link
- [ ] **Email capture** — "Get notified about new logo styles" — the list is the asset

*Revenue: ~$0–50/month. But you have emails and traffic data.*

---

## Phase 10 — Real Monetization (Requires auth + backend)

Create things worth paying for without degrading the free tier.

Infrastructure needed: auth (magic link or OAuth), small backend (Cloudflare Workers), Stripe.

- [ ] **Premium logo/pattern packs** — free tier keeps ~10 logo styles; new packs (Geometric, Organic, Minimal, Retro) $3–5 each or bundle
- [ ] **Custom colour palettes** — curated preset packs ($2/pack)
- [ ] **Hi-res PNG export** — free = 1×, paid = 2×/4×
- [ ] **Bulk export** — generate a whole team's cards from a CSV ($9.99 one-time)
- [ ] **Custom fonts** — free = 2 fonts, paid unlocks 8+
- [ ] **API access** — headless card generation for devs ($19/mo)

*Revenue: $200–2k/month if marketed.*

---

## Phase 11 — Platform / B2B Growth

Exponential growth via network effects and B2B.

- [ ] **Teams / Orgs** — upload company logo, lock brand colours, generate cards for all employees ($49/mo per org)
- [ ] **Event badges** — conference organizers generate attendee badges from registration lists (per-event pricing)
- [ ] **Embed widget** — `<liminal-card>` web component for blogs/portfolios; free drives traffic, premium styles need paid embed license
- [ ] **Template marketplace** — designers sell custom card templates; 30% platform cut
- [ ] **Integrations** — Slack bot (`/card @alice`), Figma plugin, Notion embed
- [ ] **"Powered by Liminal"** on every free embed — viral loop

*Revenue: $5–50k/month. Enterprise customers who can't easily leave.*

---

## Phase 12 — The Enshittification

The inevitable final form, in three acts.

### Act 1 — Degrade the free tier

- [ ] **Rate-limit free exports** — 3/day, counter resets at midnight UTC (not your midnight, never your midnight)
- [ ] **Watermark growth** — 40% larger, now says "LIMINAL FREE" in Impact font
- [ ] **SVG export moved to paid tier** — "due to server costs" (there is no server)
- [ ] **Gallery ranking** — free users shown below paid users
- [ ] **Fake loading spinner** — 3-second "generating..." on free tier (the card rendered instantly — the spinner is a lie)

### Act 2 — Squeeze paying customers

- [ ] **Price increase** — "to continue investing in the platform." $12/mo → $19/mo
- [ ] **Premium tier** to unlock the colour slider past 180°
- [ ] **Logo Style of the Month** — one premium style rotates into free monthly, creating FOMO
- [ ] **Sunset one-time purchases** — bulk export now requires Teams plan ($49/mo)
- [ ] **API rate limits halved** — need more? Enterprise tier: "Contact Sales"
- [ ] **AI-powered seed suggestions** that are always worse than random — requires Pro plan
- [ ] **Subscription model** for the shuffle button (3 free shuffles/day)

### Act 3 — Sell the users

- [ ] **Mandatory account creation** to view your own card
- [ ] **Sponsored card styles** — brands pay to have their aesthetic as a template
- [ ] **"Recommended for you"** cards in the gallery (ads)
- [ ] **Email list "shared with partners"**
- [ ] **Analytics data** packaged as "industry insights" sold to design tool companies
- [ ] **Cookie banner** that's 40% of the viewport on mobile

---

## The Corpse (Post-Enshittification)

- Open-source competitor appears (it's your Phase 0 code, which was never minified)
- Core users migrate. "Remember when Liminal was just a simple card generator?"
- Hacker News post: "Liminal: A Cautionary Tale" (2,847 points)
- Pivot to "Enterprise Identity Platform." New landing page with stock photos of people pointing at whiteboards
- Acqui-hired by Canva for the team. Product shut down 11 months later
- Someone forks the original on GitHub. It gets more stars than the original ever had

---

## Feature Gating Strategy

The line between Phase 10 and Phase 12. Hold this line.

- **Client-side gating** for cosmetic features (logo packs, palettes, fonts) — assets simply not shipped to free tier
- **Server-side gating** for export features (hi-res, bulk, API) — generation happens server-side for paid tiers
- **URL sharing stays free and ungated** — never break the core sharing/preview loop, only gate export and customisation depth
- **Free tier must always feel complete** — not a crippled demo. The free card should look good; paid adds variety and workflow features

---

## Strategic Notes

- The sweet spot is Phase 10 with restraint. Premium packs + bulk export + hi-res is real revenue without platform complexity
- The moment you add accounts and a backend, maintenance burden 10×'s and enshittification pressure becomes gravitational
- B2B (teams/events) is where the real money is — individual creator pricing is a race to the bottom
- Keep the core loop (seed → card → share URL) free and fast forever. That's the moat
