/**
 * Renders the back face of the access card.
 *
 * Elements (top to bottom):
 *   1. Card body fill (same hue/lightness as front)
 *   2. Magnetic stripe
 *   3. Diagonal hatched pattern
 *   4. LIMINAL brand mark
 *   5. Decorative barcode
 *   6. Card edge stroke
 */

import { makePRNG }             from './prng.js';
import { hsla, roundedRectPath } from './utils.js';
import {
  drawCardBodyGradient,
  drawCardEdge,
} from './background.js';

/**
 * Accepts the same param shape as generateCard (via buildParams) plus ctx.
 * Computes geometry and resolved colours internally, just like generateCard does.
 */
export function generateCardBack({
  size        = 1024,
  padding     = 0.08,
  cardAspect  = 54 / 85.6,
  cardScale   = 1,
  seed        = 42,
  hue         = 220,
  isDarkOverride        = null,
  cardLightnessOverride = null,
  saturationOverride    = null,
  ctx: ctxOverride = null,
} = {}) {

  // ── Geometry (mirrors generateCard — card-bounds only, no padding) ─────
  const refDim = size * (1 - 2 * padding);
  let cardWidth, cardHeight;
  if (cardAspect <= 1) { cardHeight = refDim * cardScale; cardWidth  = cardHeight * cardAspect; }
  else                 { cardWidth  = refDim * cardScale; cardHeight = cardWidth / cardAspect; }
  const centerX      = cardWidth / 2;
  const centerY      = cardHeight / 2;
  const cardLeft     = 0;
  const cardTop      = 0;
  const cornerRadius = cardWidth * 0.1;
  const geometry = { frameW: cardWidth, frameH: cardHeight, cardLeft, cardTop, cardWidth, cardHeight, cornerRadius, centerX, centerY };

  // ── Resolve colours (mirrors generateCard PRNG sequence) ───────────────
  const cardPRNG = makePRNG(seed);
  const isDarkFromSeed       = cardPRNG.next() > 0.35;
  const saturationFromSeed   = cardPRNG.int(38, 60);
  cardPRNG.float(-9, 9);       // symbolHueDrift — consume
  const cardLightnessFromSeed = isDarkFromSeed ? cardPRNG.int(11, 22) : cardPRNG.int(72, 86);

  const colorPRNG = makePRNG(seed ^ 0xC0FFEE42);
  colorPRNG.int(0, 359);        // hue
  colorPRNG.float(0.03, 0.12);  // noiseBrightness
  colorPRNG.float(0.02, 0.08);  // noiseContrast
  const altLightness = isDarkFromSeed ? colorPRNG.int(72, 86) : colorPRNG.int(11, 22);

  const isDark      = isDarkOverride     ?? isDarkFromSeed;
  const saturation  = saturationOverride ?? saturationFromSeed;
  const modeFlipped = isDarkOverride !== null && isDarkOverride !== isDarkFromSeed;
  const cardLightness = cardLightnessOverride ?? (modeFlipped ? altLightness : cardLightnessFromSeed);

  // ── Ctx setup ──────────────────────────────────────────────────────────
  const ctx = ctxOverride;
  if (ctx.cropTo) ctx.cropTo(0, 0, cardWidth, cardHeight);

  const cardColor = (lightnessAdj = 0, alpha = 1) =>
    hsla(hue, saturation, cardLightness + lightnessAdj, alpha);

  const backPRNG = makePRNG(seed ^ 0xBACCFACE);

  // ── Clip to card boundary ──────────────────────────────────────────────
  ctx.save();
  roundedRectPath(ctx, cardLeft, cardTop, cardWidth, cardHeight, cornerRadius);
  ctx.clip();

  // ── Card body fill ─────────────────────────────────────────────────────
  drawCardBodyGradient(ctx, geometry, isDark, cardColor);

  // ── Magnetic stripe ────────────────────────────────────────────────────
  const stripeY = cardTop + cardHeight * 0.13;
  const stripeH = cardHeight * 0.16;
  ctx.fillStyle = isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.70)';
  ctx.fillRect(cardLeft, stripeY, cardWidth, stripeH);
  // Subtle sheen line
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(cardLeft, stripeY + stripeH * 0.4, cardWidth, 1.5);

  // ── Diagonal hatched pattern ───────────────────────────────────────────
  const patternTop = stripeY + stripeH + cardHeight * 0.06;
  const patternH   = cardHeight * 0.30;
  const patternBot = patternTop + patternH;
  const lineGap    = cardWidth * 0.025;
  const lineAlpha  = isDark ? 0.10 : 0.08;

  ctx.save();
  ctx.beginPath();
  ctx.rect(cardLeft + cardWidth * 0.08, patternTop, cardWidth * 0.84, patternH);
  ctx.clip();

  ctx.strokeStyle = hsla(hue, saturation, isDark ? 60 : 30, lineAlpha);
  ctx.lineWidth   = 1;
  ctx.beginPath();
  for (let x = -patternH; x < cardWidth + patternH; x += lineGap) {
    ctx.moveTo(cardLeft + x,            patternTop);
    ctx.lineTo(cardLeft + x + patternH, patternBot);
  }
  ctx.stroke();
  ctx.restore();

  // ── LIMINAL brand mark (hatched circle) ────────────────────────────────
  const markRadius = cardWidth * 0.055;
  const markX = centerX;
  const markY = patternTop + patternH * 0.5;
  const markAlpha = isDark ? 0.30 : 0.25;

  ctx.save();
  ctx.beginPath();
  ctx.arc(markX, markY, markRadius, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = hsla(hue, saturation, isDark ? 80 : 30, markAlpha);
  ctx.lineWidth   = markRadius * 0.09;
  const step = markRadius * 0.28;
  ctx.beginPath();
  for (let d = -markRadius * 2; d < markRadius * 2; d += step) {
    ctx.moveTo(markX + d - markRadius, markY - markRadius);
    ctx.lineTo(markX + d + markRadius, markY + markRadius);
  }
  ctx.stroke();
  ctx.restore();

  // Circle outline
  ctx.beginPath();
  ctx.arc(markX, markY, markRadius, 0, Math.PI * 2);
  ctx.strokeStyle = hsla(hue, saturation, isDark ? 70 : 35, markAlpha);
  ctx.lineWidth   = 1.2;
  ctx.stroke();

  // ── Decorative barcode ─────────────────────────────────────────────────
  const barcodeTop  = cardTop + cardHeight * 0.78;
  const barcodeH    = cardHeight * 0.09;
  const barcodeLeft = cardLeft + cardWidth * 0.25;
  const barcodeW    = cardWidth * 0.50;
  const barAlpha    = isDark ? 0.35 : 0.50;

  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.50)';
  ctx.fillRect(barcodeLeft, barcodeTop, barcodeW, barcodeH);

  ctx.fillStyle = isDark
    ? hsla(hue, saturation * 0.3, 75, barAlpha)
    : hsla(hue, saturation * 0.3, 15, barAlpha);

  let bx = barcodeLeft + barcodeW * 0.04;
  const barEnd = barcodeLeft + barcodeW * 0.96;
  while (bx < barEnd) {
    const w   = backPRNG.float(1, 3.5);
    const gap = backPRNG.float(1, 3);
    ctx.fillRect(bx, barcodeTop + barcodeH * 0.1, w, barcodeH * 0.8);
    bx += w + gap;
  }

  // ── End card clip ──────────────────────────────────────────────────────
  ctx.restore();

  // ── Card edge ──────────────────────────────────────────────────────────
  drawCardEdge(ctx, geometry, hue, saturation, isDark);
}
