/**
 * ai-panel-bg.js — Procedurally generates an SVG background for the AI chat panel.
 *
 * Renders an "ancient tech strata" growth pattern: vertical data columns rise
 * from the bottom like monoliths or circuit traces, with horizontal strata
 * lines suggesting geological age layers. Growth rings, micro-circuitry, and
 * spore particles fill the spaces between. The design reads as something that
 * has been growing silently for centuries — archaeological tech.
 */

const CYAN = '#50c8ff';
const TEAL = '#3aafb8';      // cooler secondary — replaces amber
const DIM  = '#3a6a8a';      // desaturated deep blue for strata
const W = 340;
const H = 600;

/* ── Deterministic pseudo-random (position-seeded) ─────────────────── */

/** Simple hash for deterministic variation from x,y coordinates. */
function hash(x, y) {
  let h = (x * 2654435761 ^ y * 340573321) >>> 0;
  h = ((h >> 16) ^ h) * 0x45d9f3b >>> 0;
  return (h & 0xffff) / 0xffff; // 0..1
}

/* ── SVG serialisation ───────────────────────────────────────────── */

function svgEl(tag, attrs, children = '') {
  const a = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
  return children
    ? `<${tag} ${a}>${children}</${tag}>`
    : `<${tag} ${a}/>`;
}

function pathEl(d, stroke, sw, so, extra = '') {
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-opacity="${so}"${extra}/>`;
}

function lineEl(x1, y1, x2, y2, stroke, sw, so) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" stroke-opacity="${so}"/>`;
}

function circleEl(cx, cy, r, fill, fo, extra = {}) {
  const a = Object.entries(extra).map(([k, v]) => `${k}="${v}"`).join(' ');
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" fill-opacity="${fo}" ${a}/>`;
}

function microRing(cx, cy, r, opacity) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${CYAN}" stroke-width="0.3" stroke-opacity="${opacity}"/>`;
}

/* ── Defs: gradients, masks, filters ─────────────────────────────── */

function buildDefs() {
  return `<defs>
  <radialGradient id="pb-core" cx="50%" cy="95%" r="20%">
    <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.30"/>
    <stop offset="40%" stop-color="${CYAN}" stop-opacity="0.08"/>
    <stop offset="100%" stop-color="${CYAN}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="pb-core-wide" cx="50%" cy="98%" r="60%">
    <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.06"/>
    <stop offset="60%" stop-color="${TEAL}" stop-opacity="0.015"/>
    <stop offset="100%" stop-color="${TEAL}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="pb-upfade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="white" stop-opacity="0"/>
    <stop offset="15%" stop-color="white" stop-opacity="0.15"/>
    <stop offset="40%" stop-color="white" stop-opacity="0.7"/>
    <stop offset="100%" stop-color="white" stop-opacity="1"/>
  </linearGradient>
  <linearGradient id="pb-hfade" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="white" stop-opacity="0.15"/>
    <stop offset="12%" stop-color="white" stop-opacity="1"/>
    <stop offset="88%" stop-color="white" stop-opacity="1"/>
    <stop offset="100%" stop-color="white" stop-opacity="0.15"/>
  </linearGradient>
  <linearGradient id="pb-col-fade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${CYAN}" stop-opacity="0"/>
    <stop offset="70%" stop-color="${CYAN}" stop-opacity="0.6"/>
    <stop offset="100%" stop-color="${CYAN}" stop-opacity="1"/>
  </linearGradient>
  <mask id="pb-vm">
    <rect width="${W}" height="${H}" fill="url(#pb-upfade)"/>
    <rect width="${W}" height="${H}" fill="url(#pb-hfade)" style="mix-blend-mode:multiply"/>
  </mask>
  <filter id="pb-glow"><feGaussianBlur stdDeviation="5" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="pb-glow-sm"><feGaussianBlur stdDeviation="2" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="pb-glow-lg"><feGaussianBlur stdDeviation="8" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;
}

/* ── Vertical growth columns ────────────────────────────────────── */

/**
 * Column definitions spread across the panel width.
 * Each column is a vertical line growing from the bottom to a varying height.
 * Think: data monoliths, ancient circuit traces, tree trunks.
 */
function buildColumns() {
  const parts = [];
  // Column specs: x position (fraction of W), height (fraction of H from bottom),
  // stroke width, base opacity, has growth rings, has circuitry
  const columns = [
    // ── outer sentinels — thin, short, faint ──
    { x: 0.06, h: 0.12, sw: 0.2, so: 0.04, rings: false, circuit: false },
    { x: 0.94, h: 0.10, sw: 0.2, so: 0.04, rings: false, circuit: false },
    { x: 0.11, h: 0.22, sw: 0.3, so: 0.06, rings: true,  circuit: false },
    { x: 0.89, h: 0.20, sw: 0.3, so: 0.06, rings: true,  circuit: false },
    // ── mid-field columns — moderate ──
    { x: 0.18, h: 0.35, sw: 0.4, so: 0.08, rings: true,  circuit: true  },
    { x: 0.82, h: 0.32, sw: 0.4, so: 0.08, rings: true,  circuit: true  },
    { x: 0.25, h: 0.45, sw: 0.5, so: 0.10, rings: true,  circuit: true  },
    { x: 0.75, h: 0.42, sw: 0.5, so: 0.10, rings: true,  circuit: true  },
    // ── inner columns — taller, bolder ──
    { x: 0.33, h: 0.55, sw: 0.6, so: 0.13, rings: true,  circuit: true  },
    { x: 0.67, h: 0.52, sw: 0.6, so: 0.13, rings: true,  circuit: true  },
    { x: 0.40, h: 0.65, sw: 0.7, so: 0.15, rings: true,  circuit: true  },
    { x: 0.60, h: 0.62, sw: 0.7, so: 0.15, rings: true,  circuit: true  },
    // ── central pillars — tallest, most detailed ──
    { x: 0.45, h: 0.78, sw: 0.8, so: 0.18, rings: true,  circuit: true  },
    { x: 0.55, h: 0.75, sw: 0.8, so: 0.18, rings: true,  circuit: true  },
    // ── the spine — dead center ──
    { x: 0.50, h: 0.88, sw: 1.0, so: 0.22, rings: true,  circuit: true  },
  ];

  for (const col of columns) {
    const cx = col.x * W;
    const botY = H;
    const topY = H - col.h * H;
    const h = hash(Math.round(cx), 0);

    // atmospheric glow behind taller columns
    if (col.h > 0.3) {
      parts.push(lineEl(cx, botY, cx, topY + 10, CYAN, col.sw * 5, col.so * 0.06));
    }

    // main vertical line
    parts.push(lineEl(cx, botY, cx, topY, CYAN, col.sw, col.so));

    // teal ghost echo — slight offset like a weathered double
    const echoOff = (h > 0.5 ? 1.5 : -1.5);
    parts.push(lineEl(cx + echoOff, botY, cx + echoOff, topY + col.h * H * 0.15,
      TEAL, col.sw * 0.3, col.so * 0.25));

    // ── growth rings — horizontal tick marks at intervals along the column ──
    if (col.rings) {
      const ringCount = Math.floor(col.h * 12) + 2;
      for (let r = 0; r < ringCount; r++) {
        const t = (r + 1) / (ringCount + 1);
        const ry = botY - t * col.h * H;
        const rh = hash(Math.round(cx * 3), Math.round(ry * 7));
        const tickW = 3 + rh * 6 + (1 - t) * 4; // wider near base (older growth)
        const tickOp = col.so * (0.3 + (1 - t) * 0.4); // brighter near base
        const tickSw = 0.2 + (1 - t) * 0.15;

        // alternating left/right or both sides
        const side = rh > 0.65 ? 1 : rh > 0.35 ? -1 : 0;
        if (side >= 0) parts.push(lineEl(cx, ry, cx + tickW, ry, CYAN, tickSw, tickOp));
        if (side <= 0) parts.push(lineEl(cx, ry, cx - tickW, ry, CYAN, tickSw, tickOp));

        // occasional node dot at a ring
        if (rh > 0.7 && t < 0.8) {
          const dotSide = rh > 0.85 ? 1 : -1;
          parts.push(circleEl(cx + dotSide * (tickW + 2), ry, 0.6, CYAN, tickOp * 0.6));
        }
      }
    }

    // ── micro-circuitry — tiny horizontal branches near the top ──
    if (col.circuit && col.h > 0.25) {
      const circuitY = topY + col.h * H * 0.08;
      const ch = hash(Math.round(cx * 5), Math.round(circuitY));
      const dir = ch > 0.5 ? 1 : -1;
      const len = 8 + ch * 16;

      // horizontal trace
      parts.push(lineEl(cx, circuitY, cx + dir * len, circuitY,
        CYAN, 0.25, col.so * 0.4));
      // vertical drop at the end
      parts.push(lineEl(cx + dir * len, circuitY, cx + dir * len, circuitY + 6 + ch * 8,
        CYAN, 0.2, col.so * 0.3));
      // terminal dot
      parts.push(circleEl(cx + dir * len, circuitY + 6 + ch * 8, 0.5, CYAN, col.so * 0.35));

      // second circuit trace lower down for taller columns
      if (col.h > 0.45) {
        const c2y = topY + col.h * H * 0.25;
        const c2h = hash(Math.round(cx * 9), Math.round(c2y));
        const d2 = c2h > 0.5 ? -dir : dir; // usually opposite direction
        const l2 = 5 + c2h * 12;
        parts.push(lineEl(cx, c2y, cx + d2 * l2, c2y, TEAL, 0.2, col.so * 0.2));
        parts.push(circleEl(cx + d2 * l2, c2y, 0.4, TEAL, col.so * 0.2));
      }
    }

    // column cap — small detail at the top
    if (col.h > 0.15) {
      const capH = hash(Math.round(cx * 11), 999);
      if (capH > 0.4) {
        // ring cap
        parts.push(microRing(cx, topY, 1.5 + col.h * 2, col.so * 0.3));
      }
      // dot cap
      parts.push(circleEl(cx, topY, 0.4 + col.h * 0.6, CYAN, col.so * 0.5));
    }
  }

  return parts.join('');
}

/* ── Horizontal strata — geological/data layers ────────────────── */

function buildStrata() {
  const parts = [];
  // Strata at various heights — thin horizontal lines spanning partial widths
  const strata = [
    { y: 0.92, x1: 0.02, x2: 0.98, so: 0.06 },
    { y: 0.85, x1: 0.08, x2: 0.92, so: 0.05 },
    { y: 0.78, x1: 0.12, x2: 0.88, so: 0.045 },
    { y: 0.70, x1: 0.18, x2: 0.82, so: 0.04 },
    { y: 0.62, x1: 0.22, x2: 0.78, so: 0.035 },
    { y: 0.54, x1: 0.28, x2: 0.72, so: 0.03 },
    { y: 0.46, x1: 0.32, x2: 0.68, so: 0.025 },
    { y: 0.38, x1: 0.36, x2: 0.64, so: 0.02 },
    { y: 0.30, x1: 0.40, x2: 0.60, so: 0.015 },
    { y: 0.22, x1: 0.43, x2: 0.57, so: 0.01 },
  ];

  for (const s of strata) {
    const y = s.y * H;
    const sh = hash(42, Math.round(y));

    // main stratum line
    parts.push(lineEl(s.x1 * W, y, s.x2 * W, y, DIM, 0.3, s.so));

    // occasional double-line (weathered strata effect)
    if (sh > 0.5) {
      parts.push(lineEl(s.x1 * W + 5, y + 2.5, s.x2 * W - 5, y + 2.5, DIM, 0.15, s.so * 0.5));
    }

    // scattered dots along the stratum — like embedded data points / fossils
    const dotCount = Math.floor(3 + sh * 4);
    for (let d = 0; d < dotCount; d++) {
      const dt = (d + 0.5) / dotCount;
      const dx = s.x1 * W + dt * (s.x2 - s.x1) * W;
      const dh = hash(Math.round(dx), Math.round(y * 3));
      if (dh > 0.6) {
        parts.push(circleEl(dx, y, 0.3 + dh * 0.3, CYAN, s.so * 0.8));
      }
    }
  }

  return parts.join('');
}

/* ── Connective filaments between columns ──────────────────────── */

function buildFilaments() {
  const parts = [];
  // Thin diagonal/curved lines connecting neighboring columns
  // Suggests data flow or mycelial connections between the monoliths
  const connections = [
    // [x1 frac, y1 frac from bottom, x2 frac, y2 frac from bottom]
    { x1: 0.33, y1: 0.35, x2: 0.40, y2: 0.42, so: 0.04 },
    { x1: 0.60, y1: 0.40, x2: 0.67, y2: 0.34, so: 0.04 },
    { x1: 0.40, y1: 0.50, x2: 0.45, y2: 0.58, so: 0.05 },
    { x1: 0.55, y1: 0.55, x2: 0.60, y2: 0.48, so: 0.05 },
    { x1: 0.45, y1: 0.65, x2: 0.50, y2: 0.72, so: 0.06 },
    { x1: 0.50, y1: 0.70, x2: 0.55, y2: 0.64, so: 0.06 },
    { x1: 0.25, y1: 0.28, x2: 0.33, y2: 0.35, so: 0.03 },
    { x1: 0.67, y1: 0.33, x2: 0.75, y2: 0.27, so: 0.03 },
    { x1: 0.18, y1: 0.18, x2: 0.25, y2: 0.25, so: 0.025 },
    { x1: 0.75, y1: 0.23, x2: 0.82, y2: 0.17, so: 0.025 },
  ];

  for (const c of connections) {
    const ax = c.x1 * W, ay = H - c.y1 * H;
    const bx = c.x2 * W, by = H - c.y2 * H;
    const mx = (ax + bx) / 2;
    const my = Math.min(ay, by) - 4;
    const d = `M${ax},${ay} Q${mx},${my} ${bx},${by}`;
    parts.push(pathEl(d, TEAL, 0.2, c.so));
    // junction dot at midpoint
    parts.push(circleEl(mx, my + 2, 0.35, CYAN, c.so * 0.7));
  }

  return parts.join('');
}

/* ── Spore particles — drift upward from the growth ────────────── */

function buildSpores() {
  const parts = [];
  // Scattered particles that suggest the growth is alive and releasing spores
  for (let i = 0; i < 40; i++) {
    const sx = hash(i * 7, 1001) * W;
    const sy = hash(i * 13, 2002) * H;
    // only show spores in the lower 80% (upper area is too faded)
    if (sy < H * 0.2) continue;
    const depth = sy / H; // 0=top, 1=bottom
    const r = 0.2 + depth * 0.4 + hash(i, 3003) * 0.2;
    const so = 0.005 + depth * 0.035;
    parts.push(circleEl(sx, sy, r, CYAN, so));
  }
  return parts.join('');
}

/* ── Core glow at the base ─────────────────────────────────────── */

function buildCore() {
  const parts = [];
  const cx = W / 2;
  const cy = H - 15;

  // wide atmospheric glow
  parts.push(circleEl(cx, cy, 180, 'url(#pb-core-wide)', 1));
  // tight core glow
  parts.push(circleEl(cx, cy, 18, 'url(#pb-core)', 1, { filter: 'url(#pb-glow)' }));
  // core ring
  parts.push(microRing(cx, cy, 10, 0.10));
  parts.push(microRing(cx, cy, 16, 0.05));
  parts.push(microRing(cx, cy, 24, 0.025));
  // core dot
  parts.push(circleEl(cx, cy, 3, CYAN, 0.12));

  // radiating tick marks from core
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    // only draw upper half — lower ticks go off-canvas
    if (Math.sin(angle) > 0.3) continue;
    const r1 = 20;
    const r2 = 26 + hash(i, 777) * 8;
    const x1 = cx + Math.cos(angle) * r1;
    const y1 = cy + Math.sin(angle) * r1;
    const x2 = cx + Math.cos(angle) * r2;
    const y2 = cy + Math.sin(angle) * r2;
    parts.push(lineEl(x1.toFixed(1), y1.toFixed(1), x2.toFixed(1), y2.toFixed(1),
      CYAN, 0.2, 0.06));
  }

  return parts.join('');
}

/* ── Main generator ──────────────────────────────────────────────── */

/**
 * Generate the full SVG string for the AI panel background.
 * @param {object} [opts]
 * @param {number} [opts.groupOpacity=1.0] - Overall opacity of the artwork
 * @returns {string} Complete SVG markup
 */
export function generatePanelBackground(opts = {}) {
  const { groupOpacity = 1.0 } = opts;

  const parts = [];

  // ── ambient atmosphere ──
  parts.push(buildCore());

  // ── strata — horizontal age layers (behind columns) ──
  parts.push(buildStrata());

  // ── vertical growth columns — the main event ──
  parts.push(buildColumns());

  // ── connective filaments between columns ──
  parts.push(buildFilaments());

  // ── spore particles ──
  parts.push(buildSpores());

  // assemble
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax meet">`,
    buildDefs(),
    `<g mask="url(#pb-vm)" opacity="${groupOpacity}">`,
    parts.join(''),
    '</g>',
    '</svg>',
  ].join('');
}

/**
 * Inject the generated SVG background into the AI panel element.
 * @param {HTMLElement} panelEl - The .ai-panel element
 */
export function injectPanelBackground(panelEl) {
  // Remove any existing procedural background
  const existing = panelEl.querySelector('.ai-panel-bg');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.className = 'ai-panel-bg';
  wrapper.innerHTML = generatePanelBackground();
  panelEl.insertBefore(wrapper, panelEl.firstChild);
}
