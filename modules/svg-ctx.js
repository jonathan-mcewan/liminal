/**
 * SvgContext — Canvas 2D API shim that emits SVG markup instead of raster pixels.
 *
 * Drop-in replacement for CanvasRenderingContext2D for the Access Card Generator
 * drawing pipeline. Pass an instance anywhere a canvas ctx is expected, then
 * call toSVG() to retrieve the serialised SVG string.
 *
 * POC limitations — the following Canvas features are intentional no-ops:
 *   filter (on paths)      — only honoured inside drawImage (blur)
 *   shadow*                — card drop-shadow will be absent
 *   globalCompositeOperation — lanyard hole punch-through will be absent
 */

// ── Gradient helpers ──────────────────────────────────────────────────────────

class SvgLinearGradient {
  constructor(x0, y0, x1, y1) {
    this._x0 = x0; this._y0 = y0;
    this._x1 = x1; this._y1 = y1;
    this._stops = [];
  }
  addColorStop(offset, color) {
    this._stops.push({ offset, color });
  }
  _toSVG(id) {
    const stops = this._stops.map(({ offset, color }) => {
      const { c, o } = splitColor(color);
      return `<stop offset="${offset}" stop-color="${c}" stop-opacity="${o}"/>`;
    }).join('');
    return `<linearGradient id="${id}" x1="${f(this._x0)}" y1="${f(this._y0)}" x2="${f(this._x1)}" y2="${f(this._y1)}" gradientUnits="userSpaceOnUse">${stops}</linearGradient>`;
  }
}

class SvgRadialGradient {
  constructor(x0, y0, r0, x1, y1, r1) {
    this._x0 = x0; this._y0 = y0; this._r0 = r0;
    this._x1 = x1; this._y1 = y1; this._r1 = r1;
    this._stops = [];
  }
  addColorStop(offset, color) {
    this._stops.push({ offset, color });
  }
  _toSVG(id) {
    const stops = this._stops.map(({ offset, color }) => {
      const { c, o } = splitColor(color);
      return `<stop offset="${offset}" stop-color="${c}" stop-opacity="${o}"/>`;
    }).join('');
    // fx/fy = focal point (inner circle centre), cx/cy/r = outer circle
    return `<radialGradient id="${id}" cx="${f(this._x1)}" cy="${f(this._y1)}" r="${f(this._r1)}" fx="${f(this._x0)}" fy="${f(this._y0)}" gradientUnits="userSpaceOnUse">${stops}</radialGradient>`;
  }
}

// ── Main SvgContext class ─────────────────────────────────────────────────────

export class SvgContext {
  constructor(width, height) {
    this.width  = width;
    this.height = height;

    // Canvas-compatible public state
    this.fillStyle   = '#000';
    this.strokeStyle = '#000';
    this.lineWidth   = 1;
    this.lineCap     = 'butt';
    this.lineJoin    = 'miter';
    this.font        = '10px sans-serif';
    this.textBaseline = 'alphabetic';
    this.textAlign   = 'left';

    // 2D affine transform: [a, b, c, d, e, f] — column-major
    // | a c e |
    // | b d f |
    // | 0 0 1 |
    this._transform  = [1, 0, 0, 1, 0, 0];

    // No-op properties — kept so drawing code can set them without errors
    this.globalCompositeOperation = 'source-over';
    this.globalAlpha   = 1;
    this.filter        = 'none';
    this.shadowColor   = 'transparent';
    this.shadowBlur    = 0;
    this.shadowOffsetX = 0;
    this.shadowOffsetY = 0;

    this._defs       = [];       // SVG <defs> entries (gradients, clipPaths)
    this._body       = [];       // SVG element strings
    this._stateStack = [];       // save/restore state snapshots
    this._clipStack  = [];       // clip-group open count per save level

    this._path  = [];            // current path command tokens
    this._pt    = null;          // current point { x, y } in transformed space
    this._ptU   = null;          // current point in user (untransformed) space

    this._idSeq   = 0;
    this._gradIds = new Map();   // gradient object → defs id
  }

  // ── ID factory ───────────────────────────────────────────────────────────────

  _uid() { return `sc${++this._idSeq}`; }

  // ── State stack ──────────────────────────────────────────────────────────────

  save() {
    this._stateStack.push({
      fillStyle:   this.fillStyle,
      strokeStyle: this.strokeStyle,
      lineWidth:   this.lineWidth,
      lineCap:     this.lineCap,
      lineJoin:    this.lineJoin,
      font:        this.font,
      textBaseline: this.textBaseline,
      textAlign:   this.textAlign,
      globalCompositeOperation: this.globalCompositeOperation,
      transform:   this._transform.slice(),
    });
    this._clipStack.push(0);
  }

  restore() {
    if (this._stateStack.length === 0) return;
    const clips = this._clipStack.pop() || 0;
    for (let i = 0; i < clips; i++) this._body.push('</g>');
    const s = this._stateStack.pop();
    this.fillStyle   = s.fillStyle;
    this.strokeStyle = s.strokeStyle;
    this.lineWidth   = s.lineWidth;
    this.lineCap     = s.lineCap;
    this.lineJoin    = s.lineJoin;
    this.font        = s.font;
    this.textBaseline = s.textBaseline;
    this.textAlign   = s.textAlign;
    this.globalCompositeOperation = s.globalCompositeOperation;
    this._transform  = s.transform;
  }

  // ── Transforms ──────────────────────────────────────────────────────────────

  /** Multiply current transform by [a2,b2,c2,d2,e2,f2]. */
  _multiplyTransform(a2, b2, c2, d2, e2, f2) {
    const [a1, b1, c1, d1, e1, f1] = this._transform;
    this._transform = [
      a1*a2 + c1*b2,       b1*a2 + d1*b2,
      a1*c2 + c1*d2,       b1*c2 + d1*d2,
      a1*e2 + c1*f2 + e1,  b1*e2 + d1*f2 + f1,
    ];
  }

  translate(tx, ty) {
    this._multiplyTransform(1, 0, 0, 1, tx, ty);
  }

  rotate(angle) {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    this._multiplyTransform(cos, sin, -sin, cos, 0, 0);
  }

  scale(sx, sy) {
    this._multiplyTransform(sx, 0, 0, sy ?? sx, 0, 0);
  }

  /** Apply current transform to a point, returning [x', y']. */
  _tx(x, y) {
    const [a, b, c, d, e, ff] = this._transform;
    return [a*x + c*y + e, b*x + d*y + ff];
  }

  /** True when the transform is identity (no work needed). */
  _isIdentity() {
    const [a, b, c, d, e, ff] = this._transform;
    return a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && ff === 0;
  }

  // ── Path construction ────────────────────────────────────────────────────────

  beginPath() {
    this._path = [];
    this._pt   = null;
    this._ptU  = null;
  }

  closePath() {
    this._path.push('Z');
    // currentPoint technically returns to path start — we don't track that
    // but it's safe for our usage patterns
  }

  moveTo(x, y) {
    const [tx, ty] = this._tx(x, y);
    this._path.push(`M ${f(tx)} ${f(ty)}`);
    this._pt  = { x: tx, y: ty };
    this._ptU = { x, y };
  }

  lineTo(x, y) {
    const [tx, ty] = this._tx(x, y);
    if (!this._pt) this._path.push(`M ${f(tx)} ${f(ty)}`);
    else           this._path.push(`L ${f(tx)} ${f(ty)}`);
    this._pt  = { x: tx, y: ty };
    this._ptU = { x, y };
  }

  arc(cx, cy, r, startAngle, endAngle, ccw = false) {
    const TAU = Math.PI * 2;
    // Transform the center and compute effective radius from transform scale
    const [tcx, tcy] = this._tx(cx, cy);
    const [a, b, c, d] = this._transform;
    const scaleX = Math.hypot(a, b);
    const scaleY = Math.hypot(c, d);
    const tr = r * (scaleX + scaleY) / 2; // average scale for radius
    // Compute rotation offset from the transform
    const tAngle = Math.atan2(b, a);

    const sa = startAngle + tAngle;
    const ea = endAngle + tAngle;

    const sx  = tcx + tr * Math.cos(sa);
    const sy  = tcy + tr * Math.sin(sa);

    // Connect current point to arc start (Canvas behaviour: line if not at start)
    if (!this._pt) {
      this._path.push(`M ${f(sx)} ${f(sy)}`);
    } else if (Math.abs(this._pt.x - sx) > 0.001 || Math.abs(this._pt.y - sy) > 0.001) {
      this._path.push(`L ${f(sx)} ${f(sy)}`);
    }

    // Normalise arc span
    let span = ccw
      ? ((startAngle - endAngle) % TAU + TAU) % TAU
      : ((endAngle - startAngle) % TAU + TAU) % TAU;
    if (span < 0.001) span = TAU; // near-zero treated as full circle

    if (span >= TAU - 0.001) {
      // Full circle — SVG can't do it in one arc command, use two semicircles
      const mx = tcx + tr * Math.cos(sa + Math.PI);
      const my = tcy + tr * Math.sin(sa + Math.PI);
      const sw = ccw ? 0 : 1;
      this._path.push(
        `A ${f(tr)} ${f(tr)} 0 1 ${sw} ${f(mx)} ${f(my)}`,
        `A ${f(tr)} ${f(tr)} 0 1 ${sw} ${f(sx)} ${f(sy)}`,
      );
      this._pt  = { x: sx, y: sy };
      this._ptU = { x: cx + r * Math.cos(startAngle), y: cy + r * Math.sin(startAngle) };
      return;
    }

    const ex       = tcx + tr * Math.cos(ea);
    const ey       = tcy + tr * Math.sin(ea);
    const largeArc = span > Math.PI ? 1 : 0;
    const sweep    = ccw ? 0 : 1;
    this._path.push(`A ${f(tr)} ${f(tr)} 0 ${largeArc} ${sweep} ${f(ex)} ${f(ey)}`);
    this._pt  = { x: ex, y: ey };
    this._ptU = { x: cx + r * Math.cos(endAngle), y: cy + r * Math.sin(endAngle) };
  }

  /**
   * arcTo implementation following the Canvas spec:
   * draws the arc of radius r tangent to the lines (P0→P1) and (P1→P2),
   * preceded by a straight line from P0 to the first tangent point.
   */
  arcTo(x1, y1, x2, y2, radius) {
    if (!this._ptU) { this.moveTo(x1, y1); return; }
    const { x: x0, y: y0 } = this._ptU;

    if ((x0 === x1 && y0 === y1) || (x1 === x2 && y1 === y2) || radius === 0) {
      this.lineTo(x1, y1);
      return;
    }

    // Unit vectors from the corner P1 toward P0 and toward P2
    const d1x = x0 - x1, d1y = y0 - y1;
    const d2x = x2 - x1, d2y = y2 - y1;
    const len1 = Math.hypot(d1x, d1y);
    const len2 = Math.hypot(d2x, d2y);
    if (len1 < 1e-10 || len2 < 1e-10) { this.lineTo(x1, y1); return; }

    const u1x = d1x / len1, u1y = d1y / len1;
    const u2x = d2x / len2, u2y = d2y / len2;

    const dot   = u1x * u2x + u1y * u2y;
    const cross = u1x * u2y - u1y * u2x;  // sign determines turn direction
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (Math.abs(Math.sin(angle / 2)) < 1e-10) { this.lineTo(x1, y1); return; }

    // Distance from corner to each tangent point
    const dist = radius / Math.tan(angle / 2);

    // Tangent points along each edge
    const t1x = x1 + u1x * dist, t1y = y1 + u1y * dist;
    const t2x = x1 + u2x * dist, t2y = y1 + u2y * dist;

    // Arc centre: perpendicular to the P1→P0 edge, distance=radius, toward inside
    const sf  = cross > 0 ? 1 : -1;
    const acx = t1x - sf * u1y * radius;
    const acy = t1y + sf * u1x * radius;

    const startAngle = Math.atan2(t1y - acy, t1x - acx);
    const endAngle   = Math.atan2(t2y - acy, t2x - acx);
    const ccw        = cross > 0;

    this.lineTo(t1x, t1y);
    this.arc(acx, acy, radius, startAngle, endAngle, ccw);
  }

  rect(x, y, w, h) {
    const [x0, y0] = this._tx(x, y);
    const [x1, y1] = this._tx(x + w, y);
    const [x2, y2] = this._tx(x + w, y + h);
    const [x3, y3] = this._tx(x, y + h);
    this._path.push(`M ${f(x0)} ${f(y0)} L ${f(x1)} ${f(y1)} L ${f(x2)} ${f(y2)} L ${f(x3)} ${f(y3)} Z`);
    this._pt  = { x: x0, y: y0 };
    this._ptU = { x, y };
  }

  // ── Rendering commands ───────────────────────────────────────────────────────

  /** Resolves a fillStyle/strokeStyle value to an SVG paint string or url(#id). */
  _paint(style) {
    if (typeof style === 'string') return style;
    // Gradient — register in defs on first use
    if (!this._gradIds.has(style)) {
      const id = this._uid();
      this._defs.push(style._toSVG(id));
      this._gradIds.set(style, id);
    }
    return `url(#${this._gradIds.get(style)})`;
  }

  fill() {
    const d = this._path.join(' ');
    if (!d) return;
    this._body.push(`<path d="${d}" fill="${this._paint(this.fillStyle)}" stroke="none"/>`);
  }

  stroke() {
    const d = this._path.join(' ');
    if (!d) return;
    this._body.push(
      `<path d="${d}" fill="none"` +
      ` stroke="${this._paint(this.strokeStyle)}"` +
      ` stroke-width="${f(this.lineWidth)}"` +
      ` stroke-linecap="${this.lineCap}"` +
      ` stroke-linejoin="${this.lineJoin}"/>`,
    );
  }

  fillRect(x, y, w, h) {
    if (this._isIdentity()) {
      this._body.push(
        `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"` +
        ` fill="${this._paint(this.fillStyle)}" stroke="none"/>`,
      );
    } else {
      const [x0, y0] = this._tx(x, y);
      const [x1, y1] = this._tx(x + w, y);
      const [x2, y2] = this._tx(x + w, y + h);
      const [x3, y3] = this._tx(x, y + h);
      const d = `M ${f(x0)} ${f(y0)} L ${f(x1)} ${f(y1)} L ${f(x2)} ${f(y2)} L ${f(x3)} ${f(y3)} Z`;
      this._body.push(`<path d="${d}" fill="${this._paint(this.fillStyle)}" stroke="none"/>`);
    }
  }

  fillText(text, x, y) {
    const { size, weight, family } = parseFont(this.font);
    const baseline = this.textBaseline === 'top' ? 'hanging'
                   : this.textBaseline === 'middle' ? 'central' : 'auto';
    const anchor   = this.textAlign === 'center' ? 'middle'
                   : this.textAlign === 'right'  ? 'end' : 'start';
    const [tx, ty] = this._tx(x, y);
    const [a, b] = this._transform;
    const tScale = Math.hypot(a, b);
    this._body.push(
      `<text x="${f(tx)}" y="${f(ty)}"` +
      ` font-size="${f(size * tScale)}" font-weight="${weight}" font-family="${family}"` +
      ` dominant-baseline="${baseline}" text-anchor="${anchor}"` +
      ` fill="${this._paint(this.fillStyle)}">${escXml(text)}</text>`,
    );
  }

  clip() {
    const d  = this._path.join(' ');
    const id = this._uid();
    this._defs.push(`<clipPath id="${id}"><path d="${d}" fill-rule="nonzero"/></clipPath>`);
    this._body.push(`<g clip-path="url(#${id})">`);
    if (this._clipStack.length > 0) this._clipStack[this._clipStack.length - 1]++;
  }

  // ── Gradient factories ───────────────────────────────────────────────────────

  createLinearGradient(x0, y0, x1, y1) {
    return new SvgLinearGradient(x0, y0, x1, y1);
  }

  createRadialGradient(x0, y0, r0, x1, y1, r1) {
    return new SvgRadialGradient(x0, y0, r0, x1, y1, r1);
  }

  // ── Image compositing ────────────────────────────────────────────────────────

  /**
   * Embeds an HTMLCanvasElement as a base64 <image> in the SVG.
   * Honours ctx.filter = 'blur(Npx)' by generating an SVG feGaussianBlur filter.
   * Only the (image, dx, dy) overload is needed by the drawing pipeline.
   */
  drawImage(image, dx, dy) {
    if (!(image instanceof HTMLCanvasElement)) return;
    const dataUrl = image.toDataURL('image/png');
    const w = image.width;
    const h = image.height;

    let filterAttr = '';
    const blurMatch = this.filter && this.filter.match(/blur\(([\d.]+)px\)/);
    if (blurMatch) {
      const std = parseFloat(blurMatch[1]);
      const fid = this._uid();
      // Expand filter region so blur doesn't get clipped at the image edges
      this._defs.push(
        `<filter id="${fid}" x="-15%" y="-15%" width="130%" height="130%">` +
        `<feGaussianBlur stdDeviation="${std}"/>` +
        `</filter>`,
      );
      filterAttr = ` filter="url(#${fid})"`;
    }

    this._body.push(
      `<image href="${dataUrl}" x="${f(dx)}" y="${f(dy)}" width="${f(w)}" height="${f(h)}"${filterAttr}/>`,
    );
  }

  // ── Crop / viewBox ───────────────────────────────────────────────────────────

  /**
   * Restrict the SVG viewBox to a sub-rectangle of the canvas.
   * Call this after geometry is known (e.g. from generateCard) to produce a
   * tightly-cropped output that contains only the card, no surrounding padding.
   */
  cropTo(x, y, w, h) {
    this._vx = x; this._vy = y;
    this._vw = w; this._vh = h;
  }

  // ── Serialisation ────────────────────────────────────────────────────────────

  toSVG() {
    // Close any unclosed clip groups (shouldn't happen in well-formed code but be safe)
    const orphans = this._clipStack.reduce((a, b) => a + b, 0);
    const tail    = '</g>'.repeat(orphans);

    const defs = this._defs.length
      ? `<defs>${this._defs.join('')}</defs>`
      : '';

    const vx = this._vx ?? 0;
    const vy = this._vy ?? 0;
    const vw = this._vw ?? this.width;
    const vh = this._vh ?? this.height;

    return (
      `<svg xmlns="http://www.w3.org/2000/svg"` +
      ` width="${f(vw)}" height="${f(vh)}"` +
      ` viewBox="${f(vx)} ${f(vy)} ${f(vw)} ${f(vh)}">` +
      defs +
      this._body.join('') +
      tail +
      `</svg>`
    );
  }
}

// ── Module-level utilities ────────────────────────────────────────────────────

/** Round to 2 dp to keep SVG output compact. */
function f(v) {
  return Math.round(v * 100) / 100;
}

/**
 * Parse a CSS color string into { c: colorWithoutAlpha, o: opacityNumber }.
 * Used for SVG stop-color + stop-opacity attributes.
 */
function splitColor(css) {
  const rgba = css.match(/^rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (rgba) {
    const [, r, g, b, a = '1'] = rgba;
    return { c: `rgb(${r},${g},${b})`, o: parseFloat(a) };
  }
  const hsla = css.match(/^hsla?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (hsla) {
    const [, h, s, l, a = '1'] = hsla;
    return { c: `hsl(${h},${s}%,${l}%)`, o: parseFloat(a) };
  }
  return { c: css, o: 1 };
}

/** Parse a Canvas font string into { size, weight, family }. */
function parseFont(font) {
  const m = font.match(/^(\d+)\s+([\d.]+)px\s+(.+)$/);
  if (m) return { weight: m[1], size: parseFloat(m[2]), family: m[3] };
  const m2 = font.match(/([\d.]+)px\s+(.+)$/);
  if (m2) return { weight: '400', size: parseFloat(m2[1]), family: m2[2] };
  return { weight: '400', size: 12, family: 'sans-serif' };
}

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
