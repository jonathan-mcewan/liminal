/**
 * Renders the person's name and job title near the bottom of the card.
 *
 * Layout is bottom-anchored: the text block sits a fixed margin above the card's
 * lower edge (clear of the rounded corners), with the two lines stacked using a
 * gap proportional to the name font size.
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
  const { cardLeft, cardTop, cardWidth, cardHeight } = geometry;
  const textLeft = cardLeft + cardWidth * 0.09;

  const nameFontSize  = cardWidth * 0.072;
  const titleFontSize = cardWidth * 0.048;
  const lineGap       = nameFontSize * 0.40; // space between bottom of name and top of title

  // Bottom of the text block: 8% up from the card's lower edge.
  // cornerRadius ≈ 10% of cardWidth ≈ 54px; 8% of cardHeight ≈ 69px — safely clear.
  const blockBottom = cardTop + cardHeight * 0.92;

  // Derive each line's top edge by stacking upward from blockBottom.
  // When both fields are present the name sits above the title with lineGap between them.
  // When only one is present it anchors at blockBottom on its own.
  const hasName  = personName.length > 0;
  const hasTitle = jobTitle.length   > 0;
  const hasBoth  = hasName && hasTitle;

  const titleTop = blockBottom - titleFontSize;
  const nameTop  = hasBoth
    ? titleTop - lineGap - nameFontSize
    : blockBottom - nameFontSize;

  ctx.save();
  ctx.textBaseline = 'top';
  ctx.textAlign    = 'left';

  if (hasName) {
    ctx.font      = `500 ${nameFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillStyle = symbolColor(0, 0.92);
    ctx.fillText(personName, textLeft, nameTop);
  }

  if (hasTitle) {
    ctx.font      = `400 ${titleFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillStyle = symbolColor(0, 0.44);
    ctx.fillText(jobTitle, textLeft, titleTop);
  }

  ctx.restore();
}
