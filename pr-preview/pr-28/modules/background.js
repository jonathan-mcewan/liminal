import { hsla, roundedRectPath } from './utils.js';

/**
 * Fills the entire canvas with the dark page background.
 * Skipped when rendering for transparent export.
 */
export function drawCanvasBackground(ctx, w, h) {
  ctx.fillStyle = '#1a1a22';
  ctx.fillRect(0, 0, w, h ?? w);
}

/**
 * Renders the card's drop shadow.
 * Must be called BEFORE clipping to the card boundary so the blur can
 * spread beyond the card edge into the canvas background.
 */
export function drawCardShadow(ctx, geometry, cardColor) {
  const { cardLeft, cardTop, cardWidth, cardHeight, cornerRadius } = geometry;
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.68)';
  ctx.shadowBlur    = cardWidth * 0.14;
  ctx.shadowOffsetY = cardWidth * 0.046;
  roundedRectPath(ctx, cardLeft, cardTop, cardWidth, cardHeight, cornerRadius);
  ctx.fillStyle = cardColor();
  ctx.fill();
  ctx.restore();
}

/**
 * Diagonal linear gradient covering the card body.
 * Runs top-left → bottom-right with a subtle lightness swing, giving the
 * illusion of a slightly curved or angled surface.
 */
export function drawCardBodyGradient(ctx, geometry, isDark, cardColor) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geometry;
  // Flat base fill — always required so the card has colour regardless of shadow.
  ctx.fillStyle = cardColor();
  ctx.fillRect(cardLeft, cardTop, cardWidth, cardHeight);

  // Diagonal gradient overlay (subtle depth, currently disabled):
  // const gradient   = ctx.createLinearGradient(
  //   cardLeft,                    cardTop,
  //   cardLeft + cardWidth * 0.75, cardTop + cardHeight
  // );
  // const depthSwing = isDark ? 7 : -7;
  // gradient.addColorStop(0,   cardColor( depthSwing * 1.1));
  // gradient.addColorStop(0.5, cardColor(0));
  // gradient.addColorStop(1,   cardColor(-depthSwing * 0.85));
  // ctx.fillStyle = gradient;
  // ctx.fillRect(cardLeft, cardTop, cardWidth, cardHeight);
}

/**
 * Radial vignette: transparent at the centre, darker at the card edges.
 * Keeps visual weight in the middle where the symbol sits.
 */
export function drawVignette(ctx, geometry, isDark) {
  // const { cardLeft, cardTop, cardWidth, cardHeight, centerX, centerY } = geometry;
  // const gradient = ctx.createRadialGradient(
  //   centerX, centerY, cardWidth * 0.08,
  //   centerX, centerY, cardWidth * 0.88
  // );
  // gradient.addColorStop(0, 'rgba(255,255,255,0)');
  // gradient.addColorStop(1, isDark ? 'rgba(0,0,0,0.30)' : 'rgba(0,0,0,0.14)');
  // ctx.fillStyle = gradient;
  // ctx.fillRect(cardLeft, cardTop, cardWidth, cardHeight);
}

/**
 * Smooth noise texture using overlapping radial gradient blobs.
 *
 * Each of the noiseZoom² grid points spawns a large radial gradient that
 * overlaps its neighbours. Because adjacent blobs blend continuously there
 * are no cell boundaries and therefore no grid-line artifacts — the result
 * looks like organic, smooth noise.
 *
 * noiseZoom = 2  → 4 enormous blobs (very low-frequency variation)
 * noiseZoom = 4  → 16 blobs — default, smooth broad gradients
 * noiseZoom = 16 → 256 smaller blobs, approaching a fine grain
 */
export function drawNoise(ctx, geometry, cardPRNG, noiseZoom, noiseBrightness = 0.06, noiseContrast = 0.05) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geometry;

  const cellW = cardWidth  / noiseZoom;
  const cellH = cardHeight / noiseZoom;
  // Each blob radius is large enough to fully overlap adjacent cells so there
  // are no dark gaps between them.
  const blobRadius = Math.max(cellW, cellH) * 1.6;

  // Draw all blobs to an offscreen canvas, then composite the whole layer with
  // a single heavy blur — this eliminates any remaining grid regularity that
  // per-blob blurring would leave as visible bands.
  const offCanvas  = document.createElement('canvas');
  offCanvas.width  = cardWidth  | 0;
  offCanvas.height = cardHeight | 0;
  const offCtx = offCanvas.getContext('2d');

  for (let row = 0; row < noiseZoom; row++) {
    for (let col = 0; col < noiseZoom; col++) {
      // Centre of this grid cell with small random jitter to break regularity
      const cx = (col + 0.5) * cellW + cardPRNG.float(-cellW * 0.25, cellW * 0.25);
      const cy = (row + 0.5) * cellH + cardPRNG.float(-cellH * 0.25, cellH * 0.25);
      // noiseBrightness is the base opacity; small random spread keeps contrast low
      const brightness = noiseBrightness + cardPRNG.next() * noiseContrast;

      const grad = offCtx.createRadialGradient(cx, cy, 0, cx, cy, blobRadius);
      grad.addColorStop(0, `rgba(255,255,255,${brightness.toFixed(3)})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');

      offCtx.fillStyle = grad;
      offCtx.fillRect(0, 0, cardWidth, cardHeight);
    }
  }

  ctx.save();
  const blurPx = Math.round(Math.max(cardWidth, cardHeight) * 0.033);
  ctx.filter = `blur(${blurPx}px)`;
  ctx.drawImage(offCanvas, cardLeft, cardTop);
  ctx.restore();
}

/**
 * Abstract background artifacts — hard-edged geometric marks, very low opacity.
 * Colours are achromatic so they read as surface texture rather than design.
 *
 * Artifact types (picked by cardPRNG):
 *   0 — Streak band:       wide filled parallelogram at a clean angle
 *   1 — Line bundle:       3–4 uniform parallel lines
 *   2 — Corner wedge:      filled triangle anchored to one card corner
 *   3 — Arc slice:         thick partial arc, square caps
 *   4 — Dot grid:          regular grid of dots clipped to a rectangle
 *   5 — Concentric rings:  2–4 clean concentric circle strokes
 *   6 — Cross:             two perpendicular filled rectangles
 *   7 — Chevron:           open V-shape pointing in a clean direction
 *   8 — Diamond:           rotated filled square
 *   9 — Dashes:            row of evenly-spaced short dashes
 *  10 — Bracket:           thick L-shaped corner bracket
 */
export const ARTIFACT_TYPE_COUNT = 11;

/**
 * Returns the Set of artifact type indices that the seed would produce.
 * Runs the real drawArtifacts on a tiny offscreen canvas to guarantee PRNG parity.
 */
let _probeCanvas = null;
export function getArtifactTypesForSeed(prng) {
  if (!_probeCanvas) {
    _probeCanvas = document.createElement('canvas');
    _probeCanvas.width = 4; _probeCanvas.height = 4;
  }
  const types = new Set();
  const geo = { cardLeft: 0, cardTop: 0, cardWidth: 4, cardHeight: 4 };
  drawArtifacts(_probeCanvas.getContext('2d'), geo, true, prng, 0, null, 1, null, types);
  return types;
}

export function drawArtifacts(ctx, geometry, isDark, cardPRNG, artifactOpacity = 0.2, artifactCount = null, artifactScale = 1, artifactTypeLock = null, _collectTypes = null) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geometry;
  const opacity = artifactOpacity;
  const c = (a) => isDark ? `rgba(255,255,255,${a * opacity})` : `rgba(0,0,0,${a * opacity})`;
  const sc = (v) => v * artifactScale;
  const TYPE_COUNT = 11;

  // Clean angles: 0°, 15°, 30°, 45°, 60°, 75°, 90° (± mirrored)
  const CLEAN_ANGLES = [0, 15, 30, 45, 60, 75, 90].map(d => d * Math.PI / 180);
  const pickAngle = () => {
    const base = CLEAN_ANGLES[cardPRNG.int(0, CLEAN_ANGLES.length - 1)];
    return cardPRNG.next() > 0.5 ? base : -base;
  };

  const artifactCountFromPRNG = cardPRNG.int(3, 7);
  const count = artifactCount !== null ? Math.max(0, artifactCount | 0) : artifactCountFromPRNG;

  for (let a = 0; a < count; a++) {
    const typeFromPRNG = cardPRNG.int(0, TYPE_COUNT - 1);
    const type = artifactTypeLock && artifactTypeLock.length
      ? artifactTypeLock[typeFromPRNG % artifactTypeLock.length]
      : typeFromPRNG;
    if (_collectTypes) _collectTypes.add(type);
    ctx.save();

    if (type === 0) {
      // ── Streak band ─────────────────────────────────────────────────
      const angle = pickAngle();
      const midX  = cardLeft + cardWidth  * cardPRNG.float(0.1, 0.9);
      const midY  = cardTop  + cardHeight * cardPRNG.float(0.1, 0.9);
      const len   = sc(cardWidth * cardPRNG.float(0.9, 1.4));
      const w     = sc(cardWidth * cardPRNG.float(0.14, 0.22));
      const alpha = cardPRNG.float(0.025, 0.04);
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const cp = Math.cos(angle + Math.PI / 2), sp = Math.sin(angle + Math.PI / 2);
      const hl = len * 0.5, hw = w * 0.5;
      ctx.beginPath();
      ctx.moveTo(midX - ca * hl - cp * hw, midY - sa * hl - sp * hw);
      ctx.lineTo(midX + ca * hl - cp * hw, midY + sa * hl - sp * hw);
      ctx.lineTo(midX + ca * hl + cp * hw, midY + sa * hl + sp * hw);
      ctx.lineTo(midX - ca * hl + cp * hw, midY - sa * hl + sp * hw);
      ctx.closePath();
      ctx.fillStyle = c(alpha);
      ctx.fill();

    } else if (type === 1) {
      // ── Line bundle ─────────────────────────────────────────────────
      const lineN = cardPRNG.int(3, 4);
      const angle = pickAngle();
      const midX  = cardLeft + cardWidth  * cardPRNG.float(0.15, 0.85);
      const midY  = cardTop  + cardHeight * cardPRNG.float(0.15, 0.85);
      const len   = sc(cardWidth * cardPRNG.float(0.7, 1.2));
      const spread = sc(cardWidth * cardPRNG.float(0.08, 0.18));
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const cp = Math.cos(angle + Math.PI / 2), sp = Math.sin(angle + Math.PI / 2);
      const lw = sc(cardWidth * cardPRNG.float(0.020, 0.032));
      ctx.lineCap   = 'butt';
      ctx.lineWidth = lw;
      const alpha = cardPRNG.float(0.025, 0.045);
      ctx.strokeStyle = c(alpha);
      for (let i = 0; i < lineN; i++) {
        const t = lineN === 1 ? 0 : (i / (lineN - 1) - 0.5) * spread;
        ctx.beginPath();
        ctx.moveTo(midX - ca * len * 0.5 + cp * t, midY - sa * len * 0.5 + sp * t);
        ctx.lineTo(midX + ca * len * 0.5 + cp * t, midY + sa * len * 0.5 + sp * t);
        ctx.stroke();
      }

    } else if (type === 2) {
      // ── Corner wedge ────────────────────────────────────────────────
      const corner = cardPRNG.int(0, 3);
      const ox = corner % 2 === 0 ? cardLeft : cardLeft + cardWidth;
      const oy = corner < 2       ? cardTop  : cardTop  + cardHeight;
      const sx = corner % 2 === 0 ? 1 : -1;
      const sy = corner < 2       ? 1 : -1;
      const reach = cardPRNG.float(0.30, 0.50);
      const width = cardPRNG.float(0.15, 0.35);
      const ax = ox + sx * sc(cardWidth  * reach);
      const ay = oy + sy * sc(cardHeight * cardPRNG.float(0.04, 0.14));
      const bx = ox + sx * sc(cardWidth  * cardPRNG.float(0.04, 0.14));
      const by = oy + sy * sc(cardHeight * width);
      const alpha = cardPRNG.float(0.02, 0.035);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.closePath();
      ctx.fillStyle = c(alpha);
      ctx.fill();

    } else if (type === 3) {
      // ── Arc slice ───────────────────────────────────────────────────
      const cx    = cardLeft + cardWidth  * cardPRNG.float(0.1, 0.9);
      const cy    = cardTop  + cardHeight * cardPRNG.float(0.1, 0.9);
      const r     = sc(cardWidth * cardPRNG.float(0.25, 0.55));
      const start = cardPRNG.float(0, Math.PI * 2);
      const span  = cardPRNG.float(Math.PI * 0.4, Math.PI * 0.8);
      const alpha = cardPRNG.float(0.025, 0.04);
      ctx.lineWidth   = sc(cardWidth * cardPRNG.float(0.04, 0.07));
      ctx.lineCap     = 'butt';
      ctx.strokeStyle = c(alpha);
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, start + span);
      ctx.stroke();

    } else if (type === 4) {
      // ── Dot grid ────────────────────────────────────────────────────
      const rx   = cardLeft + cardWidth  * cardPRNG.float(0.08, 0.55);
      const ry   = cardTop  + cardHeight * cardPRNG.float(0.08, 0.55);
      const rw   = sc(cardWidth  * cardPRNG.float(0.30, 0.50));
      const rh   = sc(cardHeight * cardPRNG.float(0.25, 0.45));
      const cols = cardPRNG.int(3, 6);
      const rows = cardPRNG.int(3, 5);
      const dotR = sc(cardWidth * cardPRNG.float(0.014, 0.020));
      const alpha = cardPRNG.float(0.03, 0.055);
      ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
      ctx.fillStyle = c(alpha);
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const dx = rx + (col + 0.5) * (rw / cols);
          const dy = ry + (r   + 0.5) * (rh / rows);
          ctx.beginPath();
          ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

    } else if (type === 5) {
      // ── Concentric rings ────────────────────────────────────────────
      const cx      = cardLeft + cardWidth  * cardPRNG.float(0.15, 0.85);
      const cy      = cardTop  + cardHeight * cardPRNG.float(0.15, 0.85);
      const ringN   = cardPRNG.int(2, 4);
      const baseR   = sc(cardWidth * cardPRNG.float(0.06, 0.12));
      const spacing = sc(cardWidth * cardPRNG.float(0.028, 0.048));
      const alpha   = cardPRNG.float(0.025, 0.045);
      ctx.lineWidth  = sc(cardWidth * cardPRNG.float(0.006, 0.015));
      ctx.strokeStyle = c(alpha);
      for (let i = 0; i < ringN; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, baseR + spacing * i, 0, Math.PI * 2);
        ctx.stroke();
      }

    } else if (type === 6) {
      // ── Cross / plus ────────────────────────────────────────────────
      const cx     = cardLeft + cardWidth  * cardPRNG.float(0.15, 0.85);
      const cy     = cardTop  + cardHeight * cardPRNG.float(0.15, 0.85);
      const angle  = pickAngle();
      const armLen = sc(cardWidth * cardPRNG.float(0.10, 0.20));
      const armW   = sc(cardWidth * cardPRNG.float(0.028, 0.050));
      const alpha  = cardPRNG.float(0.02, 0.038);
      ctx.fillStyle = c(alpha);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillRect(-armLen, -armW * 0.5, armLen * 2, armW);
      ctx.fillRect(-armW * 0.5, -armLen, armW, armLen * 2);
      ctx.restore();

    } else if (type === 7) {
      // ── Chevron ─────────────────────────────────────────────────────
      const cx    = cardLeft + cardWidth  * cardPRNG.float(0.15, 0.85);
      const cy    = cardTop  + cardHeight * cardPRNG.float(0.15, 0.85);
      const angle = pickAngle();
      const armLen = sc(cardWidth * cardPRNG.float(0.12, 0.25));
      const spread = cardPRNG.float(Math.PI * 0.15, Math.PI * 0.35);
      const alpha = cardPRNG.float(0.025, 0.045);
      ctx.lineWidth   = sc(cardWidth * cardPRNG.float(0.025, 0.045));
      ctx.lineCap     = 'butt';
      ctx.lineJoin    = 'miter';
      ctx.strokeStyle = c(alpha);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle - spread) * armLen, cy + Math.sin(angle - spread) * armLen);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle + spread) * armLen, cy + Math.sin(angle + spread) * armLen);
      ctx.stroke();

    } else if (type === 8) {
      // ── Diamond ─────────────────────────────────────────────────────
      const cx   = cardLeft + cardWidth  * cardPRNG.float(0.15, 0.85);
      const cy   = cardTop  + cardHeight * cardPRNG.float(0.15, 0.85);
      const half = sc(cardWidth * cardPRNG.float(0.06, 0.14));
      const stretch = cardPRNG.float(0.6, 1.4); // elongate vertically or horizontally
      const alpha = cardPRNG.float(0.02, 0.04);
      ctx.beginPath();
      ctx.moveTo(cx, cy - half * stretch);
      ctx.lineTo(cx + half, cy);
      ctx.lineTo(cx, cy + half * stretch);
      ctx.lineTo(cx - half, cy);
      ctx.closePath();
      ctx.fillStyle = c(alpha);
      ctx.fill();

    } else if (type === 9) {
      // ── Dashes ──────────────────────────────────────────────────────
      const angle  = pickAngle();
      const midX   = cardLeft + cardWidth  * cardPRNG.float(0.1, 0.9);
      const midY   = cardTop  + cardHeight * cardPRNG.float(0.1, 0.9);
      const dashN  = cardPRNG.int(4, 8);
      const dashLen = sc(cardWidth * cardPRNG.float(0.03, 0.06));
      const gap    = sc(cardWidth * cardPRNG.float(0.02, 0.04));
      const totalLen = dashN * dashLen + (dashN - 1) * gap;
      const alpha  = cardPRNG.float(0.025, 0.045);
      ctx.lineWidth  = sc(cardWidth * cardPRNG.float(0.012, 0.025));
      ctx.lineCap    = 'butt';
      ctx.strokeStyle = c(alpha);
      const ca = Math.cos(angle), sa = Math.sin(angle);
      for (let i = 0; i < dashN; i++) {
        const offset = -totalLen * 0.5 + i * (dashLen + gap);
        const x0 = midX + ca * offset;
        const y0 = midY + sa * offset;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + ca * dashLen, y0 + sa * dashLen);
        ctx.stroke();
      }

    } else {
      // ── Bracket (L-shape) ───────────────────────────────────────────
      const corner = cardPRNG.int(0, 3);
      const ox = corner % 2 === 0 ? cardLeft + cardWidth * cardPRNG.float(0.05, 0.35)
                                   : cardLeft + cardWidth * cardPRNG.float(0.65, 0.95);
      const oy = corner < 2       ? cardTop + cardHeight * cardPRNG.float(0.05, 0.35)
                                   : cardTop + cardHeight * cardPRNG.float(0.65, 0.95);
      const sx = corner % 2 === 0 ? 1 : -1;
      const sy = corner < 2       ? 1 : -1;
      const armH = sc(cardHeight * cardPRNG.float(0.12, 0.25));
      const armW = sc(cardWidth  * cardPRNG.float(0.10, 0.20));
      const alpha = cardPRNG.float(0.025, 0.04);
      ctx.lineWidth   = sc(cardWidth * cardPRNG.float(0.020, 0.038));
      ctx.lineCap     = 'butt';
      ctx.lineJoin    = 'miter';
      ctx.strokeStyle = c(alpha);
      ctx.beginPath();
      ctx.moveTo(ox + sx * armW, oy);
      ctx.lineTo(ox, oy);
      ctx.lineTo(ox, oy + sy * armH);
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Thin white-to-transparent gradient at the top of the card.
 * Simulates a catch-light — the reflection of overhead light on a slightly
 * curved or lacquered card surface.
 */
export function drawTopGloss(ctx, geometry) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geometry;
  const gradient = ctx.createLinearGradient(cardLeft, cardTop, cardLeft, cardTop + cardHeight * 0.19);
  gradient.addColorStop(0, 'rgba(255,255,255,0.09)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(cardLeft, cardTop, cardWidth, cardHeight * 0.19);
}

/**
 * Lanyard notch — a horizontal stadium-shaped slot punched near the top
 * centre of the card, sized for a thick lanyard clip.
 *
 * Uses destination-out compositing to erase card pixels cleanly, so the
 * canvas background shows through on-screen and is transparent on PNG export.
 * A thin rim stroke is drawn afterwards to simulate the metal reinforcement.
 */
export function drawLanyardHole(ctx, geometry, isDark) {
  const { cardTop, cardWidth, cardHeight, centerX } = geometry;
  const slotW = cardWidth * 0.18;          // ~15 mm on a real 85.6 mm card — wide enough for thick lanyard hardware
  const slotH = cardWidth * 0.058;         // ~5 mm tall
  const slotR = slotH / 2;                 // fully rounded ends (stadium shape)
  const slotX = centerX - slotW / 2;       // left edge
  const slotY = cardTop + cardHeight * 0.07 - slotH / 2;  // centred vertically at 7% from top

  function slotPath() {
    ctx.beginPath();
    ctx.moveTo(slotX + slotR, slotY);
    ctx.lineTo(slotX + slotW - slotR, slotY);
    ctx.arc(slotX + slotW - slotR, slotY + slotR, slotR, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(slotX + slotR, slotY + slotH);
    ctx.arc(slotX + slotR, slotY + slotR, slotR, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
  }

  // Punch the slot through all card layers drawn so far.
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  slotPath();
  ctx.fill();
  ctx.restore();

  // Rim stroke — achromatic, low opacity, reads as a metal reinforcement edge.
  ctx.save();
  slotPath();
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)';
  ctx.lineWidth   = cardWidth * 0.006;
  ctx.stroke();
  ctx.restore();
}

/**
 * Thin stroke around the card perimeter.
 * Very low opacity — just enough to give the card a defined edge.
 */
export function drawCardEdge(ctx, geometry, hue, saturation, isDark) {
  const { cardLeft, cardTop, cardWidth, cardHeight, cornerRadius } = geometry;
  ctx.save();
  roundedRectPath(ctx, cardLeft, cardTop, cardWidth, cardHeight, cornerRadius);
  ctx.strokeStyle = hsla(hue, saturation, isDark ? 58 : 42, 0.16);
  ctx.lineWidth   = 1.2;
  ctx.stroke();
  ctx.restore();
}
