import { makePRNG }             from './prng.js';
import { hsla, roundedRectPath } from './utils.js';
import {
  drawCardBodyGradient,
  drawVignette,
  drawArtifacts,
  drawTopGloss,
  drawLanyardHole,
  drawCardEdge,
} from './background.js';
import { drawBackgroundTexture } from './bg-styles.js';
import { drawPatterns }  from './patterns.js';
import { PATTERN_NAMES } from './constants.js';
import { drawSymbol }   from './symbols.js';
import { drawCardText } from './text.js';

/**
 * Returns the colour parameters that a given seed produces by default.
 * UI code calls this to populate sliders before any user override is applied.
 *
 * The cardPRNG sequence consumed here mirrors the sequence inside generateCard,
 * so the returned saturation exactly matches what generateCard would derive.
 *
 * @param {number} seed - Primary card seed
 * @returns {{ hue, saturation, noiseBrightness, noiseContrast }}
 */
export function deriveColorParams(seed) {
  // Mirror cardPRNG sequence in generateCard: isDark → saturation → symbolHueDrift → cardLightness
  const cardPRNG = makePRNG(seed);
  const isDark        = cardPRNG.next() > 0.35;
  const saturation    = cardPRNG.int(38, 60);
  const symbolHueDrift = cardPRNG.float(-9, 9);
  const cardLightness = isDark ? cardPRNG.int(11, 22) : cardPRNG.int(72, 86);

  // Separate PRNG for params not in cardPRNG
  const colorPRNG = makePRNG(seed ^ 0xC0FFEE42);
  const hue             = colorPRNG.int(0, 359);
  const noiseBrightness = colorPRNG.float(0.03, 0.12);
  const noiseContrast   = colorPRNG.float(0.02, 0.08);
  // Lightness for the opposite mode — used by UI when the dark/light toggle is flipped
  // without an explicit lightness override, so the slider shows a sensible value.
  const altCardLightness = isDark ? colorPRNG.int(72, 86) : colorPRNG.int(11, 22);
  const patternTwoTone   = colorPRNG.next() > 0.35; // ~65% chance of two-tone
  const bgBlur           = colorPRNG.float(0.02, 0.06); // fraction of card max dim

  return { isDark, cardLightness, altCardLightness, hue, saturation, noiseBrightness, noiseContrast, patternTwoTone, bgBlur, symbolHueDrift };
}

/**
 * Renders a procedural access card to the <canvas id="canvas"> element.
 *
 * Four independent PRNGs drive the output:
 *   cardPRNG     — seeded by `seed`; controls card colour, theme, noise
 *   stylePRNG    — seeded by `seed ^ 0x9E3779B9`; picks the symbol variant
 *   logoPRNG     — seeded by mixSeeds(seed, logoNonce); controls all internal logo variation
 *   artifactPRNG — seeded by mixSeeds(seed, artifactSeed); controls artifact placement/shape
 *
 * @param {object}  options
 * @param {number}  options.size               - Canvas width/height in pixels (square)
 * @param {number}  options.padding            - Fraction of size used as padding on each side
 * @param {number}  options.seed               - Primary seed: card colours, theme, noise
 * @param {number}  options.logoNonce          - Mixed with seed to seed the logo PRNG only
 * @param {number}  options.logoStyle          - Override symbol variant (0–7); -1 = seed-derived
 * @param {number}  options.hue               - Base hue (0–359) for the card colour palette
 * @param {number|null} options.saturationOverride - Override card saturation (null = seed-derived)
 * @param {string}  options.personName         - Name printed near the bottom of the card
 * @param {string}  options.jobTitle           - Job title printed beneath the name
 * @param {number}  options.artifactSeed       - Mixed with seed to seed the artifact PRNG
 * @param {boolean} options.showArtifacts      - Whether to draw background artifacts
 */
export function generateCard({
  size               = 1024,
  padding            = 0.08,
  cardAspect         = 54 / 85.6,  // width/height ratio; default = ID card (85.6 × 54 mm)
  cardScale          = 1,           // multiplier on the fitted dimension
  seed               = 42,
  logoNonce          = 0,
  logoStyle          = -1,
  logoScale          = 1,
  hue                   = 220,
  isDarkOverride        = null,
  cardLightnessOverride = null,
  saturationOverride    = null,
  bgStyle               = -1,    // -1 = auto, 0–9 = specific style
  noiseZoom             = 4,
  noiseBrightness    = 0.06,
  noiseContrast      = 0.05,
  bgBlur             = 0.033,
  personName         = '',
  jobTitle           = '',
  artifactSeed       = 0,
  artifactOpacity    = 0.2,
  artifactCount      = null,
  artifactScale      = 1,
  showArtifacts      = true,
  patternSeed        = 0,
  patternType        = -1,      // -1 = auto, -2 = none
  patternOpacity     = 0.15,
  patternScale       = 1,
  patternTwoTone     = true,
  showLanyard        = false,
  borderRadius       = 0.2,         // 0 = sharp, 0.2 = default, 1 = pill
  bgBlendMode        = 'source-over',
  patternRotation    = 0,           // degrees
  embossMode         = 'none',      // 'none' | 'emboss' | 'deboss'
  artifactTypeLock   = null,         // null = auto, [0,3] = only these types
  ctx:               ctxOverride = null,  // optional: pass an SvgContext for SVG output
} = {}) {
  // ── Compute card dimensions early so we can size the canvas ───────────
  const _refDim = size * (1 - 2 * padding);  // available reference dimension
  let _cw, _ch;
  if (cardAspect <= 1) { _ch = _refDim * cardScale; _cw = _ch * cardAspect; }
  else                 { _cw = _refDim * cardScale; _ch = _cw / cardAspect; }

  let ctx;
  if (ctxOverride) {
    ctx = ctxOverride;
  } else {
    const canvas = document.getElementById('canvas');
    canvas.width  = Math.round(_cw);
    canvas.height = Math.round(_ch);
    ctx = canvas.getContext('2d');
  }

  // ── Four independent PRNGs ────────────────────────────────────────────────
  const cardPRNG     = makePRNG(seed);
  const stylePRNG    = makePRNG(seed ^ 0x9E3779B9); // independent sequence, same seed
  const logoPRNG     = makePRNG(logoNonce);          // seeded only by logoNonce; base seed feeds in via deriveSeedParams default
  const artifactPRNG = makePRNG(artifactSeed);       // seeded only by artifactSeed; same pattern
  const patternPRNG  = makePRNG(patternSeed);        // seeded only by patternSeed; same pattern

  // ── Theme: drawn from cardPRNG ────────────────────────────────────────────
  // Always consume cardPRNG in the same order to preserve downstream sequence.
  const isDarkFromSeed          = cardPRNG.next() > 0.35;
  const saturationFromSeed      = cardPRNG.int(38, 60);
  const symbolHueDrift          = cardPRNG.float(-9, 9);
  const cardLightnessFromSeed   = isDarkFromSeed ? cardPRNG.int(11, 22) : cardPRNG.int(72, 86);
  const symbolLightnessFromSeed = isDarkFromSeed ? cardPRNG.int(80, 95) : cardPRNG.int(8, 22);

  // Derive altLightness for the opposite mode — same calculation as deriveColorParams.
  // Used when isDark is overridden to the opposite polarity without an explicit lightness.
  const colorPRNG = makePRNG(seed ^ 0xC0FFEE42);
  colorPRNG.int(0, 359);        // skip hue
  colorPRNG.float(0.03, 0.12);  // skip noiseBrightness
  colorPRNG.float(0.02, 0.08);  // skip noiseContrast
  const altLightness = isDarkFromSeed ? colorPRNG.int(72, 86) : colorPRNG.int(11, 22);

  // Apply overrides after PRNG consumption.
  const isDark      = isDarkOverride     ?? isDarkFromSeed;
  const saturation  = saturationOverride ?? saturationFromSeed;
  const modeFlipped = isDarkOverride !== null && isDarkOverride !== isDarkFromSeed;
  const cardLightness   = cardLightnessOverride ?? (modeFlipped ? altLightness   : cardLightnessFromSeed);
  const symbolLightness = modeFlipped ? (isDark ? 87 : 15) : symbolLightnessFromSeed;

  // ── Symbol style: seed-derived or explicit override ───────────────────────
  const autoStyle   = stylePRNG.int(0, 24);
  const symbolStyle = logoStyle === -2 ? -2 : (logoStyle >= 0 && logoStyle <= 24) ? logoStyle : autoStyle;

  // ── Logo variation: drawn from logoPRNG (internals only, not style) ───────
  const symbolRadiusFactor = logoPRNG.float(0.169, 0.286); // radius as fraction of card width

  // ── Card geometry (pure math, no PRNG) ───────────────────────────────────
  const refDim   = size * (1 - 2 * padding);       // reference dimension for card fitting
  let cardWidth, cardHeight;
  if (cardAspect <= 1) {
    cardHeight = refDim * cardScale;
    cardWidth  = cardHeight * cardAspect;
  } else {
    cardWidth  = refDim * cardScale;
    cardHeight = cardWidth / cardAspect;
  }

  // Canvas/SVG is exactly the card bounds — no padding
  const centerX      = cardWidth / 2;
  const centerY      = cardHeight / 2;
  const cardLeft     = 0;
  const cardTop      = 0;
  const maxRadius    = Math.min(cardWidth, cardHeight) / 2;
  const cornerRadius = maxRadius * borderRadius;

  const shortSide = Math.min(cardWidth, cardHeight);
  const landscape = cardAspect > 1;

  const geometry = { frameW: cardWidth, frameH: cardHeight, cardLeft, cardTop, cardWidth, cardHeight, cornerRadius, centerX, centerY, shortSide, landscape };

  if (ctx.cropTo) ctx.cropTo(0, 0, cardWidth, cardHeight);

  // ── Colour helpers ────────────────────────────────────────────────────────
  // cardColor   — base hue, used for the card body gradient and shadow
  // symbolColor — slightly drifted hue, used for the logo and text
  const cardColor   = (lightnessAdjust = 0, alpha = 1) =>
    hsla(hue, saturation, cardLightness + lightnessAdjust, alpha);
  const symbolColor = (lightnessAdjust = 0, alpha = 0.9) =>
    hsla(hue + symbolHueDrift, saturation, symbolLightness + lightnessAdjust, alpha);

  // ── Derived logo metrics ──────────────────────────────────────────────────
  const symbolRadius = shortSide * symbolRadiusFactor * logoScale;
  const symbolX      = landscape ? cardLeft + cardWidth * 0.30 : centerX;
  const isSquare     = Math.abs(cardAspect - 1) < 0.01;
  const symbolY      = landscape ? cardTop + cardHeight * 0.50
                     : cardTop + cardHeight * 0.38;

  // ── Drawing ───────────────────────────────────────────────────────────────

  // Clip everything to the card boundary (canvas is now card-sized)
  ctx.save();
  roundedRectPath(ctx, cardLeft, cardTop, cardWidth, cardHeight, cornerRadius);
  ctx.clip();

  drawCardBodyGradient(ctx, geometry, isDark, cardColor);
  drawVignette(ctx, geometry, isDark);

  // ── Background texture ────────────────────────────────────────────────
  // Always consume cardPRNG for the blob-noise grid (style 0) to preserve
  // the downstream sequence, even when a different bg style is active.
  const bgPRNG = makePRNG(seed ^ 0xBACE0000);
  const autoBgStyle = bgPRNG.int(0, 15);
  const effectiveBgStyle = bgStyle >= 0 ? bgStyle : autoBgStyle;
  // Consume cardPRNG exactly as the old drawNoise did — preserve sequence
  for (let row = 0; row < noiseZoom; row++) {
    for (let col = 0; col < noiseZoom; col++) {
      cardPRNG.float(0, 1); // cx jitter
      cardPRNG.float(0, 1); // cy jitter
      cardPRNG.next();       // brightness
    }
  }
  if (bgStyle !== -2) {
    ctx.save();
    ctx.globalCompositeOperation = bgBlendMode;
    drawBackgroundTexture(ctx, geometry, bgPRNG, effectiveBgStyle, noiseBrightness, noiseContrast, noiseZoom, bgBlur);
    ctx.restore();
  }
  if (patternType !== -2) {
    const effectivePatternType = patternType < 0 ? patternPRNG.int(0, PATTERN_NAMES.length - 1) : patternType;
    if (patternRotation !== 0) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(patternRotation * Math.PI / 180);
      ctx.translate(-centerX, -centerY);
    }
    drawPatterns(ctx, geometry, patternPRNG, effectivePatternType, patternOpacity, patternScale, isDark, hue, saturation, cardLightness, patternTwoTone);
    if (patternRotation !== 0) ctx.restore();
  }
  if (showArtifacts) drawArtifacts(ctx, geometry, isDark, artifactPRNG, artifactOpacity, artifactCount, artifactScale, artifactTypeLock);

  // Symbol — drawn with its own save/restore so ctx state leaks don't affect text
  if (symbolStyle >= 0) {
    ctx.save();
    if (embossMode !== 'none') {
      const offset = cardWidth * 0.012;
      const sign = embossMode === 'emboss' ? 1 : -1;
      // Shadow pass — darker, offset toward light source
      const shadowColor = (adj, a) => symbolColor(adj - 30, (a ?? 0.9) * 0.2);
      drawSymbol(ctx, symbolX + offset * sign, symbolY + offset * sign, symbolRadius, symbolStyle, shadowColor, logoPRNG.clone());
      // Highlight pass — lighter, offset away from light source
      const highlightColor = (adj, a) => symbolColor(adj + 30, (a ?? 0.9) * 0.13);
      drawSymbol(ctx, symbolX - offset * sign, symbolY - offset * sign, symbolRadius, symbolStyle, highlightColor, logoPRNG.clone());
    }
    drawSymbol(ctx, symbolX, symbolY, symbolRadius, symbolStyle, symbolColor, logoPRNG);
    ctx.restore();
  }

  drawCardText(ctx, geometry, personName, jobTitle, symbolColor);
  drawTopGloss(ctx, geometry);
  if (showLanyard) drawLanyardHole(ctx, geometry, isDark);

  ctx.restore(); // end card clip

  // Edge stroke drawn outside the clip so it sits cleanly on the card perimeter
  drawCardEdge(ctx, geometry, hue, saturation, isDark);
}
