/**
 * Draws the generative brand symbol onto the card.
 *
 * strokeWeight is computed once here and passed into every sub-function so all
 * eight styles share the same primary line weight — the symbol "feels" the same
 * visual density regardless of which variant is drawn.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number}   x            - centre X of the symbol
 * @param {number}   y            - centre Y of the symbol
 * @param {number}   radius       - bounding radius
 * @param {number}   style        - integer 0–7 selecting the variant
 * @param {function} symbolColor  - (lightnessAdjust, alpha) => CSS colour string
 * @param {object}   rng          - logo PRNG { next, int, float }
 */
export function drawSymbol(ctx, x, y, radius, style, symbolColor, rng) {
  // One stroke weight drives primary strokes across all styles.
  // Secondary/decorative strokes are expressed as fractions of this.
  const strokeWeight = radius * 0.040;

  const variants = [
    drawVenn,
    drawSegmentedRing,
    drawRadialSpokes,
    drawLayeredArcs,
    drawOrbital,
    drawParallelLines,
    drawPolygonNodes,
    drawPolygonFreeNodes,
    drawDotMatrix,
    drawDotMask,
  ];

  (variants[style] ?? variants[0])(ctx, x, y, radius, strokeWeight, symbolColor, rng);
}

// ── Style 0: Venn ────────────────────────────────────────────────────────────
// Two (or three) overlapping circles with a brighter intersection zone and
// a centre anchor dot. Orientation and overlap amount vary by seed.
function drawVenn(ctx, x, y, radius, sw, symbolColor, rng) {
  const overlapAmount  = rng.float(0.22, 0.38);          // fraction of radius between centres
  const tiltAngle      = rng.float(0, Math.PI);          // orientation: horizontal→vertical→diagonal
  const hasThirdCircle = rng.float(0, 1) > 0.55;        // 45% chance of a three-way Venn

  const offset = radius * overlapAmount;
  const ox     = Math.cos(tiltAngle) * offset;
  const oy     = Math.sin(tiltAngle) * offset;

  ctx.lineWidth = sw;

  // Left / primary circle
  ctx.beginPath(); ctx.arc(x - ox, y - oy, radius, 0, Math.PI * 2);
  ctx.fillStyle   = symbolColor(0, 0.12); ctx.fill();
  ctx.strokeStyle = symbolColor(0, 0.88); ctx.stroke();

  // Right / secondary circle
  ctx.beginPath(); ctx.arc(x + ox, y + oy, radius, 0, Math.PI * 2);
  ctx.fillStyle   = symbolColor(-4, 0.12); ctx.fill();
  ctx.strokeStyle = symbolColor(-5, 0.86); ctx.stroke();

  if (hasThirdCircle) {
    // Third circle offset 120° from the second
    const angle3 = tiltAngle + Math.PI * 2 / 3;
    const ox3    = Math.cos(angle3) * offset;
    const oy3    = Math.sin(angle3) * offset;
    ctx.beginPath(); ctx.arc(x + ox3, y + oy3, radius, 0, Math.PI * 2);
    ctx.fillStyle   = symbolColor(-8, 0.10); ctx.fill();
    ctx.strokeStyle = symbolColor(-8, 0.82); ctx.stroke();
  }

  // Intersection highlight — clip left circle, fill right circle inside it
  ctx.save();
  ctx.beginPath(); ctx.arc(x - ox, y - oy, radius, 0, Math.PI * 2); ctx.clip();
  ctx.beginPath(); ctx.arc(x + ox, y + oy, radius, 0, Math.PI * 2);
  ctx.fillStyle = symbolColor(5, 0.25); ctx.fill();
  ctx.restore();

  // Centre anchor dot
  ctx.beginPath(); ctx.arc(x, y, radius * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = symbolColor(8, 1); ctx.fill();
}

// ── Style 1: Segmented Ring ──────────────────────────────────────────────────
// Ring broken into N equal arc segments with alternating opacity.
// Optional inner secondary ring. Hub dot at centre.
// Vary: segment count, ring band thickness, gap size, inner ring presence.
function drawSegmentedRing(ctx, x, y, radius, sw, symbolColor, rng) {
  const segmentCount   = rng.int(4, 9);
  const bandThickness  = radius * rng.float(0.18, 0.27);  // how thick the ring band is
  const gapAngle       = Math.PI * rng.float(0.04, 0.11); // angle of gap between segments
  const startAngle     = rng.next() * Math.PI * 2;
  const hasInnerRing   = rng.float(0, 1) > 0.50;

  ctx.lineCap   = 'butt';
  ctx.lineWidth = bandThickness; // the band is drawn as a thick stroke centred on arc radius

  for (let i = 0; i < segmentCount; i++) {
    const arcStart = startAngle + (Math.PI * 2 / segmentCount) * i       + gapAngle;
    const arcEnd   = startAngle + (Math.PI * 2 / segmentCount) * (i + 1) - gapAngle;
    ctx.beginPath();
    ctx.arc(x, y, radius - bandThickness / 2, arcStart, arcEnd);
    ctx.strokeStyle = symbolColor(0, 0.50 + 0.42 * (i % 2)); // alternate bright/dim
    ctx.stroke();
  }

  if (hasInnerRing) {
    const innerRadius = radius - bandThickness * 1.65;
    if (innerRadius > radius * 0.10) {
      ctx.lineWidth   = sw * 0.55; // secondary stroke, thinner than primary
      ctx.lineCap     = 'butt';
      ctx.beginPath(); ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = symbolColor(0, 0.28);
      ctx.stroke();
    }
  }

  // Hub dot
  ctx.beginPath(); ctx.arc(x, y, (radius - bandThickness) * 0.24, 0, Math.PI * 2);
  ctx.fillStyle = symbolColor(6, 1); ctx.fill();
}

// ── Style 2: Radial Spokes ───────────────────────────────────────────────────
// N lines radiating from an inner radius to an outer radius.
// Primary spokes (even index) are heavier; secondary are lighter.
// A thin outer ring encloses them; a filled hub disc anchors the centre.
// Vary: count, inner/outer radii, whether alternation affects weight or length.
function drawRadialSpokes(ctx, x, y, radius, sw, symbolColor, rng) {
  const spokeCount      = rng.int(5, 14);
  const startAngle      = rng.next() * Math.PI * 2;
  const innerRatio       = rng.float(0.38, 0.58); // pushed outward for more hub clearance
  const outerRatio       = rng.float(0.70, 0.96);
  const primaryWidth     = rng.float(1.0, 2.2);   // primary spokes can be notably thicker
  const alternateLengths = rng.float(0, 1) > 0.50;

  ctx.lineCap = 'round';

  for (let i = 0; i < spokeCount; i++) {
    const angle      = startAngle + (Math.PI * 2 / spokeCount) * i;
    const isPrimary  = i % 2 === 0;
    const outerFinal = alternateLengths && !isPrimary ? outerRatio * 0.62 : outerRatio;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * radius * innerRatio, y + Math.sin(angle) * radius * innerRatio);
    ctx.lineTo(x + Math.cos(angle) * radius * outerFinal, y + Math.sin(angle) * radius * outerFinal);
    ctx.lineWidth   = isPrimary ? sw * primaryWidth : sw * 0.55;
    ctx.strokeStyle = symbolColor(0, isPrimary ? 0.92 : 0.48);
    ctx.stroke();
  }

  // Outer ring
  ctx.lineCap   = 'butt';
  ctx.lineWidth = sw * 0.55;
  ctx.beginPath(); ctx.arc(x, y, radius * 0.95, 0, Math.PI * 2);
  ctx.strokeStyle = symbolColor(0, 0.34);
  ctx.stroke();

  // Hub disc — sized relative to the larger inner gap
  ctx.beginPath(); ctx.arc(x, y, radius * innerRatio * 0.40, 0, Math.PI * 2);
  ctx.fillStyle = symbolColor(6, 1); ctx.fill();
}

// ── Style 3: Layered Arcs ────────────────────────────────────────────────────
// Concentric partial arcs, each at a staggered start angle, fading outward.
// The innermost arc is the thickest and most opaque; outer arcs taper.
// Vary: arc count, span range, stagger amount, per-arc angle jitter.
function drawLayeredArcs(ctx, x, y, radius, sw, symbolColor, rng) {
  const arcCount  = rng.int(3, 6);
  const baseAngle = rng.next() * Math.PI * 2;
  const stagger   = rng.float(0.35, 0.60) * Math.PI; // angular offset between successive arcs
  const spanMin   = rng.float(0.45, 0.75);            // min span (fractions of π)
  const spanMax   = spanMin + rng.float(0.40, 0.80);  // max span

  ctx.lineCap = 'round';

  for (let i = 0; i < arcCount; i++) {
    const arcRadius = radius * (0.32 + i * (0.68 / arcCount));
    const arcSpan   = Math.PI * rng.float(spanMin, spanMax);
    const arcStart  = baseAngle + i * stagger + rng.float(-0.15, 0.15); // small jitter
    ctx.beginPath();
    ctx.arc(x, y, arcRadius, arcStart, arcStart + arcSpan);
    ctx.lineWidth   = Math.max(sw * (1.35 - i * 0.15), sw * 0.55); // taper outward
    ctx.strokeStyle = symbolColor(-i * 4, 0.96 - i * 0.10);
    ctx.stroke();
  }

  // Centre anchor dot
  ctx.beginPath(); ctx.arc(x, y, radius * 0.10, 0, Math.PI * 2);
  ctx.fillStyle = symbolColor(4, 1); ctx.fill();
}

// ── Style 4: Orbital ─────────────────────────────────────────────────────────
// Concentric orbital rings (full circles, very thin) with small satellite dots
// placed around each orbit. A partial outer arc and a central disc.
// Vary: orbit count, dots-per-orbit, outer arc fullness.
function drawOrbital(ctx, x, y, radius, sw, symbolColor, rng) {
  const orbitCount = rng.int(2, 3);
  const orbitRadii = Array.from({ length: orbitCount }, (_, i) =>
    radius * (0.32 + i * (0.65 / orbitCount))
  );

  // Thin orbit rings
  ctx.lineCap   = 'butt';
  ctx.lineWidth = sw * 0.42;
  for (const r of orbitRadii) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = symbolColor(0, 0.28);
    ctx.stroke();
  }

  // Satellite dots on each orbit
  for (let i = 0; i < orbitCount; i++) {
    const orbitRadius = orbitRadii[i];
    const dotCount    = rng.int(2, 4);
    const baseAngle   = rng.next() * Math.PI * 2;
    for (let d = 0; d < dotCount; d++) {
      const angle = baseAngle + (Math.PI * 2 / dotCount) * d;
      ctx.beginPath();
      ctx.arc(
        x + Math.cos(angle) * orbitRadius,
        y + Math.sin(angle) * orbitRadius,
        sw * 1.15, // dot radius proportional to stroke weight
        0, Math.PI * 2
      );
      ctx.fillStyle = symbolColor(-i * 3, 0.90);
      ctx.fill();
    }
  }

  // Outer arc — sometimes full ring, sometimes partial
  const outerR   = radius * 0.96;
  const isFull   = rng.float(0, 1) > 0.40;
  const arcSpan  = isFull ? Math.PI * 2 : Math.PI * rng.float(1.2, 1.8);
  const arcStart = rng.next() * Math.PI * 2;
  ctx.lineCap     = 'round';
  ctx.lineWidth   = sw * 0.40;
  ctx.beginPath(); ctx.arc(x, y, outerR, arcStart, arcStart + arcSpan);
  ctx.strokeStyle = symbolColor(0, 0.22);
  ctx.stroke();

  // Central disc
  ctx.beginPath(); ctx.arc(x, y, radius * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = symbolColor(6, 1); ctx.fill();
}

// ── Style 5: Parallel Lines ──────────────────────────────────────────────────
// Uniform parallel lines at a seeded angle, hard-clipped to a circle.
// Optionally a second set of lines (crosshatch). Outer ring border.
// Vary: line count, angle, crosshatch presence and second angle.
function drawParallelLines(ctx, x, y, radius, sw, symbolColor, rng) {
  const lineCount     = rng.int(7, 15);
  const angle         = rng.float(0, Math.PI);
  const hasCrosshatch = rng.float(0, 1) > 0.45;
  const spacing       = (radius * 2) / lineCount;

  // Direction vectors: perp = perpendicular to line direction (controls spacing)
  const perp = { x:  Math.cos(angle), y:  Math.sin(angle) };
  const dir  = { x: -Math.sin(angle), y:  Math.cos(angle) };

  // Clip to circle
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip();

  ctx.lineCap = 'butt';

  // Primary lines
  ctx.lineWidth   = sw;
  ctx.strokeStyle = symbolColor(0, 0.68);
  for (let i = 0; i < lineCount; i++) {
    const t  = -radius + spacing * (i + 0.5);
    ctx.beginPath();
    ctx.moveTo(x + perp.x * t - dir.x * radius * 1.5, y + perp.y * t - dir.y * radius * 1.5);
    ctx.lineTo(x + perp.x * t + dir.x * radius * 1.5, y + perp.y * t + dir.y * radius * 1.5);
    ctx.stroke();
  }

  // Optional secondary crosshatch lines
  if (hasCrosshatch) {
    const angle2 = angle + rng.float(Math.PI * 0.30, Math.PI * 0.70);
    const perp2  = { x:  Math.cos(angle2), y:  Math.sin(angle2) };
    const dir2   = { x: -Math.sin(angle2), y:  Math.cos(angle2) };
    ctx.lineWidth   = sw * 0.55;
    ctx.strokeStyle = symbolColor(-5, 0.30);
    for (let i = 0; i < lineCount; i++) {
      const t = -radius + spacing * (i + 0.5);
      ctx.beginPath();
      ctx.moveTo(x + perp2.x * t - dir2.x * radius * 1.5, y + perp2.y * t - dir2.y * radius * 1.5);
      ctx.lineTo(x + perp2.x * t + dir2.x * radius * 1.5, y + perp2.y * t + dir2.y * radius * 1.5);
      ctx.stroke();
    }
  }

  ctx.restore(); // remove circular clip

  // Outer ring — drawn outside the clip so it sits cleanly on top
  ctx.lineCap   = 'butt';
  ctx.lineWidth = sw;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = symbolColor(0, 0.58);
  ctx.stroke();
}

// ── Style 6: Polygon Nodes ───────────────────────────────────────────────────
// Vertex dots placed on a regular polygon, connected by adjacency edges and
// optionally by cross-edges. Hub-to-node spokes optional. Hub disc at centre.
// Vary: vertex count, cross-edge density, hub spoke presence, dot size.
function drawPolygonNodes(ctx, x, y, radius, sw, symbolColor, rng) {
  const nodeCount    = rng.int(5, 15);
  const startAngle   = rng.next() * Math.PI * 2;
  const nodeRadius   = radius * 0.82;
  const dotSize      = sw * rng.float(0.95, 1.45);
  const hasHubSpokes = rng.float(0, 1) > 0.40;

  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    x: x + Math.cos(startAngle + (Math.PI * 2 / nodeCount) * i) * nodeRadius,
    y: y + Math.sin(startAngle + (Math.PI * 2 / nodeCount) * i) * nodeRadius,
  }));

  ctx.lineCap = 'round';

  // Hub-to-node spokes (faint)
  if (hasHubSpokes) {
    ctx.lineWidth   = sw * 0.42;
    ctx.strokeStyle = symbolColor(0, 0.20);
    for (const node of nodes) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(node.x, node.y); ctx.stroke();
    }
  }

  // Adjacent edges — polygon perimeter, always drawn
  ctx.lineWidth   = sw * 0.42;
  ctx.strokeStyle = symbolColor(0, 0.60);
  for (let i = 0; i < nodeCount; i++) {
    const a = nodes[i], b = nodes[(i + 1) % nodeCount];
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }

  // Cross edges — all non-adjacent pairs considered, high draw probability
  ctx.lineWidth   = sw * 0.42;
  ctx.strokeStyle = symbolColor(0, 0.22);
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 2; j < nodeCount; j++) {
      if (i === 0 && j === nodeCount - 1) continue; // already a perimeter edge
      if (rng.float(0, 1) > 0.30) {                 // 70% chance — dense inner web
        const a = nodes[i], b = nodes[j];
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }

  // Node dots
  ctx.fillStyle = symbolColor(5, 0.90);
  for (const node of nodes) {
    ctx.beginPath(); ctx.arc(node.x, node.y, dotSize, 0, Math.PI * 2); ctx.fill();
  }

  // Hub disc
  ctx.beginPath(); ctx.arc(x, y, sw * 2.5, 0, Math.PI * 2);
  ctx.fillStyle = symbolColor(8, 1); ctx.fill();
}

// ── Style 7: Polygon Free Nodes ──────────────────────────────────────────────
// Like Polygon Nodes but each vertex is jittered in angle and radius so the
// shape is irregular and asymmetric. Produces organic, tension-graph aesthetics.
function drawPolygonFreeNodes(ctx, x, y, radius, sw, symbolColor, rng) {
  const nodeCount    = rng.int(5, 15);
  const startAngle   = rng.next() * Math.PI * 2;
  const baseRadius   = radius * 0.82;
  const dotSize      = sw * rng.float(0.95, 1.45);
  const hasHubSpokes = rng.float(0, 1) > 0.40;
  const jitterA      = (Math.PI * 2 / nodeCount) * rng.float(0.18, 0.42); // max angular jitter
  const jitterR      = baseRadius * rng.float(0.12, 0.32);                 // max radial jitter

  const nodes = Array.from({ length: nodeCount }, (_, i) => {
    const baseAngle = startAngle + (Math.PI * 2 / nodeCount) * i;
    const a = baseAngle + rng.float(-jitterA, jitterA);
    const r = baseRadius + rng.float(-jitterR, jitterR);
    return { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r };
  });

  ctx.lineCap = 'round';

  if (hasHubSpokes) {
    ctx.lineWidth   = sw * 0.42;
    ctx.strokeStyle = symbolColor(0, 0.20);
    for (const node of nodes) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(node.x, node.y); ctx.stroke();
    }
  }

  // Perimeter
  ctx.lineWidth   = sw * 0.42;
  ctx.strokeStyle = symbolColor(0, 0.60);
  for (let i = 0; i < nodeCount; i++) {
    const a = nodes[i], b = nodes[(i + 1) % nodeCount];
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }

  // Inner web — sparse connections to let the irregular shape breathe
  ctx.lineWidth   = sw * 0.42;
  ctx.strokeStyle = symbolColor(0, 0.22);
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 2; j < nodeCount; j++) {
      if (i === 0 && j === nodeCount - 1) continue;
      if (rng.float(0, 1) > 0.65) {
        const a = nodes[i], b = nodes[j];
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }

  // Node dots
  ctx.fillStyle = symbolColor(5, 0.90);
  for (const node of nodes) {
    ctx.beginPath(); ctx.arc(node.x, node.y, dotSize, 0, Math.PI * 2); ctx.fill();
  }

  // Hub disc
  ctx.beginPath(); ctx.arc(x, y, sw * 2.5, 0, Math.PI * 2);
  ctx.fillStyle = symbolColor(8, 1); ctx.fill();
}

// ── Style 8: Dot Matrix ───────────────────────────────────────────────────────
// A rectangular grid of dots where each dot is independently shown or hidden
// by the PRNG. Grid dimensions and density are both seed-derived, producing
// everything from sparse scatter to dense LED-panel looks.
// Invisible positions render as ghost dots to expose the underlying grid.
function drawDotMatrix(ctx, x, y, radius, sw, symbolColor, rng) {
  const cols    = rng.int(5, 13);
  const rows    = rng.int(5, 13);
  const cellW   = (radius * 2) / cols;
  const cellH   = (radius * 2) / rows;
  const dotR    = Math.min(cellW, cellH) * rng.float(0.20, 0.40);
  const density = rng.float(0.38, 0.68);
  const x0      = x - radius + cellW * 0.5;
  const y0      = y - radius + cellH * 0.5;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const lit = rng.next() < density;
      const dx  = x0 + col * cellW;
      const dy  = y0 + row * cellH;
      if (lit) {
        ctx.beginPath();
        ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = symbolColor(0, 0.88);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(dx, dy, dotR * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = symbolColor(0, 0.10);
        ctx.fill();
      }
    }
  }
}

// ── Style 9: Dot Mask ─────────────────────────────────────────────────────────
// Dots on a regular grid lit only when they fall inside a seed-derived blob.
// The blob is a polar curve built from sinusoidal harmonics — organic but
// deterministic. Grid density (zoom) is seed-derived: coarse grids give chunky
// pixel approximations; fine grids resolve the shape more smoothly.
function drawDotMask(ctx, x, y, radius, sw, symbolColor, rng) {
  const harmonicCount = rng.int(2, 5);
  const harmonics = [];
  for (let h = 0; h < harmonicCount; h++) {
    harmonics.push({
      freq:  rng.int(2, 5),
      amp:   rng.float(0.06, 0.20),
      phase: rng.float(0, Math.PI * 2),
    });
  }
  const blobBase = radius * rng.float(0.65, 0.88);
  function blobR(theta) {
    return harmonics.reduce(
      (r, h) => r + blobBase * h.amp * Math.sin(h.freq * theta + h.phase),
      blobBase
    );
  }

  const gridN = rng.int(6, 16);
  const cell  = (radius * 2) / gridN;
  const dotR  = cell * rng.float(0.22, 0.42);
  const x0    = x - radius + cell * 0.5;
  const y0    = y - radius + cell * 0.5;

  for (let row = 0; row < gridN; row++) {
    for (let col = 0; col < gridN; col++) {
      const dx    = x0 + col * cell;
      const dy    = y0 + row * cell;
      const dist  = Math.hypot(dx - x, dy - y);
      const theta = Math.atan2(dy - y, dx - x);
      if (dist <= blobR(theta)) {
        ctx.beginPath();
        ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = symbolColor(0, 0.88);
        ctx.fill();
      } else if (dist <= radius) {
        ctx.beginPath();
        ctx.arc(dx, dy, dotR * 0.38, 0, Math.PI * 2);
        ctx.fillStyle = symbolColor(0, 0.08);
        ctx.fill();
      }
    }
  }
}

