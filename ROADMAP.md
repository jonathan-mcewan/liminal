# LIMINAL — Product Roadmap

## Current State

Pure client-side vanity card generator. Vanilla ES modules, Canvas 2D + SVG, no build step, no backend, no auth, no tracking. All state lives in the URL.

---

## Phase 0 — "The Gift" (Now)

Free, open, stateless. Users get:
- Unlimited card generation from seed + overrides
- 25 logo styles, 16+ pattern types, 5 artifact types
- Full color/theme control
- SVG and PNG export
- Shareable URLs encoding complete card state
- 3D card interaction (tilt + flip)
- Three card sizes (ID, Square, MOO)

**Revenue: $0. The product is pure.**

---

## Phase 1 — Soft Monetization (No backend required)

Goal: build audience, establish value, introduce the concept of paying.

- **Analytics:** Privacy-respecting analytics (Plausible or Umami) for usage data
- **Gallery:** Public "share your card" gallery — social proof, SEO, virality
- **Watermark on free PNG export:** Exported PNGs get a small "made with liminal" mark; SVG stays clean
- **Tip jar:** Ko-fi / Buy Me a Coffee link
- **Email capture:** "Get notified about new logo styles" — the list is the asset

**Revenue: ~$0–50/month. But you have emails and traffic data.**

---

## Phase 2 — Real Monetization (Requires auth + backend)

Goal: create things worth paying for without degrading the free tier.

**Infrastructure needed:** Auth (magic link or OAuth), small backend (Cloudflare Workers), Stripe.

- **Premium logo/pattern packs:** Free tier keeps ~10 logo styles. New packs (Geometric, Organic, Minimal, Retro) $3–5 each or bundle
- **Custom color palettes:** Curated preset packs ($2/pack)
- **Hi-res PNG export:** Free = 1×, paid = 2×/4×
- **Bulk export:** Generate a whole team's cards from a CSV ($9.99 one-time)
- **Custom fonts:** Free = 2 fonts, paid unlocks 8+
- **API access:** Headless card generation for devs ($19/mo)

**Revenue: $200–2k/month if marketed.**

---

## Phase 3 — Platform / B2B Growth

Goal: exponential growth via network effects and B2B.

- **Teams / Orgs:** Upload company logo, lock brand colors, generate cards for all employees ($49/mo per org)
- **Event badges:** Conference organizers generate attendee badges from registration lists (per-event pricing)
- **Embed widget:** `<liminal-card>` web component for blogs/portfolios; free drives traffic, premium styles need paid embed license
- **Template marketplace:** Designers sell custom card templates; 30% platform cut
- **Integrations:** Slack bot (`/card @alice`), Figma plugin, Notion embed
- **"Powered by Liminal"** on every free embed — viral loop

**Revenue: $5–50k/month. Enterprise customers who can't easily leave.**

---

## Phase 4 — The Enshittification (Inevitable)

The classic Doctorow three-act structure.

### Act 1 — Degrade the free tier

- Free export limited to 3/day. Counter resets at midnight UTC (not your midnight, never your midnight)
- Watermark grows 40% larger. Now says "LIMINAL FREE" in Impact font
- SVG export moved to paid tier. "Due to server costs" (there is no server)
- Gallery cards from free users ranked below paid users
- Add a 3-second "generating..." spinner on free tier (the card rendered instantly — the spinner is a lie)

### Act 2 — Squeeze paying customers

- Price increase "to continue investing in the platform." $12/mo → $19/mo
- "Logo Style of the Month" — one premium style rotates into free monthly, creating FOMO
- Bulk export now requires Teams plan ($49/mo). Was $9.99 one-time. "One-time purchases are being sunset"
- API rate limits halved. Need more? Enterprise tier: "Contact Sales"
- Add "AI-powered card suggestions" nobody asked for. It's a random seed with extra steps. Requires Pro plan

### Act 3 — Sell the users

- "Sponsored card styles" — brands pay to have their aesthetic as a template
- "Recommended for you" cards in the gallery (ads)
- Email list "shared with partners"
- Analytics data packaged as "industry insights" sold to design tool companies
- Free tier now requires an account. The anonymous URL-sharing era is over
- Cookie banner that's 40% of the viewport on mobile

---

## Phase 5 — The Corpse (Post-Enshittification)

- Open-source competitor appears (it's your Phase 0 code, which was never minified)
- Core users migrate. "Remember when Liminal was just a simple card generator?"
- Hacker News post: "Liminal: A Cautionary Tale" (2,847 points)
- Pivot to "Enterprise Identity Platform." New landing page with stock photos of people pointing at whiteboards
- Acqui-hired by Canva for the team. Product shut down 11 months later
- Someone forks the original on GitHub. It gets more stars than the original ever had

---

## Feature Gating Strategy

The line between Phase 2 and Phase 4. Hold this line.

- **Client-side gating** for cosmetic features (logo packs, palettes, fonts) — assets simply not shipped to free tier
- **Server-side gating** for export features (hi-res, bulk, API) — generation happens server-side for paid tiers
- **URL sharing stays free and ungated** — never break the core sharing/preview loop, only gate export and customization depth
- **Free tier must always feel complete** — not a crippled demo. The free card should look good; paid adds variety and workflow features

---

## Strategic Notes

- The sweet spot is Phase 2 with restraint. Premium packs + bulk export + hi-res is real revenue without platform complexity
- The moment you add accounts and a backend, maintenance burden 10×'s and enshittification pressure becomes gravitational
- B2B (teams/events) is where the real money is — individual creator pricing is a race to the bottom
- Keep the core loop (seed → card → share URL) free and fast forever. That's the moat
