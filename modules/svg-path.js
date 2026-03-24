/**
 * SVG path data → Canvas 2D API replayer.
 *
 * Parses an SVG `d` attribute string and replays it through standard
 * Canvas 2D path methods (moveTo, lineTo, bezierCurveTo, quadraticCurveTo,
 * closePath).  Works identically with both CanvasRenderingContext2D and
 * SvgContext since both implement the same path API.
 *
 * Supports: M m L l H h V v C c S s Q q T t A a Z z
 */

// ── Tokeniser ────────────────────────────────────────────────────────────────

const CMD_RE = /([MmLlHhVvCcSsQqTtAaZz])|([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/g;

function tokenise(d) {
  const tokens = [];
  let m;
  while ((m = CMD_RE.exec(d)) !== null) {
    tokens.push(m[1] ? { cmd: m[1] } : { num: +m[2] });
  }
  return tokens;
}

// ── SVG arc → cubic Bézier approximation ─────────────────────────────────────

function arcToCubics(cx, cy, rx, ry, phi, theta1, dTheta) {
  // Split arc into segments of ≤ 90°, approximate each with a cubic Bézier.
  const segs = [];
  const n = Math.max(1, Math.ceil(Math.abs(dTheta) / (Math.PI / 2)));
  const dt = dTheta / n;
  const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);

  for (let i = 0; i < n; i++) {
    const t1 = theta1 + i * dt;
    const t2 = t1 + dt;
    const alpha = Math.sin(dt) * (Math.sqrt(4 + 3 * Math.pow(Math.tan(dt / 2), 2)) - 1) / 3;

    const cos1 = Math.cos(t1), sin1 = Math.sin(t1);
    const cos2 = Math.cos(t2), sin2 = Math.sin(t2);

    const x1 = rx * cos1, y1 = ry * sin1;
    const x2 = rx * cos2, y2 = ry * sin2;
    const dx1 = -rx * sin1, dy1 = ry * cos1;
    const dx2 = -rx * sin2, dy2 = ry * cos2;

    // Rotate to final coordinate space
    const p1x = cx + cosPhi * x1 - sinPhi * y1;
    const p1y = cy + sinPhi * x1 + cosPhi * y1;
    const p2x = cx + cosPhi * x2 - sinPhi * y2;
    const p2y = cy + sinPhi * x2 + cosPhi * y2;

    const cp1x = p1x + alpha * (cosPhi * dx1 - sinPhi * dy1);
    const cp1y = p1y + alpha * (sinPhi * dx1 + cosPhi * dy1);
    const cp2x = p2x - alpha * (cosPhi * dx2 - sinPhi * dy2);
    const cp2y = p2y - alpha * (sinPhi * dx2 + cosPhi * dy2);

    segs.push({ cp1x, cp1y, cp2x, cp2y, x: p2x, y: p2y });
  }
  return segs;
}

function svgArcToCenter(x1, y1, rx, ry, phi, fA, fS, x2, y2) {
  // SVG spec §F.6.5 – endpoint → centre parameterisation
  const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p =  cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  let rxSq = rx * rx, rySq = ry * ry;
  const x1pSq = x1p * x1p, y1pSq = y1p * y1p;

  // Ensure radii are large enough
  let lambda = x1pSq / rxSq + y1pSq / rySq;
  if (lambda > 1) { const s = Math.sqrt(lambda); rx *= s; ry *= s; rxSq = rx * rx; rySq = ry * ry; }

  let num = Math.max(0, rxSq * rySq - rxSq * y1pSq - rySq * x1pSq);
  let den = rxSq * y1pSq + rySq * x1pSq;
  let sq = den === 0 ? 0 : Math.sqrt(num / den);
  if (fA === fS) sq = -sq;

  const cxp =  sq * rx * y1p / ry;
  const cyp = -sq * ry * x1p / rx;

  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const theta1 = Math.atan2((y1p - cyp) / ry, (x1p - cxp) / rx);
  let dTheta = Math.atan2((-y1p - cyp) / ry, (-x1p - cxp) / rx) - theta1;

  if (fS === 0 && dTheta > 0)  dTheta -= 2 * Math.PI;
  if (fS === 1 && dTheta < 0)  dTheta += 2 * Math.PI;

  return { cx, cy, rx, ry, theta1, dTheta };
}

// ── Main replayer ────────────────────────────────────────────────────────────

/**
 * Replay an SVG path `d` string through Canvas 2D path calls on `ctx`.
 * Assumes `ctx.beginPath()` has already been called.
 */
export function replayPath(ctx, d) {
  if (!d) return;
  const tokens = tokenise(d);
  let i = 0;
  let x = 0, y = 0;       // current point
  let sx = 0, sy = 0;      // subpath start
  let cpx = 0, cpy = 0;    // last control point (for S/T)
  let lastCmd = '';

  function next() { return tokens[i++].num; }
  function hasNums() { return i < tokens.length && tokens[i].num !== undefined; }

  while (i < tokens.length) {
    const tok = tokens[i];
    let cmd;
    if (tok.cmd) { cmd = tok.cmd; i++; }
    else {
      // Implicit repeat of previous command
      cmd = lastCmd;
      if (cmd === 'M') cmd = 'L';
      if (cmd === 'm') cmd = 'l';
    }
    lastCmd = cmd;

    switch (cmd) {
      case 'M':
        x = next(); y = next(); ctx.moveTo(x, y); sx = x; sy = y;
        while (hasNums()) { x = next(); y = next(); ctx.lineTo(x, y); }
        break;
      case 'm':
        x += next(); y += next(); ctx.moveTo(x, y); sx = x; sy = y;
        while (hasNums()) { x += next(); y += next(); ctx.lineTo(x, y); }
        break;
      case 'L':
        while (hasNums()) { x = next(); y = next(); ctx.lineTo(x, y); } break;
      case 'l':
        while (hasNums()) { x += next(); y += next(); ctx.lineTo(x, y); } break;
      case 'H':
        while (hasNums()) { x = next(); ctx.lineTo(x, y); } break;
      case 'h':
        while (hasNums()) { x += next(); ctx.lineTo(x, y); } break;
      case 'V':
        while (hasNums()) { y = next(); ctx.lineTo(x, y); } break;
      case 'v':
        while (hasNums()) { y += next(); ctx.lineTo(x, y); } break;
      case 'C':
        while (hasNums()) {
          const x1 = next(), y1 = next(), x2 = next(), y2 = next();
          x = next(); y = next();
          ctx.bezierCurveTo(x1, y1, x2, y2, x, y);
          cpx = x2; cpy = y2;
        } break;
      case 'c':
        while (hasNums()) {
          const x1 = x + next(), y1 = y + next(), x2 = x + next(), y2 = y + next();
          x += next(); y += next();
          ctx.bezierCurveTo(x1, y1, x2, y2, x, y);
          cpx = x2; cpy = y2;
        } break;
      case 'S':
        while (hasNums()) {
          const rx1 = 2 * x - cpx, ry1 = 2 * y - cpy;
          const x2 = next(), y2 = next(); x = next(); y = next();
          ctx.bezierCurveTo(rx1, ry1, x2, y2, x, y);
          cpx = x2; cpy = y2;
        } break;
      case 's':
        while (hasNums()) {
          const rx1 = 2 * x - cpx, ry1 = 2 * y - cpy;
          const x2 = x + next(), y2 = y + next();
          x += next(); y += next();
          ctx.bezierCurveTo(rx1, ry1, x2, y2, x, y);
          cpx = x2; cpy = y2;
        } break;
      case 'Q':
        while (hasNums()) {
          cpx = next(); cpy = next(); x = next(); y = next();
          ctx.quadraticCurveTo(cpx, cpy, x, y);
        } break;
      case 'q':
        while (hasNums()) {
          cpx = x + next(); cpy = y + next();
          x += next(); y += next();
          ctx.quadraticCurveTo(cpx, cpy, x, y);
        } break;
      case 'T':
        while (hasNums()) {
          cpx = 2 * x - cpx; cpy = 2 * y - cpy;
          x = next(); y = next();
          ctx.quadraticCurveTo(cpx, cpy, x, y);
        } break;
      case 't':
        while (hasNums()) {
          cpx = 2 * x - cpx; cpy = 2 * y - cpy;
          x += next(); y += next();
          ctx.quadraticCurveTo(cpx, cpy, x, y);
        } break;
      case 'A': case 'a': {
        const rel = cmd === 'a';
        while (hasNums()) {
          let arx = next(), ary = next();
          const xRot = next() * Math.PI / 180;
          const fA = next(), fS = next();
          const ex = rel ? x + next() : next();
          const ey = rel ? y + next() : next();
          if (arx === 0 || ary === 0) { ctx.lineTo(ex, ey); x = ex; y = ey; break; }
          arx = Math.abs(arx); ary = Math.abs(ary);
          const { cx: acx, cy: acy, rx: nrx, ry: nry, theta1, dTheta } =
            svgArcToCenter(x, y, arx, ary, xRot, fA, fS, ex, ey);
          const cubics = arcToCubics(acx, acy, nrx, nry, xRot, theta1, dTheta);
          for (const seg of cubics) {
            ctx.bezierCurveTo(seg.cp1x, seg.cp1y, seg.cp2x, seg.cp2y, seg.x, seg.y);
          }
          x = ex; y = ey;
        }
        break;
      }
      case 'Z': case 'z':
        ctx.closePath(); x = sx; y = sy; break;
    }

    // Reset reflected control point for non-curve commands
    if (!'CcSsQqTt'.includes(cmd)) { cpx = x; cpy = y; }
  }
}
