/**
 * ai-panel-bg.js — Procedurally generates an SVG background for the AI chat panel.
 *
 * Renders an organic "ancient tech" growth pattern: a central spine with
 * branching tendrils, glowing junction nodes, amber energy traces, and
 * micro spore dots. The design grows upward from a core at the bottom,
 * fading out toward the top via a linear mask.
 */

const CYAN = '#50c8ff';
const AMBER = '#c8a03c';
const W = 340;
const H = 400;

/* ── Spine geometry ──────────────────────────────────────────────── */

/** Generate the central spine path as a series of junction points. */
export function buildSpinePoints(count = 7, baseY = 375, spacing = 48) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const y = baseY - i * spacing;
    // subtle lateral drift — alternates direction, grows smaller upward
    const x = W / 2 + (i % 2 === 0 ? -1 : 1) * (2 + Math.sin(i * 1.1) * 1.5);
    pts.push({ x, y });
  }
  return pts;
}

/** Build a smooth quadratic-bezier path string through points. */
export function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const cpx = (prev.x + cur.x) / 2 + (i % 2 === 0 ? 2 : -2);
    const cpy = (prev.y + cur.y) / 2;
    d += ` Q${cpx},${cpy} ${cur.x},${cur.y}`;
  }
  return d;
}

/* ── Branch geometry ─────────────────────────────────────────────── */

/**
 * Generate a primary branch curving outward from a spine junction.
 * @param {object} origin - {x, y} spine junction
 * @param {number} dir - -1 for left, +1 for right
 * @param {number} depth - 0 = deepest (longest), higher = shorter
 * @param {number} maxDepth - total branch levels
 */
export function buildBranch(origin, dir, depth, maxDepth) {
  const reach = 55 + 65 * (1 - depth / maxDepth); // shorter higher up
  const segments = depth < 2 ? 3 : 2;
  const pts = [{ x: origin.x, y: origin.y }];

  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const x = origin.x + dir * reach * t;
    const yDrift = (i % 2 === 0 ? -5 : 5) * (1 - depth / maxDepth);
    const y = origin.y + yDrift;
    pts.push({ x, y });
  }
  return pts;
}

/**
 * Generate a secondary tendril from a branch tip.
 * Uses tip position for deterministic vertical drift instead of Math.random().
 */
export function buildTendril(tip, dir) {
  const dx = dir * (12 + Math.abs(tip.x - W / 2) * 0.15);
  // Deterministic: alternate based on tip position hash
  const dy = ((Math.round(tip.x * 7 + tip.y * 13) % 2) === 0) ? -8 : 8;
  return [
    tip,
    { x: tip.x + dx * 0.5, y: tip.y + dy * 0.6 },
    { x: tip.x + dx, y: tip.y + dy },
  ];
}

/* ── Sub-branch geometry ────────────────────────────────────────── */

/**
 * Generate a shorter sub-branch splitting off a primary branch midpoint.
 * @param {object} origin - midpoint on a primary branch
 * @param {number} dir - -1 left, +1 right
 * @param {number} depth - branch depth level
 * @param {number} maxDepth - total levels
 */
export function buildSubBranch(origin, dir, depth, maxDepth) {
  const reach = 18 + 25 * (1 - depth / maxDepth);
  const dy = (depth % 2 === 0 ? -6 : 6) * (1 - depth / maxDepth);
  return [
    { x: origin.x, y: origin.y },
    { x: origin.x + dir * reach * 0.55, y: origin.y + dy * 0.5 },
    { x: origin.x + dir * reach, y: origin.y + dy },
  ];
}

/* ── Micro-artifact geometry ────────────────────────────────────── */

/**
 * Generate a small ring artifact (open circle) at a point.
 */
export function microRing(cx, cy, r, opacity) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#50c8ff" stroke-width="0.3" stroke-opacity="${opacity}"/>`;
}

/**
 * Generate a cluster of tiny dots around a point.
 */
export function dotCluster(cx, cy, count, spread, baseR, baseOpacity) {
  const dots = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist = spread * (0.5 + 0.5 * ((i * 7 + 3) % count) / count);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const r = baseR * (0.6 + 0.4 * (1 - i / count));
    dots.push(`<circle cx="${(cx + dx).toFixed(1)}" cy="${(cy + dy).toFixed(1)}" r="${r.toFixed(2)}" fill="#50c8ff" fill-opacity="${(baseOpacity * (0.5 + 0.5 * (1 - i / count))).toFixed(3)}"/>`);
  }
  return dots.join('');
}

/**
 * Generate small dash marks radiating from a point.
 */
export function dashMarks(cx, cy, count, len, opacity) {
  const marks = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x1 = cx + Math.cos(angle) * len * 0.4;
    const y1 = cy + Math.sin(angle) * len * 0.4;
    const x2 = cx + Math.cos(angle) * len;
    const y2 = cy + Math.sin(angle) * len;
    marks.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#50c8ff" stroke-width="0.25" stroke-opacity="${opacity}"/>`);
  }
  return marks.join('');
}

/* ── Opacity & stroke helpers ────────────────────────────────────── */

/** Map a depth index (0 = base) to a stroke opacity. */
export function branchOpacity(depth, maxDepth) {
  return 0.22 - (depth / maxDepth) * 0.16;
}

/** Map a depth index to a stroke width. */
export function branchWidth(depth, maxDepth) {
  return 1.0 - (depth / maxDepth) * 0.65;
}

/** Map a depth index to a node radius. */
export function nodeRadius(depth, maxDepth) {
  return 2.8 - (depth / maxDepth) * 2.0;
}

/** Map a depth index to a node fill opacity. */
export function nodeOpacity(depth, maxDepth) {
  return 0.22 - (depth / maxDepth) * 0.17;
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

function pathEl(d, stroke, sw, so) {
  return svgEl('path', { d, fill: 'none', stroke, 'stroke-width': sw, 'stroke-opacity': so });
}

function circleEl(cx, cy, r, fill, fo, extra = {}) {
  return svgEl('circle', { cx, cy, r, fill, 'fill-opacity': fo, ...extra });
}

/* ── Defs: gradients, masks, filters ─────────────────────────────── */

function buildDefs() {
  return `<defs>
  <radialGradient id="pb-core" cx="50%" cy="92%" r="18%">
    <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.36"/>
    <stop offset="30%" stop-color="${CYAN}" stop-opacity="0.12"/>
    <stop offset="70%" stop-color="${CYAN}" stop-opacity="0.03"/>
    <stop offset="100%" stop-color="${CYAN}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="pb-core-wide" cx="50%" cy="95%" r="55%">
    <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.08"/>
    <stop offset="50%" stop-color="${CYAN}" stop-opacity="0.02"/>
    <stop offset="100%" stop-color="${CYAN}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="pb-warm" cx="50%" cy="88%" r="60%">
    <stop offset="0%" stop-color="${AMBER}" stop-opacity="0.12"/>
    <stop offset="35%" stop-color="${AMBER}" stop-opacity="0.05"/>
    <stop offset="70%" stop-color="${AMBER}" stop-opacity="0.015"/>
    <stop offset="100%" stop-color="${AMBER}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="pb-warm-hi" cx="50%" cy="70%" r="40%">
    <stop offset="0%" stop-color="${AMBER}" stop-opacity="0.04"/>
    <stop offset="100%" stop-color="${AMBER}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="pb-upfade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="white" stop-opacity="0"/>
    <stop offset="25%" stop-color="white" stop-opacity="0.6"/>
    <stop offset="100%" stop-color="white" stop-opacity="1"/>
  </linearGradient>
  <linearGradient id="pb-hfade" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="white" stop-opacity="0.3"/>
    <stop offset="15%" stop-color="white" stop-opacity="1"/>
    <stop offset="85%" stop-color="white" stop-opacity="1"/>
    <stop offset="100%" stop-color="white" stop-opacity="0.3"/>
  </linearGradient>
  <mask id="pb-vm">
    <rect width="${W}" height="${H}" fill="url(#pb-upfade)"/>
    <rect width="${W}" height="${H}" fill="url(#pb-hfade)" style="mix-blend-mode:multiply"/>
  </mask>
  <filter id="pb-glow"><feGaussianBlur stdDeviation="5" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="pb-glow-sm"><feGaussianBlur stdDeviation="2" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;
}

/* ── Root tendrils (below the core, fanning to bottom edge) ──────── */

function buildRoots(coreX, coreY) {
  const roots = [];
  const fans = [
    { dx: -30, sw: 0.6, so: 0.14 },
    { dx: 30, sw: 0.6, so: 0.14 },
    { dx: -65, sw: 0.45, so: 0.10 },
    { dx: 65, sw: 0.45, so: 0.10 },
    { dx: -100, sw: 0.3, so: 0.07 },
    { dx: 100, sw: 0.3, so: 0.07 },
    { dx: -130, sw: 0.2, so: 0.04 },
    { dx: 130, sw: 0.2, so: 0.04 },
  ];
  for (const f of fans) {
    const tx = coreX + f.dx;
    const d = `M${coreX},${coreY + 5} Q${(coreX + tx) / 2},${H - 5} ${tx},${H}`;
    // soft glow echo on inner roots
    if (Math.abs(f.dx) <= 65) {
      roots.push(pathEl(d, CYAN, f.sw * 3, f.so * 0.12));
    }
    roots.push(pathEl(d, CYAN, f.sw, f.so));
    // warm amber trace on inner roots
    if (Math.abs(f.dx) <= 65) {
      roots.push(pathEl(d, AMBER, f.sw * 0.4, f.so * 0.3));
    }
  }
  return roots.join('');
}

/* ── Main generator ──────────────────────────────────────────────── */

/**
 * Generate the full SVG string for the AI panel background.
 * @param {object} [opts]
 * @param {number} [opts.branchLevels=6] - Number of branch levels along the spine
 * @param {number} [opts.spineSpacing=48] - Vertical spacing between spine junctions
 * @param {number} [opts.baseY=375] - Y position of the core
 * @param {number} [opts.groupOpacity=0.5] - Overall opacity of the artwork
 * @returns {string} Complete SVG markup
 */
export function generatePanelBackground(opts = {}) {
  const {
    branchLevels = 6,
    spineSpacing = 48,
    baseY = 375,
    groupOpacity = 1.0,
  } = opts;

  const parts = [];

  // Spine junctions (+ 1 for the topmost tip)
  const spine = buildSpinePoints(branchLevels + 1, baseY, spineSpacing);
  const coreX = spine[0].x;
  const coreY = spine[0].y;

  // ── ambient glow — layered for depth ──
  parts.push(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#pb-warm)' }));
  parts.push(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#pb-warm-hi)' }));
  parts.push(circleEl(coreX, coreY + 10, 180, 'url(#pb-core-wide)', 1));
  // secondary glow higher up — ties the upper branches into the atmosphere
  parts.push(circleEl(coreX, coreY - 120, 120, 'url(#pb-core-wide)', 0.5));

  // ── spine path ──
  const spineD = smoothPath(spine);
  // wide atmospheric halo
  parts.push(pathEl(spineD, CYAN, 8, 0.015));
  // warm undertone along the spine
  parts.push(pathEl(spineD, AMBER, 4, 0.025));
  // glow halo
  parts.push(pathEl(spineD, CYAN, 3, 0.06));
  // main spine stroke
  parts.push(pathEl(spineD, CYAN, 1.2, 0.28));

  // ── roots ──
  parts.push(buildRoots(coreX, coreY));

  // ── branches at each spine junction (skip first = core, skip last = tip) ──
  for (let i = 1; i < spine.length - 1; i++) {
    const depth = i - 1;
    const junction = spine[i];
    const sw = branchWidth(depth, branchLevels);
    const so = branchOpacity(depth, branchLevels);

    for (const dir of [-1, 1]) {
      // primary branch
      const branchPts = buildBranch(junction, dir, depth, branchLevels);
      const branchD = smoothPath(branchPts);
      // soft glow echo behind the branch for depth
      if (depth < 4) {
        parts.push(pathEl(branchD, CYAN, sw * 3.5, so * 0.08));
      }
      parts.push(pathEl(branchD, CYAN, sw, so));

      // amber trace — graduated fade across all levels for cohesion
      const amberFade = 1 - depth / branchLevels;
      if (amberFade > 0.15) {
        parts.push(pathEl(branchD, AMBER, sw * 0.55, so * 0.35 * amberFade));
      }

      // sub-branches from primary branch midpoints
      for (let m = 1; m < branchPts.length - 1; m++) {
        const mid = branchPts[m];
        // sub-branch angles away from the main branch direction
        const subDir = (m % 2 === 0) ? dir : -dir;
        const subPts = buildSubBranch(mid, subDir, depth, branchLevels);
        parts.push(pathEl(smoothPath(subPts), CYAN, sw * 0.4, so * 0.55));

        // sub-branch terminal node
        const subTip = subPts[subPts.length - 1];
        parts.push(circleEl(subTip.x, subTip.y, 0.5 + (1 - depth / branchLevels) * 0.3, CYAN,
          0.02 + (1 - depth / branchLevels) * 0.04));

        // amber on deep sub-branches
        if (depth < 2) {
          parts.push(pathEl(smoothPath(subPts), AMBER, sw * 0.2, so * 0.25));
        }
      }

      // secondary tendril from branch tip
      const tip = branchPts[branchPts.length - 1];
      const tendril = buildTendril(tip, dir);
      parts.push(pathEl(smoothPath(tendril), CYAN, sw * 0.45, so * 0.5));

      // extra tendril branching the opposite way from tip
      const tendril2 = buildTendril(tip, -dir);
      parts.push(pathEl(smoothPath(tendril2), CYAN, sw * 0.3, so * 0.35));

      // midpoint nodes
      for (const pt of branchPts.slice(1)) {
        const nr = nodeRadius(depth, branchLevels) * 0.55;
        const no = nodeOpacity(depth, branchLevels) * 0.7;
        parts.push(circleEl(pt.x, pt.y, nr, CYAN, no));
      }

      // tendril terminal dots
      const last = tendril[tendril.length - 1];
      parts.push(circleEl(last.x, last.y, 0.6 + (1 - depth / branchLevels) * 0.4, CYAN,
        0.03 + (1 - depth / branchLevels) * 0.05));
      const last2 = tendril2[tendril2.length - 1];
      parts.push(circleEl(last2.x, last2.y, 0.5 + (1 - depth / branchLevels) * 0.3, CYAN,
        0.02 + (1 - depth / branchLevels) * 0.04));
    }

    // ── micro-artifacts at spine junctions ──
    const jx = junction.x;
    const jy = junction.y;
    const fade = 1 - depth / branchLevels;

    // micro ring around every other junction
    if (depth % 2 === 0 && depth < branchLevels - 1) {
      parts.push(microRing(jx, jy, 5 + fade * 4, 0.04 + fade * 0.06));
    }

    // dash marks radiating from deeper junctions
    if (depth < 3) {
      parts.push(dashMarks(jx, jy, 6 + depth * 2, 4 + fade * 3, 0.03 + fade * 0.04));
    }

    // dot clusters flanking the spine at the deepest levels
    if (depth < 2) {
      parts.push(dotCluster(jx - 8, jy, 4, 3, 0.4, 0.06));
      parts.push(dotCluster(jx + 8, jy, 4, 3, 0.4, 0.06));
    }
  }

  // ── spine junction nodes ──
  for (let i = 0; i < spine.length; i++) {
    const nr = nodeRadius(i, spine.length);
    const no = nodeOpacity(i, spine.length);
    parts.push(circleEl(spine[i].x, spine[i].y, nr, CYAN, no));

    // glow on the four deepest nodes
    if (i < 4) {
      parts.push(circleEl(spine[i].x, spine[i].y, nr * 1.5, CYAN, no * 0.5,
        { filter: 'url(#pb-glow-sm)' }));
    }

    // outer ring halo on deepest two
    if (i < 2) {
      parts.push(microRing(spine[i].x, spine[i].y, nr * 2.5, no * 0.3));
    }
  }

  // ── core ──
  // warm under-glow beneath the core
  parts.push(circleEl(coreX, coreY + 5, 30, AMBER, 0.04, { filter: 'url(#pb-glow)' }));
  parts.push(circleEl(coreX, coreY, 16, 'url(#pb-core)', 1, { filter: 'url(#pb-glow)' }));
  parts.push(circleEl(coreX, coreY, 10, 'none', 1,
    { stroke: CYAN, 'stroke-width': 0.5, 'stroke-opacity': 0.16 }));
  parts.push(circleEl(coreX, coreY, 5, CYAN, 0.10));
  // core detail: concentric rings with graduating opacity
  parts.push(microRing(coreX, coreY, 14, 0.08));
  parts.push(microRing(coreX, coreY, 20, 0.05));
  parts.push(microRing(coreX, coreY, 28, 0.025));
  // core dash halo
  parts.push(dashMarks(coreX, coreY, 12, 8, 0.05));

  // ── spores — scattered near branch tips and along the spine ──
  const sporePositions = [
    [0.12, 0.72], [0.88, 0.72],
    [0.2, 0.65], [0.8, 0.65], [0.15, 0.60], [0.85, 0.60],
    [0.3, 0.55], [0.7, 0.55], [0.25, 0.50], [0.75, 0.50],
    [0.38, 0.45], [0.62, 0.45], [0.35, 0.40], [0.65, 0.40],
    [0.45, 0.35], [0.55, 0.35], [0.42, 0.30], [0.58, 0.30],
    [0.48, 0.25], [0.52, 0.25], [0.46, 0.20], [0.54, 0.20],
    [0.49, 0.15], [0.51, 0.10],
  ];
  for (const [rx, ry] of sporePositions) {
    const t = 1 - ry; // higher = more transparent
    parts.push(circleEl(rx * W, ry * H, 0.4 + t * 0.3, CYAN, 0.01 + t * 0.04));
  }

  // ── spine-adjacent spore lines — tiny dashes paralleling the spine ──
  for (let i = 1; i < spine.length - 2; i++) {
    const s = spine[i];
    const fade = 1 - i / spine.length;
    // left and right offset spore dots
    for (const dx of [-14, -10, 10, 14]) {
      parts.push(circleEl(s.x + dx, s.y + 3, 0.35 + fade * 0.2, CYAN, 0.015 + fade * 0.025));
    }
  }

  // assemble
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">`,
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
