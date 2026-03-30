/**
 * Renders the back face of the access card.
 *
 * Elements (top to bottom):
 *   1. Card body fill (same hue/lightness as front)
 *   2. Magnetic stripe
 *   3. Diagonal hatched pattern
 *   4. LIMINAL brand mark
 *   5. Decorative barcode
 *   6. Fine Print — absurd legalese (always present)
 *   7. Seal of Adequacy — circular certification stamp (rare, ~12%)
 *   8. Hologram — small geometric rosette in a corner (occasional, ~25%)
 *   9. Customer Disservice — unhelpful support info (occasional, ~20%)
 *   10. Card edge stroke
 */

import { makePRNG }             from './prng.js';
import { hsla, roundedRectPath } from './utils.js';
import {
  drawCardBodyGradient,
  drawCardEdge,
} from './background.js';

// ── Fine Print corpus (100 clauses) ────────────────────────────────────────────

const FINE_PRINT = [
  'Holder agrees that all elevator music is, in fact, a bop.',
  'Not valid on days ending in "y".',
  'If found, please return to the nearest parallel dimension.',
  'This card entitles the bearer to one (1) uncomfortable silence per quarter.',
  'Unauthorized duplication will be met with a sternly worded haiku.',
  'Card must be swiped with confidence or access will be denied ironically.',
  'The issuer is not responsible for existential crises triggered by fluorescent lighting.',
  'By holding this card you waive your right to a normal font size.',
  'Badge must be visible at all times, even in dreams.',
  'Do not taunt the access card.',
  'This card has been blessed by three (3) middle managers.',
  'Void where prohibited, permitted, or mildly tolerated.',
  'Holder acknowledges that "reply all" is never the answer.',
  'This card may or may not exist in a superposition until observed.',
  'The magnetic stripe contains your most embarrassing memory.',
  'Badge holder must not use card as an ice scraper, bookmark, or tiny sled.',
  'Possession of this card implies you know where the good coffee is.',
  'In the event of a fire drill, this card becomes a tiny fan.',
  'Card does not grant immunity from Monday mornings.',
  'Holder agrees to laugh at all jokes made by badge readers.',
  'Not redeemable for snacks, despite what the vending machine tells you.',
  'This card was manufactured with 100% recycled corporate jargon.',
  'The barcode above is purely decorative and knows it.',
  'Misuse of this card may result in a passive-aggressive email.',
  'Holder certifies they have read the terms (they have not).',
  'This card is sentient and judges your outfit daily.',
  'Do not expose to direct sunlight, moonlight, or middle management.',
  'Card must be renewed every 365.25 days to account for leap feelings.',
  'The holographic element is optional but its feelings are not.',
  'Holder surrenders all claim to the last donut in the break room.',
  'This card was printed on a Tuesday, which explains a lot.',
  'Unauthorized access attempts will be logged and mocked.',
  'By swiping, you agree to pretend you read this.',
  'Card carries no warranty, expressed, implied, or whispered.',
  'The issuer reserves the right to change the rules mid-sentence.',
  'Holder must not use this card to settle philosophical debates.',
  'This badge is load-bearing. Do not remove.',
  'Card functionality may vary with Mercury in retrograde.',
  'If this card stops working, have you tried turning yourself off and on again?',
  'Holder agrees that meetings could have been emails.',
  'This card is not a valid form of identification on Mars.',
  'Badge must not be used as a guitar pick, no matter how tempting.',
  'The fine print is aware that you are squinting.',
  'Cardholder waives all rights to complain about the thermostat.',
  'Issued under the authority of someone who was probably on vacation.',
  'This card contains zero calories but maximum bureaucracy.',
  'Not valid as a parking permit, ransom note, or coaster.',
  'Holder acknowledges the printer will always be out of toner.',
  'Card operates on vibes and a 2.4GHz frequency.',
  'Any resemblance to a functional security system is coincidental.',
  'This card self-destructs upon reading. Just kidding. Or am I?',
  'Badge holder must high-five the security guard on Fridays.',
  'The issuer is not liable for awkward elevator encounters enabled by this card.',
  'Cardholder must not exceed the recommended daily allowance of meetings.',
  'This card has been pre-loaded with mild disappointment.',
  'Do not fold, spindle, mutilate, or emotionally neglect this card.',
  'Card grants access to the building but not to happiness.',
  'Holder must maintain a minimum of two (2) unread emails at all times.',
  'This badge operates under the jurisdiction of whoever is closest to the thermostat.',
  'Not transferable. Also not particularly interesting.',
  'Cardholder is entitled to one existential crisis per fiscal year.',
  'This card believes in you, even when the printer doesn\'t.',
  'Badge is void if detached from a lanyard of at least moderate sadness.',
  'The issuer makes no guarantee that the cafeteria soup is, in fact, soup.',
  'Holder agrees to occasionally wonder what the barcode actually says.',
  'This card has been approved by a committee that took six months to name itself.',
  'Do not use this card as evidence that you are a real person.',
  'Card must be stored at room temperature or colder emotions.',
  'The security features on this card are classified as "vibes-based".',
  'Holder must not question why the badge photo looks like that.',
  'Continued use of this card constitutes agreement to disagree.',
  'This card is gluten-free but not responsibility-free.',
  'Badge expires when the holder does. No refunds.',
  'The issuer reserves the right to add more fine print without warning.',
  'Cardholder must not attempt to access floors that don\'t exist. You know which ones.',
  'This card was designed by committee during a lunch break.',
  'If card does not scan, try holding it with more conviction.',
  'Holder acknowledges that the stairwell smells weird and accepts it.',
  'Not a substitute for actual competence, charm, or a decent haircut.',
  'This card is monitored by an AI that is mostly just lonely.',
  'Badge holder is contractually obligated to say "living the dream" at least once a week.',
  'The magnetic stripe records your coffee consumption. We are concerned.',
  'Cardholder must not start a podcast about this card.',
  'Valid only within the observable universe. Terms vary by dimension.',
  'This card has more authority than your New Year\'s resolutions.',
  'Holder grants the card permission to vibrate ominously near deadlines.',
  'Badge must not be licked, regardless of what the internet says.',
  'The issuer is not responsible for doors that open to reveal more meetings.',
  'This card does not guarantee a window seat, or a window.',
  'Holder agrees that "synergy" is not a real word.',
  'Card was stress-tested by an intern named Kevin. Thanks, Kevin.',
  'Do not use as identification for time travel. It won\'t work yet.',
  'This badge is a conversation starter and a conversation ender.',
  'Cardholder must accept that the Wi-Fi password has changed again.',
  'The fine print appreciates your dedication to reading it.',
  'This card is carbon neutral but emotionally volatile.',
  'Holder must not challenge the card reader to a staring contest.',
  'Badge is secretly a receipt from the future. Check the back. Oh wait.',
  'Issued in good faith, mediocre hope, and questionable formatting.',
  'Terms subject to change whenever someone updates the shared doc.',
];

// ── Seal of Adequacy texts (20 seals) ──────────────────────────────────────────

const SEAL_TEXTS = [
  ['CERTIFIED', 'ADEQUATE'],
  ['MOSTLY', 'HARMLESS'],
  ['PROVISIONAL', 'HUMAN'],
  ['SENTIENT', '(PENDING REVIEW)'],
  ['EMPLOYEE OF', 'THE MILLENNIUM'],
  ['SATISFACTORY', 'AT BEST'],
  ['VAGUELY', 'QUALIFIED'],
  ['NOT A', 'ROBOT (PROBABLY)'],
  ['MEETS MINIMUM', 'REQUIREMENTS'],
  ['APPROVED BY', 'SOMEONE I GUESS'],
  ['OFFICIALLY', 'UNREMARKABLE'],
  ['EXCEEDED NO', 'EXPECTATIONS'],
  ['DISTINGUISHED', 'PARTICIPANT'],
  ['PREMIUM', 'MEDIOCRE'],
  ['REGULATION', 'COMPLIANT-ISH'],
  ['SENTIENT BEING', '(UNVERIFIED)'],
  ['VOTED MOST', 'LIKELY TO BADGE IN'],
  ['CERTIFIED', 'CHAIR OCCUPANT'],
  ['PROFESSIONAL', 'MEETING ATTENDEE'],
  ['RISK LEVEL:', 'MILD CONCERN'],
];

// ── Customer Disservice texts (pool of 15) ─────────────────────────────────────

const CUSTOMER_DISSERVICE = [
  ['For support, scream into the void.', 'Avg. wait time: \u221E minutes.'],
  ['Lost card? That sounds like', 'a you problem, honestly.'],
  ['Customer service hours:', 'the third Wednesday of never.'],
  ['For assistance, press 1.', 'Then press 2. Then give up.'],
  ['Your call is important to us.', 'That was a lie. We apologize.'],
  ['Report issues to:', 'someone.who" + "@cares.zero'],
  ['Help desk currently staffed by', 'one (1) emotionally unavailable pigeon.'],
  ['Replacement cards available', 'after completing a 47-page form.'],
  ['For urgent queries,', 'please fax your tears.'],
  ['Support bot status:', 'also confused.'],
  ['Dial 1-800-NOT-REAL', 'for imaginary assistance.'],
  ['All agents are busy', 'questioning their career choices.'],
  ['Email response time:', '3-5 business centuries.'],
  ['Badge issues? Try turning', 'your entire life off and on.'],
  ['Our FAQ has one answer:', '"Have you tried not losing it?"'],
];

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
  borderRadius       = 0.2,
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
  const maxRadius    = Math.min(cardWidth, cardHeight) / 2;
  const cornerRadius = maxRadius * borderRadius;
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

  // ── Feature roll — decide which easter eggs appear ────────────────────
  const featurePRNG = makePRNG(seed ^ 0xEA57E699);
  const showSeal       = featurePRNG.next() < 0.12;   // ~12% chance
  const showHologram   = featurePRNG.next() < 0.25;   // ~25% chance
  const showDisservice = featurePRNG.next() < 0.20;   // ~20% chance
  // Fine Print is always shown

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

  // ── Seal of Adequacy (rare) ──────────────────────────────────────────
  if (showSeal) {
    drawSealOfAdequacy(ctx, backPRNG, cardLeft, cardTop, cardWidth, cardHeight, patternTop, patternH, hue, saturation, isDark);
  }

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

  // ── Customer Disservice (occasional) ─────────────────────────────────
  if (showDisservice) {
    drawCustomerDisservice(ctx, backPRNG, cardLeft, cardTop, cardWidth, cardHeight, hue, saturation, isDark);
  }

  // ── Fine Print (always) ──────────────────────────────────────────────
  drawFinePrint(ctx, backPRNG, cardLeft, cardTop, cardWidth, cardHeight, hue, saturation, isDark);

  // ── Hologram (occasional) ────────────────────────────────────────────
  let holoBounds = null;
  if (showHologram) {
    holoBounds = drawHologram(ctx, backPRNG, cardLeft, cardTop, cardWidth, cardHeight, hue, saturation, isDark, patternTop, patternH);
  }

  // ── End card clip ──────────────────────────────────────────────────────
  ctx.restore();

  // ── Card edge ──────────────────────────────────────────────────────────
  drawCardEdge(ctx, geometry, hue, saturation, isDark);

  // Return hologram bounds as fractions of card dimensions (for CSS sheen overlay)
  return { holoBounds };
}


// ── Fine Print ─────────────────────────────────────────────────────────────────

function drawFinePrint(ctx, prng, cardLeft, cardTop, cardWidth, cardHeight, hue, saturation, isDark) {
  const shortSide = Math.min(cardWidth, cardHeight);
  const fontSize  = shortSide * 0.022;
  const lineH     = fontSize * 1.35;
  const margin    = cardWidth * 0.08;
  const maxW      = cardWidth - margin * 2;
  const topY      = cardTop + cardHeight * 0.895;
  const available = cardHeight * 0.10;          // space from topY to card bottom
  const maxLines  = Math.max(2, Math.floor(available / lineH));

  // Pick 4-6 clauses from the corpus
  const count   = prng.int(4, 6);
  const indices = [];
  for (let i = 0; i < count; i++) {
    indices.push(prng.int(0, FINE_PRINT.length - 1));
  }

  // Build a single paragraph string
  const paragraph = indices.map(i => FINE_PRINT[i]).join(' ');

  ctx.save();
  ctx.font         = `300 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.textBaseline = 'top';
  ctx.textAlign    = 'left';
  ctx.fillStyle    = hsla(hue, saturation * 0.3, isDark ? 65 : 35, isDark ? 0.28 : 0.30);

  // Word-wrap into lines
  const words = paragraph.split(' ');
  const lines = [];
  let currentLine = '';
  for (const word of words) {
    const test = currentLine ? currentLine + ' ' + word : word;
    const testW = measureText(ctx, test, fontSize);
    if (testW > maxW && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
    if (lines.length >= maxLines) break;
  }
  if (currentLine && lines.length < maxLines) lines.push(currentLine);

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], cardLeft + margin, topY + i * lineH);
  }
  ctx.restore();
}


// ── Seal of Adequacy ───────────────────────────────────────────────────────────

function drawSealOfAdequacy(ctx, prng, cardLeft, cardTop, cardWidth, cardHeight, patternTop, patternH, hue, saturation, isDark) {
  const sealIdx    = prng.int(0, SEAL_TEXTS.length - 1);
  const [line1, line2] = SEAL_TEXTS[sealIdx];
  const sealRadius = cardWidth * 0.09;
  // Position offset from brand mark — right side of hatched area
  const sealX      = cardLeft + cardWidth * 0.78;
  const sealY      = patternTop + patternH * 0.5;
  const alpha      = isDark ? 0.22 : 0.18;
  const textColor  = hsla(hue, saturation, isDark ? 70 : 30, alpha);
  const strokeColor = hsla(hue, saturation, isDark ? 65 : 35, alpha);

  ctx.save();

  // Outer double ring
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth   = sealRadius * 0.06;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(sealX, sealY, sealRadius * 0.88, 0, Math.PI * 2);
  ctx.lineWidth = sealRadius * 0.03;
  ctx.stroke();

  // Decorative notches around the outer ring
  const notchCount = 36;
  ctx.beginPath();
  for (let i = 0; i < notchCount; i++) {
    const angle = (i / notchCount) * Math.PI * 2;
    const inner = sealRadius * 0.90;
    const outer = sealRadius * 0.97;
    ctx.moveTo(sealX + Math.cos(angle) * inner, sealY + Math.sin(angle) * inner);
    ctx.lineTo(sealX + Math.cos(angle) * outer, sealY + Math.sin(angle) * outer);
  }
  ctx.lineWidth = sealRadius * 0.02;
  ctx.stroke();

  // Star in center (5-pointed)
  const starR = sealRadius * 0.2;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? starR : starR * 0.45;
    const method = i === 0 ? 'moveTo' : 'lineTo';
    ctx[method](sealX + Math.cos(angle) * r, sealY + Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fillStyle = strokeColor;
  ctx.fill();

  // Text — two lines centered
  const fontSize1 = sealRadius * 0.28;
  const fontSize2 = sealRadius * 0.22;
  ctx.textBaseline = 'top';
  ctx.textAlign    = 'center';
  ctx.fillStyle    = textColor;

  ctx.font = `700 ${fontSize1}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.fillText(line1, sealX, sealY - sealRadius * 0.62);

  ctx.font = `600 ${fontSize2}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.fillText(line2, sealX, sealY + sealRadius * 0.48);

  ctx.restore();
}


// ── Hologram ───────────────────────────────────────────────────────────────────

function drawHologram(ctx, prng, cardLeft, cardTop, cardWidth, cardHeight, hue, saturation, isDark, patternTop, patternH) {
  const size = cardWidth * 0.08;
  const pad  = cardWidth * 0.04;

  // Fixed top-right position, above the magnetic stripe
  // Consume PRNG to preserve sequence
  prng.int(0, 3);
  prng.int(0, 3);
  const cx = cardLeft + cardWidth - pad - size / 2;
  const cy = cardTop + pad + size / 2;

  const alpha = isDark ? 0.18 : 0.14;
  const hueShift = prng.int(-30, 30);

  ctx.save();

  // Clip to square
  ctx.beginPath();
  ctx.rect(cx - size / 2, cy - size / 2, size, size);
  ctx.clip();

  // Background shimmer
  ctx.fillStyle = hsla(hue + hueShift, saturation * 0.6, isDark ? 50 : 60, alpha * 0.4);
  ctx.fillRect(cx - size / 2, cy - size / 2, size, size);

  // Concentric circles
  const ringColor = hsla(hue + hueShift, saturation, isDark ? 70 : 40, alpha);
  ctx.strokeStyle = ringColor;
  ctx.lineWidth   = size * 0.012;
  for (let r = size * 0.08; r < size * 0.5; r += size * 0.065) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Radial spokes
  ctx.beginPath();
  const spokeCount = 12;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * size * 0.48, cy + Math.sin(angle) * size * 0.48);
  }
  ctx.stroke();

  // Hologram label text — short words, rendered large
  const fontSize = size * 0.15;
  ctx.font         = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.textBaseline = 'top';
  ctx.textAlign    = 'center';
  ctx.fillStyle    = hsla(hue + hueShift, saturation, isDark ? 75 : 30, alpha * 1.5);
  ctx.fillText('FAKE', cx, cy - size / 2 + size * 0.04);
  ctx.fillText('HOLO', cx, cy + size / 2 - fontSize - size * 0.04);

  // Square border
  ctx.strokeStyle = hsla(hue + hueShift, saturation, isDark ? 65 : 40, alpha * 1.2);
  ctx.lineWidth   = size * 0.025;
  ctx.beginPath();
  ctx.rect(cx - size / 2, cy - size / 2, size, size);
  ctx.stroke();

  ctx.restore();

  // Return bounds as fractions of card dimensions for the CSS sheen overlay
  return {
    left:   (cx - size / 2 - cardLeft) / cardWidth,
    top:    (cy - size / 2 - cardTop)  / cardHeight,
    width:  size / cardWidth,
    height: size / cardHeight,
  };
}


// ── Customer Disservice ────────────────────────────────────────────────────────

function drawCustomerDisservice(ctx, prng, cardLeft, cardTop, cardWidth, cardHeight, hue, saturation, isDark) {
  const idx   = prng.int(0, CUSTOMER_DISSERVICE.length - 1);
  const [line1, line2] = CUSTOMER_DISSERVICE[idx];

  const fontSize = cardWidth * 0.022;
  const topY     = cardTop + cardHeight * 0.71;
  const alpha    = isDark ? 0.25 : 0.28;

  ctx.save();
  ctx.font         = `400 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.textBaseline = 'top';
  ctx.textAlign    = 'center';
  ctx.fillStyle    = hsla(hue, saturation * 0.4, isDark ? 60 : 40, alpha);
  ctx.fillText(line1, cardLeft + cardWidth / 2, topY);
  ctx.fillText(line2, cardLeft + cardWidth / 2, topY + fontSize * 1.3);
  ctx.restore();
}


// ── Text measurement helper ────────────────────────────────────────────────────

function measureText(ctx, text, fontSize) {
  if (ctx.measureText) {
    const m = ctx.measureText(text);
    if (m && m.width) return m.width;
  }
  // Fallback: approximate character width for the system font at given size
  return text.length * fontSize * 0.48;
}
