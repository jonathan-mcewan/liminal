/**
 * Renders the person's name and job title on the card.
 *
 * Two layouts:
 *   Portrait / square — bottom-anchored: text block sits above the card's lower
 *     edge, with the two lines stacked and a gap proportional to the name font size.
 *   Landscape — right-aligned: text block is vertically centred in the right
 *     portion of the card, beside the logo.
 *
 * textBaseline is set to 'top' so that Y coordinates refer to the top of each
 * glyph — the positions are therefore exact regardless of font metrics.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object}   geometry    - card geometry object from card.js
 * @param {string}   personName  - full name to render
 * @param {string}   jobTitle    - job title to render beneath the name
 * @param {function} symbolColor - (lightnessAdjust, alpha) => CSS colour string
 */
export function drawCardText(ctx, geometry, personName, jobTitle, symbolColor) {
  const { cardLeft, cardTop, cardWidth, cardHeight, shortSide, landscape } = geometry;

  const basis         = shortSide || cardWidth; // short side keeps text proportional across aspect ratios
  const nameFontSize  = basis * 0.072;
  const titleFontSize = basis * 0.048;
  const lineGap       = nameFontSize * 0.40; // space between bottom of name and top of title

  const hasName  = personName.length > 0;
  const hasTitle = jobTitle.length   > 0;
  const hasBoth  = hasName && hasTitle;

  // Total height of the text block (used for vertical centering in landscape)
  const blockH = (hasName  ? nameFontSize  : 0)
               + (hasBoth  ? lineGap       : 0)
               + (hasTitle ? titleFontSize : 0);

  let textX, nameTop, titleTop, align;

  if (landscape) {
    // ── Landscape: text on the right, right-aligned, vertically centred ─
    textX = cardLeft + cardWidth * 0.91;   // right margin matching portrait's 9%
    align = 'right';
    const blockTop = cardTop + (cardHeight - blockH) / 2;
    nameTop  = blockTop;
    titleTop = hasName ? nameTop + nameFontSize + lineGap : blockTop;
  } else {
    // ── Portrait / square: bottom-anchored, left-aligned ────────────────
    textX = cardLeft + cardWidth * 0.09;
    align = 'left';
    const blockBottom = cardTop + cardHeight * 0.92;
    titleTop = blockBottom - titleFontSize;
    nameTop  = hasBoth
      ? titleTop - lineGap - nameFontSize
      : blockBottom - nameFontSize;
  }

  ctx.save();
  ctx.textBaseline = 'top';
  ctx.textAlign    = align;

  if (hasName) {
    ctx.font      = `500 ${nameFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillStyle = symbolColor(0, 0.92);
    ctx.fillText(personName, textX, nameTop);
  }

  if (hasTitle) {
    ctx.font      = `400 ${titleFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillStyle = symbolColor(0, 0.44);
    ctx.fillText(jobTitle, textX, titleTop);
  }

  ctx.restore();
}
