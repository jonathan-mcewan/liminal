/** Builds an hsla() colour string from numeric components. */
export const hsla = (h, s, l, a = 1) =>
  `hsla(${h | 0},${s | 0}%,${l | 0}%,${a})`;

/**
 * Traces a rounded-rectangle path on ctx.
 * Does not fill or stroke — the caller decides that after calling this.
 */
export function roundedRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y,          x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x,         y + height, radius);
  ctx.arcTo(x,         y + height, x,         y,          radius);
  ctx.arcTo(x,         y,          x + width, y,          radius);
  ctx.closePath();
}
