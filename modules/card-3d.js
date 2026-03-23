/**
 * 3D tilt-on-hover and click-to-flip controller for the card scene.
 *
 * Attaches mouse events to `sceneEl` and applies CSS transforms to `bodyEl`.
 * Tilt tracks the cursor at 60 fps via rAF; flip toggles on click.
 * On touch-only devices tilt is disabled but tap-to-flip still works.
 */

let flipped = false;
let sceneEl, bodyEl;

// Latest mouse state (updated by mousemove, consumed by rAF)
let mx = 0, my = 0, rafPending = false, hovering = false;

const MAX_TILT = 12; // degrees
const EASE_BACK = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
const EASE_FLIP = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';

const canHover = window.matchMedia('(hover: hover)').matches;

function applyTransform(rotY, rotX, transition) {
  if (transition) bodyEl.style.transition = transition;
  else            bodyEl.style.transition = 'none';
  const flipBase = flipped ? 180 : 0;
  bodyEl.style.transform = `rotateY(${flipBase + rotY}deg) rotateX(${rotX}deg)`;
}

function tick() {
  rafPending = false;
  if (!hovering) return;

  const rect = sceneEl.getBoundingClientRect();
  const nx = (mx - rect.left) / rect.width  * 2 - 1; // -1..1
  const ny = (my - rect.top)  / rect.height * 2 - 1;

  const tiltY = (flipped ? -1 : 1) * nx * MAX_TILT;
  const tiltX = -ny * MAX_TILT;

  applyTransform(tiltY, tiltX, null);
}

function onMouseMove(e) {
  mx = e.clientX;
  my = e.clientY;
  hovering = true;
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(tick);
  }
}

function onMouseLeave() {
  hovering = false;
  applyTransform(0, 0, EASE_BACK);
}

function onClick() {
  flipped = !flipped;
  applyTransform(0, 0, EASE_FLIP);
  sceneEl.dispatchEvent(new CustomEvent('card-flip', { detail: { flipped } }));
}

export function initCard3D(scene, body) {
  sceneEl = scene;
  bodyEl  = body;

  if (canHover) {
    sceneEl.addEventListener('mousemove',  onMouseMove);
    sceneEl.addEventListener('mouseleave', onMouseLeave);
  }
  sceneEl.addEventListener('click', onClick);
}

export function isFlipped() { return flipped; }

export function setFlipped(value) {
  flipped = !!value;
  applyTransform(0, 0, EASE_FLIP);
}
