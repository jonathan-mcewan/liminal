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
 *   0 — Streak band:    a wide filled parallelogram crossing the card at an angle
 *   1 — Line bundle:    3–5 parallel lines of varying width, hard butt caps
 *   2 — Corner wedge:   a filled triangle anchored to one card corner
 *   3 — Arc slice:      a thick partial arc, square caps, spanning ~90–180°
 *   4 — Grid fragment:  a small regular grid of dots clipped to a rectangle
 */
export function drawArtifacts(ctx, geometry, isDark, cardPRNG, artifactOpacity = 0.2, artifactCount = null, artifactScale = 1) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geometry;
  const opacity = artifactOpacity;
  const c = (a) => isDark ? `rgba(255,255,255,${a * opacity})` : `rgba(0,0,0,${a * opacity})`;
  const sc = (v) => v * artifactScale; // scale size-related dimensions

  const artifactCountFromPRNG = cardPRNG.int(3, 7); // always consume PRNG to preserve sequence
  const count = artifactCount !== null ? Math.max(0, artifactCount | 0) : artifactCountFromPRNG;

  for (let a = 0; a < count; a++) {
    const type = cardPRNG.int(0, 4);
    ctx.save();

    if (type === 0) {
      // Wide filled parallelogram — streak band at a shallow angle
      const angle  = cardPRNG.float(-Math.PI * 0.25, Math.PI * 0.25);
      const midX   = cardLeft + cardWidth  * cardPRNG.float(0.1, 0.9);
      const midY   = cardTop  + cardHeight * cardPRNG.float(0.1, 0.9);
      const len    = sc(cardWidth * cardPRNG.float(0.9, 1.4));
      const width  = sc(cardWidth * cardPRNG.float(0.12, 0.28));
      const alpha  = cardPRNG.float(0.02, 0.05);
      const ca     = Math.cos(angle), sa = Math.sin(angle);
      const cp     = Math.cos(angle + Math.PI / 2), sp = Math.sin(angle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(midX - ca * len * 0.5 - cp * width * 0.5, midY - sa * len * 0.5 - sp * width * 0.5);
      ctx.lineTo(midX + ca * len * 0.5 - cp * width * 0.5, midY + sa * len * 0.5 - sp * width * 0.5);
      ctx.lineTo(midX + ca * len * 0.5 + cp * width * 0.5, midY + sa * len * 0.5 + sp * width * 0.5);
      ctx.lineTo(midX - ca * len * 0.5 + cp * width * 0.5, midY - sa * len * 0.5 + sp * width * 0.5);
      ctx.closePath();
      ctx.fillStyle = c(alpha);
      ctx.fill();

    } else if (type === 1) {
      // Line bundle — 3–5 parallel lines, hard butt caps, varying widths
      const lineN  = cardPRNG.int(3, 5);
      const angle  = cardPRNG.float(0, Math.PI);
      const midX   = cardLeft + cardWidth  * cardPRNG.float(0.1, 0.9);
      const midY   = cardTop  + cardHeight * cardPRNG.float(0.1, 0.9);
      const len    = sc(cardWidth * cardPRNG.float(0.7, 1.3));
      const spread = sc(cardWidth * cardPRNG.float(0.12, 0.22));
      const ca     = Math.cos(angle), sa = Math.sin(angle);
      const cp     = Math.cos(angle + Math.PI / 2), sp = Math.sin(angle + Math.PI / 2);
      ctx.lineCap = 'butt';
      for (let i = 0; i < lineN; i++) {
        const t     = (i / (lineN - 1) - 0.5) * spread;
        const alpha = cardPRNG.float(0.02, 0.06);
        ctx.lineWidth   = sc(cardWidth * cardPRNG.float(0.018, 0.042));
        ctx.strokeStyle = c(alpha);
        ctx.beginPath();
        ctx.moveTo(midX - ca * len * 0.5 + cp * t, midY - sa * len * 0.5 + sp * t);
        ctx.lineTo(midX + ca * len * 0.5 + cp * t, midY + sa * len * 0.5 + sp * t);
        ctx.stroke();
      }

    } else if (type === 2) {
      // Corner wedge — filled triangle from one corner across the card
      const corner = cardPRNG.int(0, 3);
      const ox = corner % 2 === 0 ? cardLeft : cardLeft + cardWidth;
      const oy = corner < 2       ? cardTop  : cardTop  + cardHeight;
      const ax = cardLeft + cardWidth  * cardPRNG.float(0.1, 0.55);
      const ay = cardTop  + cardHeight * cardPRNG.float(0.1, 0.55);
      const bx = cardLeft + cardWidth  * cardPRNG.float(0.45, 0.9);
      const by = cardTop  + cardHeight * cardPRNG.float(0.45, 0.9);
      const alpha = cardPRNG.float(0.02, 0.05);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.closePath();
      ctx.fillStyle = c(alpha);
      ctx.fill();

    } else if (type === 3) {
      // Arc slice — thick partial arc, square caps
      const cx     = cardLeft + cardWidth  * cardPRNG.float(0.1, 0.9);
      const cy     = cardTop  + cardHeight * cardPRNG.float(0.1, 0.9);
      const r      = sc(cardWidth * cardPRNG.float(0.30, 0.60));
      const start  = cardPRNG.float(0, Math.PI * 2);
      const span   = cardPRNG.float(Math.PI * 0.4, Math.PI * 1.1);
      const alpha  = cardPRNG.float(0.02, 0.05);
      ctx.lineWidth   = sc(cardWidth * cardPRNG.float(0.040, 0.090));
      ctx.lineCap     = 'butt';
      ctx.strokeStyle = c(alpha);
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, start + span);
      ctx.stroke();

    } else {
      // Grid fragment — evenly spaced dots clipped to a rectangle
      const rx     = cardLeft + cardWidth  * cardPRNG.float(0.05, 0.6);
      const ry     = cardTop  + cardHeight * cardPRNG.float(0.05, 0.6);
      const rw     = sc(cardWidth  * cardPRNG.float(0.30, 0.55));
      const rh     = sc(cardHeight * cardPRNG.float(0.25, 0.50));
      const cols   = cardPRNG.int(3, 7);
      const rows   = cardPRNG.int(3, 6);
      const dotR   = sc(cardWidth * cardPRNG.float(0.012, 0.026));
      const alpha  = cardPRNG.float(0.03, 0.07);
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
