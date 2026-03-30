// ── Background styles ────────────────────────────────────────────────────
// Multiple background texture options drawn after the base card gradient.
// Each style receives (ctx, geo, prng, brightness, contrast, zoom, blur)
//   brightness = base opacity 0–0.3 typical
//   contrast   = per-element opacity spread 0–0.2 typical
//   zoom       = detail level 2–16 (fewer = coarser, more = finer)
//   blur       = fraction of card max dimension (e.g. 0.03 = 3%)

const TAU = Math.PI * 2;

/** Convert blur fraction to pixel value for a given geometry. */
function blurPx(geo, blur) {
  return Math.round(Math.max(geo.cardWidth, geo.cardHeight) * blur);
}

/** Apply post-process blur via offscreen canvas if blur > 0. */
function withBlur(ctx, geo, blur, drawFn) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  const bp = blurPx(geo, blur);
  if (bp <= 0) { drawFn(ctx); return; }

  const off = document.createElement('canvas');
  off.width  = cardWidth  | 0;
  off.height = cardHeight | 0;
  const offCtx = off.getContext('2d');
  // Shift coords so drawFn draws at 0,0
  offCtx.translate(-cardLeft, -cardTop);
  drawFn(offCtx);
  offCtx.translate(cardLeft, cardTop);

  ctx.save();
  ctx.filter = `blur(${bp}px)`;
  ctx.drawImage(off, cardLeft, cardTop);
  ctx.restore();
}

// ── 0: Noise (original blob noise) ───────────────────────────────────────
function drawNoise(ctx, geo, prng, brightness, contrast, zoom, blur) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  const cellW = cardWidth / zoom;
  const cellH = cardHeight / zoom;
  const blobRadius = Math.max(cellW, cellH) * 1.6;

  const off = document.createElement('canvas');
  off.width  = cardWidth  | 0;
  off.height = cardHeight | 0;
  const offCtx = off.getContext('2d');

  for (let row = 0; row < zoom; row++) {
    for (let col = 0; col < zoom; col++) {
      const cx = (col + 0.5) * cellW + prng.float(-cellW * 0.25, cellW * 0.25);
      const cy = (row + 0.5) * cellH + prng.float(-cellH * 0.25, cellH * 0.25);
      const b  = brightness + prng.next() * contrast;
      const grad = offCtx.createRadialGradient(cx, cy, 0, cx, cy, blobRadius);
      grad.addColorStop(0, `rgba(255,255,255,${b.toFixed(3)})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      offCtx.fillStyle = grad;
      offCtx.fillRect(0, 0, cardWidth, cardHeight);
    }
  }

  ctx.save();
  const bp = blurPx(geo, blur);
  if (bp > 0) ctx.filter = `blur(${bp}px)`;
  ctx.drawImage(off, cardLeft, cardTop);
  ctx.restore();
}

// ── 1: Solid ─────────────────────────────────────────────────────────────
function drawSolid() {}

// ── 2: Linear Gradient ───────────────────────────────────────────────────
// Zoom controls number of gradient bands — 2 = single sweep, higher = repeating bands.
function drawLinearGradient(ctx, geo, prng, brightness, contrast, zoom, blur) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  const angle = prng.float(0, TAU);
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const half = Math.max(cardWidth, cardHeight) * 0.5;
  const cx = cardLeft + cardWidth / 2, cy = cardTop + cardHeight / 2;
  const bands = Math.max(1, Math.round(zoom / 2));

  withBlur(ctx, geo, blur, (c) => {
    for (let b = 0; b < bands; b++) {
      const frac = bands === 1 ? 0.5 : b / (bands - 1);
      const ox = (frac - 0.5) * half * 0.4;
      const a = brightness * 1.5 + prng.next() * contrast;
      const grad = c.createLinearGradient(
        cx - cos * half + ox, cy - sin * half,
        cx + cos * half + ox, cy + sin * half
      );
      grad.addColorStop(0,   `rgba(255,255,255,${(a * 1.2).toFixed(3)})`);
      grad.addColorStop(0.5, `rgba(255,255,255,0)`);
      grad.addColorStop(1,   `rgba(0,0,0,${(a * 0.5).toFixed(3)})`);
      c.fillStyle = grad;
      c.fillRect(cardLeft, cardTop, cardWidth, cardHeight);
    }
  });
}

// ── 3: Radial Glow ──────────────────────────────────────────────────────
// Zoom controls number of glow sources.
function drawRadialGlow(ctx, geo, prng, brightness, contrast, zoom, blur) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  const count = Math.max(1, Math.round(zoom / 3));

  withBlur(ctx, geo, blur, (c) => {
    for (let i = 0; i < count; i++) {
      const gx = cardLeft + cardWidth  * prng.float(0.2, 0.8);
      const gy = cardTop  + cardHeight * prng.float(0.2, 0.8);
      const r  = Math.max(cardWidth, cardHeight) * prng.float(0.3, 0.8);
      const a  = brightness * 2 + prng.next() * contrast;
      const grad = c.createRadialGradient(gx, gy, 0, gx, gy, r);
      grad.addColorStop(0,   `rgba(255,255,255,${a.toFixed(3)})`);
      grad.addColorStop(0.6, `rgba(255,255,255,${(a * 0.25).toFixed(3)})`);
      grad.addColorStop(1,   `rgba(255,255,255,0)`);
      c.fillStyle = grad;
      c.fillRect(cardLeft, cardTop, cardWidth, cardHeight);
    }
  });
}

// ── 4: Film Grain ────────────────────────────────────────────────────────
// Zoom controls grain coarseness (higher = finer grain).
function drawFilmGrain(ctx, geo, prng, brightness, contrast, zoom, blur) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  // zoom 2 → scale 8 (coarse), zoom 16 → scale 1 (fine pixel noise)
  const scale = Math.max(1, Math.round(18 - zoom));
  const w = Math.max(1, Math.ceil(cardWidth / scale));
  const h = Math.max(1, Math.ceil(cardHeight / scale));

  const off = document.createElement('canvas');
  off.width  = w;
  off.height = h;
  const offCtx = off.getContext('2d');
  const imgData = offCtx.createImageData(w, h);
  const data = imgData.data;

  const baseBright = brightness * 6;   // scale up: brightness ~0.06 → ~0.36
  const contrastMul = contrast * 8;    // contrast ~0.05 → ~0.40

  for (let i = 0; i < data.length; i += 4) {
    const v = prng.next();
    const lum = Math.round((baseBright + v * contrastMul) * 255);
    const alpha = Math.round((baseBright * 0.5 + v * contrastMul * 0.8) * 255);
    data[i]     = Math.min(255, lum);
    data[i + 1] = Math.min(255, lum);
    data[i + 2] = Math.min(255, lum);
    data[i + 3] = Math.min(255, alpha);
  }
  offCtx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const bp = blurPx(geo, blur * 0.5);
  if (bp > 0) ctx.filter = `blur(${bp}px)`;
  ctx.drawImage(off, cardLeft, cardTop, cardWidth, cardHeight);
  ctx.restore();
}

// ── 5: Cloudy ────────────────────────────────────────────────────────────
// Zoom controls cloud count (2 = few big clouds, 16 = many small).
function drawCloudy(ctx, geo, prng, brightness, contrast, zoom, blur) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  const count = Math.max(2, Math.round(zoom * 0.8));
  const maxDim = Math.max(cardWidth, cardHeight);
  // Higher zoom → smaller clouds
  const rMin = maxDim * (0.5 - zoom * 0.02);
  const rMax = maxDim * (0.9 - zoom * 0.03);

  const off = document.createElement('canvas');
  off.width  = cardWidth  | 0;
  off.height = cardHeight | 0;
  const offCtx = off.getContext('2d');

  for (let i = 0; i < count; i++) {
    const cx = prng.float(-cardWidth * 0.2, cardWidth * 1.2);
    const cy = prng.float(-cardHeight * 0.2, cardHeight * 1.2);
    const r  = prng.float(Math.max(rMin, maxDim * 0.15), Math.max(rMax, maxDim * 0.25));
    const b  = brightness * 1.5 + prng.next() * contrast * 2;
    const grad = offCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0,   `rgba(255,255,255,${b.toFixed(3)})`);
    grad.addColorStop(0.4, `rgba(255,255,255,${(b * 0.5).toFixed(3)})`);
    grad.addColorStop(1,   `rgba(255,255,255,0)`);
    offCtx.fillStyle = grad;
    offCtx.fillRect(0, 0, cardWidth, cardHeight);
  }

  ctx.save();
  const bp = blurPx(geo, blur * 1.8);
  if (bp > 0) ctx.filter = `blur(${bp}px)`;
  ctx.drawImage(off, cardLeft, cardTop);
  ctx.restore();
}

// ── 6: Brushed ───────────────────────────────────────────────────────────
// Zoom controls line density (higher = more lines, finer texture).
function drawBrushed(ctx, geo, prng, brightness, contrast, zoom, blur) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  const lineCount = Math.round(cardHeight * zoom * 0.12);
  const angle = prng.float(-0.08, 0.08);

  withBlur(ctx, geo, blur * 0.5, (c) => {
    c.save();
    c.translate(cardLeft + cardWidth / 2, cardTop + cardHeight / 2);
    c.rotate(angle);
    c.translate(-(cardLeft + cardWidth / 2), -(cardTop + cardHeight / 2));
    for (let i = 0; i < lineCount; i++) {
      const y = cardTop + (i / lineCount) * cardHeight;
      const a = brightness * 0.8 + prng.next() * contrast * 1.5;
      c.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      c.lineWidth = prng.float(0.5, 2.0);
      c.beginPath();
      c.moveTo(cardLeft - 10, y);
      c.lineTo(cardLeft + cardWidth + 10, y);
      c.stroke();
    }
    c.restore();
  });
}

// ── 7: Speckle ───────────────────────────────────────────────────────────
// Zoom controls dot density and size (higher = more smaller dots).
function drawSpeckle(ctx, geo, prng, brightness, contrast, zoom, blur) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  const area = cardWidth * cardHeight;
  const count = Math.round(area * 0.0003 * zoom);
  const maxR = Math.max(0.5, 4 - zoom * 0.2);

  withBlur(ctx, geo, blur * 0.3, (c) => {
    for (let i = 0; i < count; i++) {
      const x = cardLeft + prng.float(0, cardWidth);
      const y = cardTop  + prng.float(0, cardHeight);
      const r = prng.float(0.4, maxR);
      const a = brightness + prng.next() * contrast;
      c.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fill();
    }
  });
}

// ── 8: Mesh Gradient ─────────────────────────────────────────────────────
// Zoom controls number of gradient points.
function drawMeshGradient(ctx, geo, prng, brightness, contrast, zoom, blur) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  const points = Math.max(2, Math.round(zoom * 0.6));

  const off = document.createElement('canvas');
  off.width  = cardWidth  | 0;
  off.height = cardHeight | 0;
  const offCtx = off.getContext('2d');

  for (let i = 0; i < points; i++) {
    const cx = prng.float(0, cardWidth);
    const cy = prng.float(0, cardHeight);
    const r  = Math.max(cardWidth, cardHeight) * prng.float(0.25, 0.6);
    const hueShift = prng.int(-30, 30);
    const lum = prng.int(230, 255);
    const rr = Math.min(255, lum + (hueShift > 0 ? hueShift : 0));
    const bb = Math.min(255, lum + (hueShift < 0 ? -hueShift : 0));
    const a  = brightness * 2 + prng.next() * contrast;
    const grad = offCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0,   `rgba(${rr},${lum},${bb},${a.toFixed(3)})`);
    grad.addColorStop(1,   `rgba(${rr},${lum},${bb},0)`);
    offCtx.fillStyle = grad;
    offCtx.fillRect(0, 0, cardWidth, cardHeight);
  }

  ctx.save();
  const bp = blurPx(geo, blur * 1.5);
  if (bp > 0) ctx.filter = `blur(${bp}px)`;
  ctx.drawImage(off, cardLeft, cardTop);
  ctx.restore();
}

// ── 9: Dappled ───────────────────────────────────────────────────────────
// Zoom controls bokeh count and size.
function drawDappled(ctx, geo, prng, brightness, contrast, zoom, blur) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  const count = Math.round(zoom * 3);
  const short = Math.min(cardWidth, cardHeight);
  const maxR = short * (0.3 - zoom * 0.012);

  withBlur(ctx, geo, blur * 0.5, (c) => {
    for (let i = 0; i < count; i++) {
      const x = cardLeft + prng.float(-cardWidth * 0.1, cardWidth * 1.1);
      const y = cardTop  + prng.float(-cardHeight * 0.1, cardHeight * 1.1);
      const r = prng.float(short * 0.02, Math.max(short * 0.03, maxR));
      const a = brightness * 1.5 + prng.next() * contrast;
      const grad = c.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0,   `rgba(255,255,255,${a.toFixed(3)})`);
      grad.addColorStop(0.7, `rgba(255,255,255,${(a * 0.3).toFixed(3)})`);
      grad.addColorStop(1,   `rgba(255,255,255,0)`);
      c.fillStyle = grad;
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fill();
    }
  });
}

// ── 10: Plasma ───────────────────────────────────────────────────────────
// Overlapping sine-wave bands producing a plasma-like interference pattern.
// Zoom controls frequency (more = tighter bands).
function drawPlasma(ctx, geo, prng, brightness, contrast, zoom, blur) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  const scale = 3;
  const w = Math.max(1, Math.ceil(cardWidth / scale));
  const h = Math.max(1, Math.ceil(cardHeight / scale));
  const freq = zoom * 0.008;

  // 3 random sine sources
  const ox1 = prng.float(0, 100), oy1 = prng.float(0, 100);
  const ox2 = prng.float(0, 100), oy2 = prng.float(0, 100);
  const ox3 = prng.float(0, 100), oy3 = prng.float(0, 100);

  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const offCtx = off.getContext('2d');
  const imgData = offCtx.createImageData(w, h);
  const data = imgData.data;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const sx = px * scale, sy = py * scale;
      const v1 = Math.sin((sx + ox1) * freq + (sy + oy1) * freq * 0.7);
      const v2 = Math.sin((sx + ox2) * freq * 1.3 - (sy + oy2) * freq * 0.5);
      const v3 = Math.sin(Math.hypot(sx - cardWidth / 2 + ox3, sy - cardHeight / 2 + oy3) * freq * 0.8);
      const v = (v1 + v2 + v3) / 3; // -1 to 1
      const norm = (v + 1) * 0.5;   // 0 to 1
      const lum = Math.round(norm * 255);
      const a = Math.round((brightness * 3 + norm * contrast * 4) * 255);
      const idx = (py * w + px) * 4;
      data[idx] = lum; data[idx + 1] = lum; data[idx + 2] = lum;
      data[idx + 3] = Math.min(255, a);
    }
  }
  offCtx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  const bp = blurPx(geo, blur);
  if (bp > 0) ctx.filter = `blur(${bp}px)`;
  ctx.drawImage(off, cardLeft, cardTop, cardWidth, cardHeight);
  ctx.restore();
}

// ── 11: Ripple ───────────────────────────────────────────────────────────
// Concentric ring interference from multiple centres.
// Zoom controls ring frequency.
function drawRipple(ctx, geo, prng, brightness, contrast, zoom, blur) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  const centres = [];
  const nCentres = prng.int(2, 4);
  for (let i = 0; i < nCentres; i++) {
    centres.push({ x: prng.float(0, cardWidth), y: prng.float(0, cardHeight) });
  }
  const freq = zoom * 0.03;
  const scale = 3;
  const w = Math.max(1, Math.ceil(cardWidth / scale));
  const h = Math.max(1, Math.ceil(cardHeight / scale));

  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const offCtx = off.getContext('2d');
  const imgData = offCtx.createImageData(w, h);
  const data = imgData.data;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const sx = px * scale, sy = py * scale;
      let v = 0;
      for (const c of centres) {
        v += Math.sin(Math.hypot(sx - c.x, sy - c.y) * freq);
      }
      v /= nCentres;
      const norm = (v + 1) * 0.5;
      const lum = Math.round(norm * 255);
      const a = Math.round((brightness * 3 + norm * contrast * 3) * 255);
      const idx = (py * w + px) * 4;
      data[idx] = lum; data[idx + 1] = lum; data[idx + 2] = lum;
      data[idx + 3] = Math.min(255, a);
    }
  }
  offCtx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  const bp = blurPx(geo, blur);
  if (bp > 0) ctx.filter = `blur(${bp}px)`;
  ctx.drawImage(off, cardLeft, cardTop, cardWidth, cardHeight);
  ctx.restore();
}

// ── 12: Weave ────────────────────────────────────────────────────────────
// Crosshatch fabric texture. Zoom controls thread density.
function drawWeave(ctx, geo, prng, brightness, contrast, zoom, blur) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  const spacing = Math.max(3, cardWidth / (zoom * 2.5));
  const angle1 = prng.float(-0.3, 0.3);
  const angle2 = angle1 + Math.PI / 2 + prng.float(-0.15, 0.15);

  withBlur(ctx, geo, blur * 0.4, (c) => {
    for (const angle of [angle1, angle2]) {
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const diag = Math.hypot(cardWidth, cardHeight);
      const steps = Math.ceil(diag / spacing) + 4;
      const cx = cardLeft + cardWidth / 2, cy = cardTop + cardHeight / 2;

      for (let i = -steps; i <= steps; i++) {
        const off = i * spacing;
        const a = brightness * 0.7 + prng.next() * contrast;
        c.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`;
        c.lineWidth = prng.float(0.5, spacing * 0.3);
        c.beginPath();
        c.moveTo(cx + cos * diag + sin * off, cy + sin * diag - cos * off);
        c.lineTo(cx - cos * diag + sin * off, cy - sin * diag - cos * off);
        c.stroke();
      }
    }
  });
}

// ── 13: Marble ───────────────────────────────────────────────────────────
// Flowing organic veins using displaced sine waves.
// Zoom controls vein density.
function drawMarble(ctx, geo, prng, brightness, contrast, zoom, blur) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  const scale = 3;
  const w = Math.max(1, Math.ceil(cardWidth / scale));
  const h = Math.max(1, Math.ceil(cardHeight / scale));
  const freq = zoom * 0.005;
  const warp = prng.float(3, 8);
  const ox = prng.float(0, 200), oy = prng.float(0, 200);

  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const offCtx = off.getContext('2d');
  const imgData = offCtx.createImageData(w, h);
  const data = imgData.data;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const sx = px * scale, sy = py * scale;
      // Warped sine creates vein-like undulations
      const distort = Math.sin((sx + ox) * freq * 0.7) * warp +
                      Math.cos((sy + oy) * freq * 0.9) * warp;
      const v = Math.sin((sx + sy + distort * 30) * freq);
      // Sharpen into veins using power curve
      const vein = Math.pow(Math.abs(v), 0.4);
      const lum = Math.round(vein * 255);
      const a = Math.round((brightness * 2 + vein * contrast * 4) * 255);
      const idx = (py * w + px) * 4;
      data[idx] = lum; data[idx + 1] = lum; data[idx + 2] = lum;
      data[idx + 3] = Math.min(255, a);
    }
  }
  offCtx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  const bp = blurPx(geo, blur * 0.8);
  if (bp > 0) ctx.filter = `blur(${bp}px)`;
  ctx.drawImage(off, cardLeft, cardTop, cardWidth, cardHeight);
  ctx.restore();
}

// ── 14: Topographic ─────────────────────────────────────────────────────
// Contour-line map texture. Zoom controls contour density.
function drawTopographic(ctx, geo, prng, brightness, contrast, zoom, blur) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  const scale = 3;
  const w = Math.max(1, Math.ceil(cardWidth / scale));
  const h = Math.max(1, Math.ceil(cardHeight / scale));
  const contours = zoom * 1.5;
  const ox1 = prng.float(0, 200), oy1 = prng.float(0, 200);
  const ox2 = prng.float(0, 200), oy2 = prng.float(0, 200);
  const freq = 0.008;

  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const offCtx = off.getContext('2d');
  const imgData = offCtx.createImageData(w, h);
  const data = imgData.data;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const sx = px * scale, sy = py * scale;
      // Smooth height field from overlapping sines
      const h1 = Math.sin((sx + ox1) * freq) * Math.cos((sy + oy1) * freq * 1.3);
      const h2 = Math.sin((sx + ox2) * freq * 0.7 + 1) * Math.cos((sy + oy2) * freq * 0.9);
      const height = (h1 + h2) * 0.5; // -1 to 1
      // Extract contour lines: sharp peaks where height crosses contour thresholds
      const scaled = height * contours;
      const frac = scaled - Math.floor(scaled);
      const edge = 1 - Math.min(frac, 1 - frac) * 6; // thin line at each contour
      const line = Math.max(0, edge);
      const lum = Math.round(line * 255);
      const a = Math.round((brightness * 1.5 + line * contrast * 5) * 255);
      const idx = (py * w + px) * 4;
      data[idx] = lum; data[idx + 1] = lum; data[idx + 2] = lum;
      data[idx + 3] = Math.min(255, a);
    }
  }
  offCtx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  const bp = blurPx(geo, blur * 0.6);
  if (bp > 0) ctx.filter = `blur(${bp}px)`;
  ctx.drawImage(off, cardLeft, cardTop, cardWidth, cardHeight);
  ctx.restore();
}

// ── 15: Caustics ─────────────────────────────────────────────────────────
// Water caustic light pattern. Zoom controls pattern density.
function drawCaustics(ctx, geo, prng, brightness, contrast, zoom, blur) {
  const { cardLeft, cardTop, cardWidth, cardHeight } = geo;
  const scale = 3;
  const w = Math.max(1, Math.ceil(cardWidth / scale));
  const h = Math.max(1, Math.ceil(cardHeight / scale));
  const freq = zoom * 0.006;
  const ox1 = prng.float(0, 100), oy1 = prng.float(0, 100);
  const ox2 = prng.float(0, 100), oy2 = prng.float(0, 100);
  const ox3 = prng.float(0, 100), oy3 = prng.float(0, 100);

  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const offCtx = off.getContext('2d');
  const imgData = offCtx.createImageData(w, h);
  const data = imgData.data;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const sx = px * scale, sy = py * scale;
      // Three overlapping warped sine fields — bright where they constructively interfere
      const v1 = Math.sin((sx + ox1) * freq + Math.cos((sy + oy1) * freq * 1.2) * 3);
      const v2 = Math.sin((sy + ox2) * freq * 0.9 + Math.sin((sx + oy2) * freq * 1.1) * 3);
      const v3 = Math.cos((sx + sy + ox3) * freq * 0.6 + Math.sin((sx - sy + oy3) * freq * 0.8) * 2);
      // Combine and sharpen the bright caustic ridges
      const raw = (v1 + v2 + v3) / 3; // -1 to 1
      const bright = Math.pow((raw + 1) * 0.5, 3) * 2; // emphasise peaks
      const lum = Math.round(Math.min(1, bright) * 255);
      const a = Math.round((brightness * 2 + bright * contrast * 5) * 255);
      const idx = (py * w + px) * 4;
      data[idx] = lum; data[idx + 1] = lum; data[idx + 2] = lum;
      data[idx + 3] = Math.min(255, a);
    }
  }
  offCtx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  const bp = blurPx(geo, blur);
  if (bp > 0) ctx.filter = `blur(${bp}px)`;
  ctx.drawImage(off, cardLeft, cardTop, cardWidth, cardHeight);
  ctx.restore();
}

// ── Dispatcher ───────────────────────────────────────────────────────────

const BG_STYLES = [
  drawNoise,          // 0
  drawSolid,          // 1
  drawLinearGradient, // 2
  drawRadialGlow,     // 3
  drawFilmGrain,      // 4
  drawCloudy,         // 5
  drawBrushed,        // 6
  drawSpeckle,        // 7
  drawMeshGradient,   // 8
  drawDappled,        // 9
  drawPlasma,         // 10
  drawRipple,         // 11
  drawWeave,          // 12
  drawMarble,         // 13
  drawTopographic,    // 14
  drawCaustics,       // 15
];

export const BG_COUNT = BG_STYLES.length;

/**
 * Draw a background texture of the given style.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} geometry
 * @param {object} prng
 * @param {number} style - 0–15
 * @param {number} brightness
 * @param {number} contrast
 * @param {number} zoom - detail level 2–16
 * @param {number} blur - fraction of card max dimension
 */
export function drawBackgroundTexture(ctx, geometry, prng, style, brightness, contrast, zoom, blur) {
  if (style < 0 || style >= BG_STYLES.length) return;
  BG_STYLES[style](ctx, geometry, prng, brightness, contrast, zoom, blur);
}
