// ── Pattern layer ──────────────────────────────────────────────────────
// Structured, prominent patterns drawn between noise and artifacts.
// Each pattern receives the same signature and draws within the card clip.
// Two-tone: patterns use both a lighter and darker shade of the card's
// hue/saturation, creating depth within the card's colour palette.

import { hsla } from './utils.js';

const TAU = Math.PI * 2;

// ── Individual pattern functions ──────────────────────────────────────
// Each receives (ctx, geo, prng, opacity, scale, toneA, toneB)
// toneA/toneB are functions: (alpha) => css colour string

function drawHalftone(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h } = geo;
  const spacing = w * 0.028 * scale;
  const maxR = spacing * 0.48;

  // Build a smooth tonal field from 2–4 gradient sources
  // Each source creates a radial falloff; the field is their sum, normalised to 0–1
  const srcCount = prng.int(2, 4);
  const sources = [];
  for (let i = 0; i < srcCount; i++) {
    sources.push({
      x: w * prng.float(0.05, 0.95),
      y: h * prng.float(0.05, 0.95),
      r: Math.max(w, h) * prng.float(0.3, 0.8),
      strength: prng.float(0.4, 1.0),
    });
  }

  function sampleField(px, py) {
    let v = 0;
    for (const s of sources) {
      const d = Math.hypot(px - s.x, py - s.y);
      v += s.strength * Math.max(0, 1 - d / s.r);
    }
    return Math.min(v, 1);
  }

  // Slight rotation for print-like angled screen
  const angle = prng.float(0.1, 0.6);
  const cos = Math.cos(angle), sin = Math.sin(angle);

  ctx.save();
  let col = 0;
  const diagonal = Math.hypot(w, h);
  const steps = Math.ceil(diagonal / spacing) + 2;
  const ox = w / 2, oy = h / 2;

  for (let row = -steps; row <= steps; row++) {
    for (let c = -steps; c <= steps; c++) {
      // Rotated grid position
      const gx = c * spacing;
      const gy = row * spacing;
      const x = ox + gx * cos - gy * sin;
      const y = oy + gx * sin + gy * cos;
      if (x < -maxR || x > w + maxR || y < -maxR || y > h + maxR) continue;

      const value = sampleField(x, y);
      const r = maxR * value;
      if (r < 0.4) continue;

      const tone = col++ % 2 === 0 ? toneA : toneB;
      ctx.fillStyle = tone(opacity);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGuilloche(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h, centerX: cx, centerY: cy } = geo;
  const lines = prng.int(4, 8);
  const baseR = Math.min(w, h) * 0.4 * scale;
  const freqA = prng.int(3, 9);
  const freqB = prng.int(5, 13);
  const ampA = baseR * prng.float(0.15, 0.4);
  const ampB = baseR * prng.float(0.05, 0.2);

  ctx.save();
  ctx.lineWidth = w * 0.002;
  ctx.lineCap = 'round';

  for (let n = 0; n < lines; n++) {
    const phase = (n / lines) * TAU;
    const tone = n % 2 === 0 ? toneA : toneB;
    ctx.strokeStyle = tone(opacity * 0.8);
    ctx.beginPath();
    for (let t = 0; t <= TAU; t += 0.02) {
      const r = baseR + Math.sin(freqA * t + phase) * ampA + Math.cos(freqB * t) * ampB;
      const x = cx + r * Math.cos(t);
      const y = cy + r * Math.sin(t);
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function drawConcentricRings(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h } = geo;
  const fx = w * prng.float(0.15, 0.85);
  const fy = h * prng.float(0.15, 0.85);
  const maxR = Math.hypot(w, h) * 0.6 * scale;
  const ringCount = prng.int(8, 20);
  const spacing = maxR / ringCount;

  ctx.save();
  ctx.lineWidth = w * 0.003;

  for (let i = 1; i <= ringCount; i++) {
    const r = i * spacing;
    const widthVar = 1 + prng.float(-0.3, 0.3);
    ctx.lineWidth = w * 0.003 * widthVar;
    const tone = i % 2 === 0 ? toneA : toneB;
    ctx.strokeStyle = tone(opacity * 0.7);
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawScanlines(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h } = geo;
  const angle = prng.float(-0.3, 0.3);
  const spacing = w * 0.015 * scale;
  const diagonal = Math.hypot(w, h);
  const lineCount = Math.ceil(diagonal / spacing) + 2;

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(angle);
  ctx.lineWidth = spacing * 0.3;
  ctx.lineCap = 'butt';

  const startY = -diagonal / 2;
  for (let i = 0; i < lineCount; i++) {
    const y = startY + i * spacing;
    const tone = i % 2 === 0 ? toneA : toneB;
    ctx.strokeStyle = tone(opacity * 0.5);
    ctx.beginPath();
    ctx.moveTo(-diagonal / 2, y);
    ctx.lineTo(diagonal / 2, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTopographic(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h } = geo;
  const sourceCount = prng.int(2, 4);
  const sources = [];
  for (let i = 0; i < sourceCount; i++) {
    sources.push({
      x: w * prng.float(0.1, 0.9),
      y: h * prng.float(0.1, 0.9),
      strength: prng.float(0.5, 1.0),
    });
  }
  const maxR = Math.min(w, h) * 0.5 * scale;
  const levels = prng.int(6, 14);

  ctx.save();
  ctx.lineWidth = w * 0.002;

  let ringIdx = 0;
  for (const src of sources) {
    for (let lv = 1; lv <= levels; lv++) {
      const r = (lv / levels) * maxR * src.strength;
      const tone = ringIdx++ % 2 === 0 ? toneA : toneB;
      ctx.strokeStyle = tone(opacity * 0.6);
      ctx.beginPath();
      const steps = 64;
      for (let s = 0; s <= steps; s++) {
        const t = (s / steps) * TAU;
        const wobble = prng.float(-0.08, 0.08) * r;
        const x = src.x + (r + wobble) * Math.cos(t);
        const y = src.y + (r + wobble) * Math.sin(t);
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawMoire(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h } = geo;
  const spacing = w * 0.02 * scale;
  const diagonal = Math.hypot(w, h);
  const lineCount = Math.ceil(diagonal / spacing) + 2;
  const angle1 = prng.float(0, Math.PI * 0.15);
  const angle2 = angle1 + prng.float(0.05, 0.2);

  ctx.save();
  ctx.lineWidth = spacing * 0.25;
  ctx.lineCap = 'butt';

  // Grid 1 — tone A
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(angle1);
  ctx.strokeStyle = toneA(opacity * 0.4);
  for (let i = 0; i < lineCount; i++) {
    const y = -diagonal / 2 + i * spacing;
    ctx.beginPath();
    ctx.moveTo(-diagonal / 2, y);
    ctx.lineTo(diagonal / 2, y);
    ctx.stroke();
  }
  ctx.restore();

  // Grid 2 — tone B
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(angle2);
  ctx.strokeStyle = toneB(opacity * 0.4);
  for (let i = 0; i < lineCount; i++) {
    const y = -diagonal / 2 + i * spacing;
    ctx.beginPath();
    ctx.moveTo(-diagonal / 2, y);
    ctx.lineTo(diagonal / 2, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

function drawChevron(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h } = geo;
  const rowH = w * 0.05 * scale;
  const chevW = w * 0.08 * scale;
  const rows = Math.ceil(h / rowH) + 2;
  const cols = Math.ceil(w / chevW) + 2;

  ctx.save();
  ctx.lineWidth = w * 0.003;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let r = -1; r < rows; r++) {
    const tone = r % 2 === 0 ? toneA : toneB;
    ctx.strokeStyle = tone(opacity * 0.55);
    for (let c = -1; c < cols; c++) {
      const x = c * chevW + (r % 2 === 0 ? 0 : chevW * 0.5);
      const y = r * rowH;
      ctx.beginPath();
      ctx.moveTo(x, y + rowH * 0.5);
      ctx.lineTo(x + chevW * 0.5, y);
      ctx.lineTo(x + chevW, y + rowH * 0.5);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawHexGrid(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h } = geo;
  const hexR = w * 0.035 * scale;
  const hexH = hexR * Math.sqrt(3);
  const cols = Math.ceil(w / (hexR * 1.5)) + 2;
  const rows = Math.ceil(h / hexH) + 2;

  ctx.save();
  ctx.lineWidth = w * 0.002;

  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const cx = c * hexR * 1.5;
      const cy = r * hexH + (c % 2 === 0 ? 0 : hexH * 0.5);
      const tone = (r + c) % 2 === 0 ? toneA : toneB;
      ctx.strokeStyle = tone(opacity * 0.5);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (TAU / 6) * i - Math.PI / 6;
        const hx = cx + hexR * Math.cos(angle);
        const hy = cy + hexR * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawRadialBurst(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h } = geo;
  const fx = w * prng.float(0.15, 0.85);
  const fy = h * prng.float(0.15, 0.85);
  const rayCount = prng.int(24, 64);
  const diagonal = Math.hypot(w, h);

  ctx.save();
  ctx.lineWidth = w * 0.002;
  ctx.lineCap = 'butt';

  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * TAU + prng.float(-0.02, 0.02);
    const len = diagonal * prng.float(0.7, 1.0);
    const tone = i % 2 === 0 ? toneA : toneB;
    ctx.strokeStyle = tone(opacity * 0.45);
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + Math.cos(angle) * len, fy + Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDiamondLattice(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h } = geo;
  const spacing = w * 0.04 * scale;
  const diagonal = Math.hypot(w, h);
  const lineCount = Math.ceil(diagonal / spacing) + 2;

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.lineWidth = w * 0.002;
  ctx.lineCap = 'butt';

  // Two sets of parallel lines at ±45° — one per tone
  const angles = [Math.PI / 4, -Math.PI / 4];
  const tones  = [toneA, toneB];
  for (let g = 0; g < 2; g++) {
    ctx.save();
    ctx.rotate(angles[g]);
    ctx.strokeStyle = tones[g](opacity * 0.45);
    for (let i = 0; i < lineCount; i++) {
      const y = -diagonal / 2 + i * spacing;
      ctx.beginPath();
      ctx.moveTo(-diagonal / 2, y);
      ctx.lineTo(diagonal / 2, y);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawWaveInterference(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h } = geo;
  const waveCount = prng.int(3, 6);
  const waveLines = prng.int(12, 24);
  const baseFreq = prng.float(0.01, 0.03) / scale;
  const amp = h * 0.06 * scale;

  ctx.save();
  ctx.lineWidth = w * 0.002;

  for (let wv = 0; wv < waveCount; wv++) {
    const freq = baseFreq * prng.float(0.7, 1.4);
    const phase = prng.float(0, TAU);
    const waveAmp = amp * prng.float(0.6, 1.4);
    const tone = wv % 2 === 0 ? toneA : toneB;
    ctx.strokeStyle = tone(opacity * 0.5);
    for (let ln = 0; ln < waveLines; ln++) {
      const baseY = (ln / (waveLines - 1)) * h;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const y = baseY + Math.sin(x * freq + phase + ln * 0.3) * waveAmp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawStipple(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h } = geo;
  const dotCount = Math.round(800 * scale * scale);
  const minR = w * 0.002;
  const maxR = w * 0.008 * scale;
  const dx = w * prng.float(0.2, 0.8);
  const dy = h * prng.float(0.2, 0.8);
  const maxDist = Math.hypot(w, h) * 0.5;

  ctx.save();
  for (let i = 0; i < dotCount; i++) {
    const x = prng.float(0, w);
    const y = prng.float(0, h);
    const dist = Math.hypot(x - dx, y - dy) / maxDist;
    const densityFactor = 1 - Math.min(dist, 1) * 0.7;
    if (prng.next() > densityFactor) continue;
    const r = minR + (maxR - minR) * prng.float(0, 1) * densityFactor;
    const tone = prng.next() > 0.5 ? toneA : toneB;
    ctx.fillStyle = tone(opacity * 0.7);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawCrosshatch(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h } = geo;
  const spacing = w * 0.025 * scale;
  const diagonal = Math.hypot(w, h);
  const lineCount = Math.ceil(diagonal / spacing) + 2;
  const angle = prng.float(-0.15, 0.15); // slight base rotation

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.lineWidth = w * 0.0015;
  ctx.lineCap = 'butt';

  // Set 1 — forward slash lines
  ctx.save();
  ctx.rotate(angle + Math.PI / 4);
  ctx.strokeStyle = toneA(opacity * 0.45);
  for (let i = 0; i < lineCount; i++) {
    const y = -diagonal / 2 + i * spacing;
    ctx.beginPath();
    ctx.moveTo(-diagonal / 2, y);
    ctx.lineTo(diagonal / 2, y);
    ctx.stroke();
  }
  ctx.restore();

  // Set 2 — backslash lines
  ctx.save();
  ctx.rotate(angle - Math.PI / 4);
  ctx.strokeStyle = toneB(opacity * 0.45);
  for (let i = 0; i < lineCount; i++) {
    const y = -diagonal / 2 + i * spacing;
    ctx.beginPath();
    ctx.moveTo(-diagonal / 2, y);
    ctx.lineTo(diagonal / 2, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

function drawZigzag(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h } = geo;
  const rowH = w * 0.04 * scale;
  const segW = w * 0.03 * scale;
  const rows = Math.ceil(h / rowH) + 2;
  const segs = Math.ceil(w / segW) + 2;

  ctx.save();
  ctx.lineWidth = w * 0.0025;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let r = -1; r < rows; r++) {
    const baseY = r * rowH;
    const tone = r % 2 === 0 ? toneA : toneB;
    ctx.strokeStyle = tone(opacity * 0.5);
    ctx.beginPath();
    for (let s = 0; s <= segs; s++) {
      const x = s * segW;
      const y = baseY + (s % 2 === 0 ? 0 : rowH * 0.5);
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawSpiralField(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h } = geo;
  const spiralCount = prng.int(2, 5);

  ctx.save();
  ctx.lineWidth = w * 0.002;
  ctx.lineCap = 'round';

  for (let sp = 0; sp < spiralCount; sp++) {
    const cx = w * prng.float(0.1, 0.9);
    const cy = h * prng.float(0.1, 0.9);
    const maxR = Math.min(w, h) * prng.float(0.2, 0.45) * scale;
    const turns = prng.float(2, 5);
    const dir = prng.next() > 0.5 ? 1 : -1;
    const tone = sp % 2 === 0 ? toneA : toneB;
    ctx.strokeStyle = tone(opacity * 0.5);

    ctx.beginPath();
    const steps = Math.round(turns * 80);
    for (let s = 0; s <= steps; s++) {
      const t = (s / steps) * turns * TAU * dir;
      const r = (s / steps) * maxR;
      const x = cx + r * Math.cos(t);
      const y = cy + r * Math.sin(t);
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawBrickWall(ctx, geo, prng, opacity, scale, toneA, toneB) {
  const { cardWidth: w, cardHeight: h } = geo;
  const brickH = w * 0.03 * scale;
  const brickW = w * 0.08 * scale;
  const rows = Math.ceil(h / brickH) + 2;
  const cols = Math.ceil(w / brickW) + 2;

  ctx.save();
  ctx.lineWidth = w * 0.002;

  for (let r = -1; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : brickW * 0.5;
    const y = r * brickH;

    // Horizontal mortar line — tone A
    ctx.strokeStyle = toneA(opacity * 0.4);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();

    // Vertical mortar lines — tone B
    ctx.strokeStyle = toneB(opacity * 0.4);
    for (let c = -1; c < cols; c++) {
      const x = c * brickW + offset;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + brickH);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ── Pattern dispatcher ────────────────────────────────────────────────

const PATTERN_FNS = [
  drawHalftone,        // 0
  drawGuilloche,       // 1
  drawConcentricRings, // 2
  drawScanlines,       // 3
  drawTopographic,     // 4
  drawMoire,           // 5
  drawChevron,         // 6
  drawHexGrid,         // 7
  drawRadialBurst,     // 8
  drawDiamondLattice,  // 9
  drawWaveInterference,// 10
  drawStipple,         // 11
  drawCrosshatch,      // 12
  drawZigzag,          // 13
  drawSpiralField,     // 14
  drawBrickWall,       // 15
];

/**
 * Draw a structured pattern on the card.
 *
 * Two-tone approach: derives a lighter and darker shade from the card's
 * hue/saturation/lightness, then passes them as toneA/toneB functions
 * to each pattern. Each tone function takes an alpha and returns a CSS color.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} geometry - Card geometry from generateCard
 * @param {object} prng     - Seeded PRNG for internal variation
 * @param {number} patternType - 0–11 pattern index
 * @param {number} opacity  - Base opacity multiplier
 * @param {number} scale    - Size multiplier
 * @param {boolean} isDark  - Dark theme?
 * @param {number} hue      - Card hue 0–359
 * @param {number} saturation - Card saturation
 * @param {number} cardLightness - Card body lightness (0–100)
 */
export function drawPatterns(ctx, geometry, prng, patternType, opacity, scale, isDark, hue, saturation, cardLightness, twoTone) {
  const fn = PATTERN_FNS[patternType];
  if (!fn) return;

  // Derive two tones relative to the card body lightness
  // toneA: lighter shift — lifts above the card surface
  // toneB: darker shift  — recesses into the card surface
  const shift = isDark ? 12 : -12;
  const lA = Math.max(0, Math.min(100, cardLightness + shift));
  const lB = Math.max(0, Math.min(100, cardLightness - shift));
  const toneA = (alpha) => hsla(hue, saturation * 0.7, lA, alpha);
  const toneB = twoTone
    ? (alpha) => hsla(hue, saturation * 0.7, lB, alpha)
    : toneA;  // single-tone: both tones are the same

  fn(ctx, geometry, prng, opacity, scale, toneA, toneB);
}
